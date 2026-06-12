from typing import List, Optional, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.track import Track
from app.models.preferences import UserPreferences
from app.services.recommendation import recommend_next_track, score_compatibility
import logging

logger = logging.getLogger(__name__)

ENERGY_CURVES = {
    "standard": [0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0,
                 1.0, 0.95, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6, 0.5],
    "dark":      [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.85, 0.8, 0.85,
                  0.9, 0.95, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6],
    "euphoric":  [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.95, 1.0,
                  0.9, 1.0, 0.95, 0.9, 1.0, 0.85, 0.7, 0.6, 0.5, 0.4],
    "warm":      [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75,
                  0.8, 0.82, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4],
}


async def get_seed_track(
    db: AsyncSession,
    seed_ids: Optional[List[UUID]],
    bpm_min: float,
    bpm_max: float,
    genres: Optional[List[str]],
) -> Optional[Track]:
    if seed_ids:
        q = select(Track).where(Track.id == seed_ids[0]).where(Track.is_analyzed == 1)
        result = await db.execute(q)
        return result.scalar_one_or_none()

    q = select(Track).where(Track.is_analyzed == 1)
    if bpm_min and bpm_max:
        q = q.where(Track.bpm >= bpm_min).where(Track.bpm <= bpm_max)
    if genres:
        q = q.where(Track.genre.in_(genres))
    q = q.order_by(Track.energy.desc()).limit(1)
    result = await db.execute(q)
    return result.scalar_one_or_none()


def get_target_energy(position: int, total: int, curve: List[float]) -> float:
    if not curve:
        return 0.7
    idx = min(int((position / total) * len(curve)), len(curve) - 1)
    return curve[idx]


def select_best_for_energy(
    candidates: List[Track],
    target_energy: float,
    used_ids: set,
) -> Optional[Track]:
    candidates = [t for t in candidates if t.id not in used_ids]
    if not candidates:
        return None
    candidates.sort(key=lambda t: abs((t.energy or 0.5) - target_energy))
    return candidates[0]


async def generate_set(
    db: AsyncSession,
    track_count: int = 20,
    target_bpm_min: Optional[float] = None,
    target_bpm_max: Optional[float] = None,
    target_genres: Optional[List[str]] = None,
    energy_curve_name: str = "standard",
    seed_track_ids: Optional[List[UUID]] = None,
    user_preferences: Optional[UserPreferences] = None,
) -> Dict:
    curve = ENERGY_CURVES.get(energy_curve_name, ENERGY_CURVES["standard"])

    # Resolve BPM range from preferences if not supplied
    if user_preferences and not target_bpm_min:
        target_bpm_min = user_preferences.preferred_bpm_min
        target_bpm_max = user_preferences.preferred_bpm_max
    if not target_bpm_min:
        target_bpm_min = 120.0
    if not target_bpm_max:
        target_bpm_max = 145.0

    if user_preferences and not target_genres:
        target_genres = user_preferences.preferred_genres

    seed = await get_seed_track(db, seed_track_ids, target_bpm_min, target_bpm_max, target_genres)
    if not seed:
        raise ValueError("No analyzed tracks found matching criteria")

    tracks: List[Track] = [seed]
    used_ids = {seed.id}

    for i in range(1, track_count):
        target_energy = get_target_energy(i, track_count, curve)
        current = tracks[-1]
        next_candidates = await recommend_next_track(
            db, current, list(used_ids), user_preferences, limit=10
        )
        best = select_best_for_energy(next_candidates, target_energy, used_ids)
        if not best:
            logger.warning(f"No candidate found at position {i}, stopping early")
            break
        tracks.append(best)
        used_ids.add(best.id)

    energy_prog = [round(t.energy or 0.5, 3) for t in tracks]
    bpm_prog = [round(t.bpm or 128.0, 1) for t in tracks]
    key_prog = [t.key or "8B" for t in tracks]

    return {
        "tracks": tracks,
        "energy_curve": energy_prog,
        "bpm_progression": bpm_prog,
        "key_progression": key_prog,
        "generation_notes": f"Generated {len(tracks)}-track set using '{energy_curve_name}' energy curve.",
    }
