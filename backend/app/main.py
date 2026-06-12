from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text
import os
import logging
from app.config import settings
from app.database import engine, Base
from app.services import storage
from app.routers import auth, tracks, playlists, sets, recommendations, preferences

logging.basicConfig(level=logging.INFO)
LOCAL_UPLOAD_DIR = "uploads"


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)
    try:
        async with engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            except Exception:
                pass  # Supabase manages this; pooler connections lack superuser
            await conn.run_sync(Base.metadata.create_all)
        logging.info("Database tables OK")
    except Exception as e:
        logging.error(f"DB init failed — check DATABASE_URL env var: {e}")
    # Provision Supabase Storage buckets (no-op if already present or not configured)
    storage.ensure_buckets()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI-powered DJ assistant — audio analysis, smart recommendations, set generation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(tracks.router, prefix="/api/v1")
app.include_router(playlists.router, prefix="/api/v1")
app.include_router(sets.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(preferences.router, prefix="/api/v1")

# Serve locally-stored audio when Supabase Storage is not configured
if os.path.exists(LOCAL_UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=LOCAL_UPLOAD_DIR), name="uploads")


@app.get("/debug-config")
async def debug_config():
    from urllib.parse import urlparse
    url = settings.database_url
    try:
        parsed = urlparse(url)
        return {"scheme": parsed.scheme, "host": parsed.hostname, "port": parsed.port}
    except Exception as e:
        return {"error": str(e), "raw_prefix": url[:30]}


@app.get("/debug-db-error")
async def debug_db_error():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "connected"}
    except Exception as e:
        return {"error_type": type(e).__name__, "detail": str(e)[:500]}


@app.get("/health")
async def health():
    db_ok = False
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "version": settings.version,
        "db": "connected" if db_ok else "unreachable — set DATABASE_URL",
        "storage": "supabase" if storage.storage_enabled() else "local",
    }
