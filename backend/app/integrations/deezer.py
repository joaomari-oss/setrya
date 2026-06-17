"""Deezer public API — no key required.

The workhorse for building DJ sets "from the internet": Deezer returns real
BPM on the track-detail endpoint plus a 30s MP3 preview we can run through
librosa for key/energy/genre. Search and detail are unauthenticated.
"""
import logging
from typing import List, Optional

from app.integrations.http import async_client

logger = logging.getLogger(__name__)

API_BASE = "https://api.deezer.com"


def _normalize(t: dict) -> dict:
    return {
        "title": t.get("title") or t.get("title_short") or "",
        "artist": (t.get("artist") or {}).get("name", "Unknown"),
        "album": (t.get("album") or {}).get("title"),
        "duration_ms": (t.get("duration") or 0) * 1000 or None,
        "cover_url": (t.get("album") or {}).get("cover_medium") or (t.get("album") or {}).get("cover"),
        "preview_url": t.get("preview") or None,
        "external_id": str(t.get("id")),
        "external_source": "deezer",
        "bpm": t.get("bpm") or None,   # only present on the detail endpoint
    }


async def search_track(query: str, limit: int = 10) -> List[dict]:
    try:
        async with async_client() as client:
            resp = await client.get(f"{API_BASE}/search", params={"q": query, "limit": limit})
            if resp.status_code != 200:
                logger.warning(f"Deezer search failed: {resp.status_code}")
                return []
            data = resp.json().get("data", [])
            return [_normalize(t) for t in data if t.get("preview")]
    except Exception as e:
        logger.warning(f"Deezer search error: {e}")
        return []


async def get_track_detail(deezer_id: str) -> Optional[dict]:
    """Track detail includes real BPM (0 when Deezer hasn't computed it)."""
    try:
        async with async_client() as client:
            resp = await client.get(f"{API_BASE}/track/{deezer_id}")
            if resp.status_code != 200:
                return None
            return _normalize(resp.json())
    except Exception as e:
        logger.warning(f"Deezer detail error for {deezer_id}: {e}")
        return None


async def download_preview(preview_url: str) -> Optional[bytes]:
    try:
        async with async_client(timeout=30) as client:
            resp = await client.get(preview_url)
            if resp.status_code == 200 and resp.content:
                return resp.content
    except Exception as e:
        logger.warning(f"Deezer preview download error: {e}")
    return None
