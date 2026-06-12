"""Supabase Storage wrapper — audio files + waveform JSON.

Uses the service_role key (server-side only). Falls back to local disk when
Supabase is not configured, so the app still runs in pure-local dev mode.
"""
import os
import json
import tempfile
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

_client = None


_client_failed = False


def _get_client():
    global _client, _client_failed
    if _client is not None:
        return _client
    if _client_failed:
        return None
    if not settings.supabase_url or not settings.supabase_service_key:
        return None
    # service_role secret key required (sb_secret_... or the service_role JWT).
    # A publishable/anon key here means misconfiguration — fall back to local disk
    # instead of crashing the whole app on startup.
    try:
        from supabase import create_client
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    except Exception as e:
        logger.warning(
            f"Supabase Storage disabled, using local disk fallback: {e}. "
            "Check SUPABASE_SERVICE_KEY (must be the service_role secret key)."
        )
        _client_failed = True
        return None
    return _client


def storage_enabled() -> bool:
    return _get_client() is not None


def ensure_buckets() -> None:
    """Create audio + waveform buckets if missing. Safe to call on startup."""
    client = _get_client()
    if not client:
        return
    for bucket, public in [
        (settings.supabase_audio_bucket, False),
        (settings.supabase_waveform_bucket, True),
    ]:
        try:
            client.storage.create_bucket(
                bucket,
                options={"public": public, "file_size_limit": settings.max_file_size_mb * 1024 * 1024},
            )
            logger.info(f"Created storage bucket: {bucket}")
        except Exception:
            pass  # already exists


def upload_audio(local_path: str, key: str, content_type: str = "audio/mpeg") -> Optional[str]:
    """Upload an audio file. Returns a signed playback URL (1 year) or None."""
    client = _get_client()
    if not client:
        return None
    with open(local_path, "rb") as f:
        client.storage.from_(settings.supabase_audio_bucket).upload(
            key, f, {"content-type": content_type, "upsert": "true"}
        )
    signed = client.storage.from_(settings.supabase_audio_bucket).create_signed_url(
        key, 60 * 60 * 24 * 365
    )
    return signed.get("signedURL") or signed.get("signedUrl")


def download_audio(key: str) -> Optional[str]:
    """Download object to a temp file for analysis. Returns the temp path."""
    client = _get_client()
    if not client:
        return None
    data = client.storage.from_(settings.supabase_audio_bucket).download(key)
    suffix = os.path.splitext(key)[1] or ".mp3"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return tmp.name


def upload_waveform(peaks: list[float], key: str) -> Optional[str]:
    """Upload waveform peak JSON to the public waveform bucket. Returns public URL."""
    client = _get_client()
    if not client:
        return None
    payload = json.dumps({"peaks": peaks, "version": 1}).encode()
    client.storage.from_(settings.supabase_waveform_bucket).upload(
        key, payload, {"content-type": "application/json", "upsert": "true"}
    )
    return client.storage.from_(settings.supabase_waveform_bucket).get_public_url(key)


def delete_audio(key: str) -> None:
    client = _get_client()
    if not client or not key:
        return
    try:
        client.storage.from_(settings.supabase_audio_bucket).remove([key])
    except Exception as e:
        logger.warning(f"Failed to delete {key}: {e}")
