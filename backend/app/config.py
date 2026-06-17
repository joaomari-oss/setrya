from pathlib import Path

from pydantic_settings import BaseSettings
from typing import Optional

# Repo root .env works no matter the CWD uvicorn/celery is launched from
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    app_name: str = "Setrya API"
    version: str = "1.0.0"
    debug: bool = False

    # ----- Supabase Postgres -----
    # Use the "Transaction pooler" connection string from Supabase
    # (Project Settings -> Database -> Connection string -> URI).
    # asyncpg + Supabase pooler requires statement_cache_size=0 (handled in database.py).
    # Format: postgresql+asyncpg://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/setrya"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/setrya"

    # ----- Supabase API + Storage -----
    supabase_url: Optional[str] = None              # https://<ref>.supabase.co
    supabase_service_key: Optional[str] = None      # service_role key (server-side only!)
    supabase_anon_key: Optional[str] = None         # anon key (safe for client)
    supabase_audio_bucket: str = "tracks"
    supabase_waveform_bucket: str = "waveforms"

    # ----- Redis / Celery -----
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ----- Auth -----
    secret_key: str = "change-me-in-production-use-strong-random-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # ----- Storage limits -----
    max_file_size_mb: int = 500
    embedding_dim: int = 42

    # ----- External music APIs -----
    spotify_client_id: Optional[str] = None
    spotify_client_secret: Optional[str] = None
    soundcloud_client_id: Optional[str] = None
    beatport_api_key: Optional[str] = None
    # Deezer public API needs no key and returns real BPM + 30s preview — primary
    # source for the "build a set from the internet" feature. Toggle off to disable.
    deezer_enabled: bool = True
    # Verify TLS certs on outbound calls to music APIs. Set False on dev machines
    # behind a TLS-inspection proxy (e.g. Avast) that breaks cert chains.
    external_ssl_verify: bool = True

    # ----- CORS -----
    # Comma-separated env var. Kept as str because pydantic-settings JSON-parses
    # list-typed fields from env BEFORE validators run (plain strings crash startup).
    # CORS_ORIGINS=http://localhost:3000,https://setrya.vercel.app
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        # Later entries win; local .env (if any) overrides repo root .env
        env_file = (str(_ROOT_ENV), ".env")


settings = Settings()
