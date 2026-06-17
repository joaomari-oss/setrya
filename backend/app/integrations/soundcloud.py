"""SoundCloud — metadata only (legal). Resolve public tracks + search.

NOTE: SoundCloud closed public API registration; many apps use a client_id
extracted from the web player. Provide one via SOUNDCLOUD_CLIENT_ID. We only
read public metadata + stream URLs — no downloading of copyrighted audio.
"""
from typing import Optional, List
from app.config import settings
from app.integrations.http import async_client
import logging

logger = logging.getLogger(__name__)

API_BASE = "https://api-v2.soundcloud.com"


async def _client_id() -> Optional[str]:
    return settings.soundcloud_client_id


async def search_track(query: str, limit: int = 10) -> List[dict]:
    cid = await _client_id()
    if not cid:
        return []
    async with async_client(timeout=15) as client:
        resp = await client.get(
            f"{API_BASE}/search/tracks",
            params={"q": query, "limit": limit, "client_id": cid},
        )
        if resp.status_code != 200:
            logger.warning(f"SoundCloud search failed: {resp.status_code}")
            return []
        collection = resp.json().get("collection", [])
        return [_normalize(t) for t in collection]


async def resolve_url(url: str) -> Optional[dict]:
    cid = await _client_id()
    if not cid:
        return None
    async with async_client(timeout=15) as client:
        resp = await client.get(f"{API_BASE}/resolve", params={"url": url, "client_id": cid})
        if resp.status_code == 200:
            return _normalize(resp.json())
    return None


def _normalize(t: dict) -> dict:
    return {
        "title": t.get("title", ""),
        "artist": (t.get("user") or {}).get("username", "Unknown"),
        "album": None,
        "duration_ms": t.get("duration"),
        "cover_url": t.get("artwork_url"),
        "preview_url": t.get("permalink_url"),
        "external_id": str(t.get("id")),
        "external_source": "soundcloud",
        "bpm": t.get("bpm"),
        "genre": t.get("genre"),
    }
