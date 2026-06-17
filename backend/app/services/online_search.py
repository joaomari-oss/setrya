"""Aggregate track search across every available online music source.

Queries all configured providers in parallel and merges the results, de-duped
by (title, artist). Each provider degrades to an empty list when it isn't
configured or errors, so the aggregate never fails as a whole.
"""
import asyncio
import logging
from typing import List, Optional

from app.config import settings
from app.integrations import deezer, spotify, soundcloud

logger = logging.getLogger(__name__)


def available_sources() -> List[str]:
    srcs = []
    if settings.deezer_enabled:
        srcs.append("deezer")
    if settings.spotify_client_id and settings.spotify_client_secret:
        srcs.append("spotify")
    if settings.soundcloud_client_id:
        srcs.append("soundcloud")
    return srcs


async def _safe(coro) -> List[dict]:
    try:
        return await coro
    except Exception as e:  # never let one provider break the aggregate
        logger.warning(f"Online source failed: {e}")
        return []


async def search_all(query: str, limit: int = 25, sources: Optional[List[str]] = None) -> List[dict]:
    active = sources or available_sources()
    tasks = []
    if "deezer" in active:
        tasks.append(_safe(deezer.search_track(query, limit)))
    if "spotify" in active:
        tasks.append(_safe(spotify.search_track(query, limit)))
    if "soundcloud" in active:
        tasks.append(_safe(soundcloud.search_track(query, limit)))

    results = await asyncio.gather(*tasks) if tasks else []

    merged: List[dict] = []
    seen = set()
    for batch in results:
        for t in batch:
            key = ((t.get("title") or "").strip().lower(), (t.get("artist") or "").strip().lower())
            if not key[0] or key in seen:
                continue
            seen.add(key)
            merged.append(t)
    return merged
