import numpy as np
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.track import Track
from app.models.preferences import TrackEmbedding


# Compatible Camelot key pairs (direct neighbors on the wheel)
def camelot_compatible(key_a: str, key_b: str) -> tuple[bool, int]:
    if not key_a or not key_b:
        return False, 99
    try:
        num_a = int(key_a[:-1])
        mode_a = key_a[-1]
        num_b = int(key_b[:-1])
        mode_b = key_b[-1]
    except (ValueError, IndexError):
        return False, 99

    if mode_a == mode_b:
        dist = min(abs(num_a - num_b), 12 - abs(num_a - num_b))
        return dist <= 1, dist
    else:
        # Same number, different mode = compatible
        if num_a == num_b:
            return True, 0
        return False, 99


def bpm_compatible(bpm_a: float, bpm_b: float, tolerance: float = 10.0) -> bool:
    if not bpm_a or not bpm_b:
        return True
    diff = abs(bpm_a - bpm_b)
    # Also check half/double time
    half_diff = abs(bpm_a - bpm_b * 2)
    double_diff = abs(bpm_a * 2 - bpm_b)
    return diff <= tolerance or half_diff <= tolerance or double_diff <= tolerance


def score_compatibility(track_a: Track, track_b: Track) -> float:
    score = 0.0
    weights = {"bpm": 0.35, "key": 0.35, "energy": 0.20, "genre": 0.10}

    # BPM score
    if track_a.bpm and track_b.bpm:
        bpm_diff = abs(track_a.bpm - track_b.bpm)
        if bpm_diff <= 2:
            score += weights["bpm"] * 1.0
        elif bpm_diff <= 5:
            score += weights["bpm"] * 0.8
        elif bpm_diff <= 10:
            score += weights["bpm"] * 0.5
        else:
            score += weights["bpm"] * max(0, 1 - bpm_diff / 30)

    # Key score
    if track_a.key and track_b.key:
        compatible, dist = camelot_compatible(track_a.key, track_b.key)
        if dist == 0:
            score += weights["key"] * 1.0
        elif dist == 1:
            score += weights["key"] * 0.9
        elif compatible:
            score += weights["key"] * 0.7
        else:
            score += weights["key"] * max(0, 1 - dist / 6)

    # Energy score
    if track_a.energy is not None and track_b.energy is not None:
        energy_diff = abs(track_a.energy - track_b.energy)
        score += weights["energy"] * max(0, 1 - energy_diff * 2)

    # Genre score
    if track_a.genre and track_b.genre:
        if track_a.genre == track_b.genre:
            score += weights["genre"] * 1.0
        elif track_a.subgenre and track_b.subgenre and track_a.subgenre == track_b.subgenre:
            score += weights["genre"] * 0.8

    return round(score, 3)


def cosine_similarity(vec_a: list, vec_b: list) -> float:
    a = np.array(vec_a, dtype=float)
    b = np.array(vec_b, dtype=float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


async def get_compatible_tracks(
    db: AsyncSession,
    reference_track: Track,
    candidate_ids: Optional[List[UUID]] = None,
    limit: int = 20,
    bpm_range: float = 10.0,
) -> List[dict]:
    q = select(Track)
    if candidate_ids:
        q = q.where(Track.id.in_(candidate_ids))
    q = q.where(Track.id != reference_track.id)
    q = q.where(Track.is_analyzed == 1)

    result = await db.execute(q)
    candidates = result.scalars().all()

    scored = []
    for track in candidates:
        if not bpm_compatible(reference_track.bpm, track.bpm, bpm_range):
            continue
        score = score_compatibility(reference_track, track)
        scored.append({"track": track, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


async def get_embedding_similar_tracks(
    db: AsyncSession,
    reference_track: Track,
    limit: int = 20,
) -> List[dict]:
    """pgvector-native nearest-neighbor search by cosine distance.

    Runs entirely in Supabase Postgres — no Python-side loop, scales to large
    libraries and uses the ivfflat index defined in the Supabase SQL schema.
    """
    # Load reference embedding
    ref_q = await db.execute(
        select(TrackEmbedding.vector).where(TrackEmbedding.track_id == reference_track.id)
    )
    ref_vec = ref_q.scalar_one_or_none()
    if ref_vec is None:
        return []

    distance = TrackEmbedding.vector.cosine_distance(ref_vec).label("distance")
    q = (
        select(Track, distance)
        .join(TrackEmbedding, Track.id == TrackEmbedding.track_id)
        .where(Track.id != reference_track.id)
        .where(Track.is_analyzed == 1)
        .order_by(distance)
        .limit(limit)
    )
    result = await db.execute(q)
    return [
        {"track": track, "score": round(1.0 - float(dist), 3)}
        for track, dist in result.all()
    ]


async def recommend_next_track(
    db: AsyncSession,
    current_track: Track,
    used_track_ids: List[UUID],
    user_preferences=None,
    limit: int = 5,
) -> List[Track]:
    candidates = await get_compatible_tracks(db, current_track, limit=50)

    # Filter already used
    used_set = set(used_track_ids)
    candidates = [c for c in candidates if c["track"].id not in used_set]

    # Boost by user preferences
    if user_preferences and user_preferences.preferred_genres:
        for c in candidates:
            if c["track"].genre in user_preferences.preferred_genres:
                c["score"] = min(1.0, c["score"] * 1.15)

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return [c["track"] for c in candidates[:limit]]
