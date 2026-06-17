"""Build a DJ set from the internet.

Searches online music sources for a query, ingests the results as Track rows
(downloading each 30s preview and running it through the librosa pipeline for
real key/energy/genre, keeping the provider's BPM when it supplies one), then
sequences them with the same energy-curve + harmonic-mixing logic used for
local sets. Persisted Track rows are reused on subsequent calls.
"""
import asyncio
import os
import tempfile
import logging
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.track import Track, ExternalSource
from app.services import audio_analysis, online_search
from app.services.set_generator import ENERGY_CURVES, get_target_energy
from app.services.recommendation import score_compatibility
from app.integrations import deezer
from app.integrations.http import async_client

logger = logging.getLogger(__name__)

# Bound how much heavy work one request does.
MAX_INGEST = 24


def _analyze_file_sync(path: str) -> Optional[dict]:
    """Run the librosa pipeline in a worker thread (own event loop)."""
    try:
        return asyncio.run(audio_analysis.analyze_track(path))
    except Exception as e:
        logger.warning(f"Preview analysis failed: {e}")
        return None


async def _download(url: str) -> Optional[bytes]:
    try:
        async with async_client(timeout=30) as client:
            resp = await client.get(url)
            if resp.status_code == 200 and resp.content:
                return resp.content
    except Exception as e:
        logger.warning(f"Preview download failed: {e}")
    return None


async def _analyze_preview(src: str, preview_url: str) -> Optional[dict]:
    data = await deezer.download_preview(preview_url) if src == "deezer" else await _download(preview_url)
    if not data:
        return None
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    tmp.write(data)
    tmp.close()
    try:
        return await asyncio.to_thread(_analyze_file_sync, tmp.name)
    finally:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)


async def ingest_track(db: AsyncSession, meta: dict) -> Optional[Track]:
    """Create/refresh a Track from a search result. Returns it if usable for mixing."""
    src = meta["external_source"]
    ext_id = meta.get("external_id")
    if not ext_id:
        return None

    existing = await db.execute(
        select(Track).where(Track.external_source == ExternalSource(src), Track.external_id == ext_id)
    )
    track = existing.scalar_one_or_none()
    if track and track.is_analyzed == 1 and track.key:
        return track

    if not track:
        track = Track(
            title=(meta.get("title") or "Unknown")[:500],
            artist=(meta.get("artist") or "Unknown")[:500],
            album=(meta.get("album") or None),
            duration_ms=meta.get("duration_ms"),
            cover_url=meta.get("cover_url"),
            preview_url=meta.get("preview_url"),
            audio_url=meta.get("preview_url"),  # 30s preview is the playable source
            external_source=ExternalSource(src),
            external_id=ext_id,
            is_analyzed=0,
        )
        db.add(track)
        await db.flush()

    # Real BPM from the provider when available (Deezer detail endpoint has it).
    bpm_meta = meta.get("bpm")
    if src == "deezer" and not bpm_meta:
        detail = await deezer.get_track_detail(ext_id)
        if detail:
            bpm_meta = detail.get("bpm")

    # Key / energy / genre from librosa on the preview.
    if meta.get("preview_url"):
        analysis = await _analyze_preview(src, meta["preview_url"])
        if analysis:
            for k, v in analysis.items():
                setattr(track, k, v)

    if bpm_meta:
        track.bpm = float(bpm_meta)  # provider BPM beats a 30s-clip estimate

    if track.bpm and track.key:
        track.is_analyzed = 1
    elif track.bpm:
        # BPM only (no preview to analyze) — still mixable on tempo; neutral key.
        track.key = track.key or "8A"
        track.energy = track.energy if track.energy is not None else 0.6
        track.is_analyzed = 1
    else:
        track.is_analyzed = 2

    await db.flush()
    return track if track.is_analyzed == 1 else None


def sequence_set(pool: List[Track], track_count: int, curve_name: str) -> List[Track]:
    curve = ENERGY_CURVES.get(curve_name, ENERGY_CURVES["standard"])
    remaining = sorted(pool, key=lambda t: -(t.energy or 0.5))
    seq: List[Track] = [remaining.pop(0)]
    used = {seq[0].id}

    for i in range(1, min(track_count, len(pool))):
        target_e = get_target_energy(i, track_count, curve)
        current = seq[-1]
        cand = [t for t in remaining if t.id not in used]
        if not cand:
            break
        # Higher harmonic/BPM compatibility, closer to the target energy = better.
        cand.sort(key=lambda t: score_compatibility(current, t) - abs((t.energy or 0.5) - target_e), reverse=True)
        best = cand[0]
        seq.append(best)
        used.add(best.id)
        remaining.remove(best)
    return seq


async def build_online_set(
    db: AsyncSession,
    query: str,
    track_count: int = 10,
    energy_curve_name: str = "standard",
    sources: Optional[List[str]] = None,
) -> Dict:
    candidates = await online_search.search_all(query, limit=max(track_count * 3, 20), sources=sources)
    if not candidates:
        raise ValueError(
            "No tracks found online for that search. "
            "Deezer is always on; add Spotify/SoundCloud keys for more sources."
        )

    # Analyze a candidate pool a bit larger than the set (room to sequence), capped.
    pool_target = min(track_count + 6, MAX_INGEST)
    pool: List[Track] = []
    for meta in candidates:
        if len(pool) >= pool_target:
            break
        try:
            # Savepoint per track: a single bad ingest rolls back only itself,
            # instead of poisoning the whole request transaction.
            async with db.begin_nested():
                t = await ingest_track(db, meta)
        except Exception as e:
            logger.warning(f"Ingest failed for {meta.get('title')}: {e}")
            t = None
        if t:
            pool.append(t)

    if not pool:
        raise ValueError("Found tracks online but none could be analyzed for mixing.")

    tracks = sequence_set(pool, track_count, energy_curve_name)

    return {
        "tracks": tracks,
        "energy_curve": [round(t.energy or 0.5, 3) for t in tracks],
        "bpm_progression": [round(t.bpm or 128.0, 1) for t in tracks],
        "key_progression": [t.key or "8A" for t in tracks],
        "generation_notes": (
            f"Built {len(tracks)}-track set from the internet for \"{query}\" "
            f"using the '{energy_curve_name}' energy curve "
            f"({len(pool)} candidates from {', '.join(online_search.available_sources())})."
        ),
    }
