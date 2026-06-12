import httpx
from typing import Optional, List
from app.config import settings
import logging

logger = logging.getLogger(__name__)

TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE = "https://api.spotify.com/v1"


async def get_client_token() -> Optional[str]:
    if not settings.spotify_client_id or not settings.spotify_client_secret:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
        )
        if resp.status_code == 200:
            return resp.json().get("access_token")
    return None


async def search_track(query: str, limit: int = 10) -> List[dict]:
    token = await get_client_token()
    if not token:
        return []
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{API_BASE}/search",
            params={"q": query, "type": "track", "limit": limit},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            logger.warning(f"Spotify search failed: {resp.status_code}")
            return []
        items = resp.json().get("tracks", {}).get("items", [])
        return [_normalize_track(t) for t in items]


async def get_track_features(spotify_id: str) -> Optional[dict]:
    token = await get_client_token()
    if not token:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{API_BASE}/audio-features/{spotify_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code == 200:
            return resp.json()
    return None


def _normalize_track(t: dict) -> dict:
    artists = ", ".join(a["name"] for a in t.get("artists", []))
    return {
        "title": t.get("name", ""),
        "artist": artists,
        "album": t.get("album", {}).get("name"),
        "duration_ms": t.get("duration_ms"),
        "cover_url": (t.get("album", {}).get("images") or [{}])[0].get("url"),
        "preview_url": t.get("preview_url"),
        "external_id": t.get("id"),
        "external_source": "spotify",
    }
