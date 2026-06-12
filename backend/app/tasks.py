"""Celery tasks — heavy audio work runs off the request path.

Workers are synchronous, so we use a sync SQLAlchemy session here (separate
from the app's async engine) and call the async analysis helpers via asyncio.run
(their bodies are pure-sync librosa calls).
"""
import os
import asyncio
import logging
from uuid import UUID
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session

from app.celery_app import celery_app
from app.config import settings
from app.models.track import Track
from app.models.preferences import TrackEmbedding
from app.services import audio_analysis, waveform, storage

logger = logging.getLogger(__name__)

_sync_engine = create_engine(settings.database_url_sync, pool_pre_ping=True)
SyncSession = sessionmaker(bind=_sync_engine, class_=Session, expire_on_commit=False)


def _resolve_local_path(track: Track) -> tuple[str, bool]:
    """Return (local_path, is_temp). Downloads from Supabase when needed."""
    if track.storage_key and storage.storage_enabled():
        tmp = storage.download_audio(track.storage_key)
        if tmp:
            return tmp, True
    if track.file_path and os.path.exists(track.file_path):
        return track.file_path, False
    raise FileNotFoundError(f"No accessible audio for track {track.id}")


@celery_app.task(name="analyze_track", bind=True, max_retries=2)
def analyze_track_task(self, track_id: str):
    db = SyncSession()
    temp_path = None
    try:
        track = db.execute(select(Track).where(Track.id == UUID(track_id))).scalar_one_or_none()
        if not track:
            return {"status": "not_found"}

        local_path, is_temp = _resolve_local_path(track)
        temp_path = local_path if is_temp else None

        # 1) Core analysis (BPM, key, energy, genre, cue points)
        analysis = asyncio.run(audio_analysis.analyze_track(local_path))
        for k, v in analysis.items():
            setattr(track, k, v)

        # 2) Waveform peaks -> storage
        peaks = waveform.generate_peaks(local_path)
        track.waveform_peaks = peaks
        wf_url = storage.upload_waveform(peaks, f"{track.id}.json")
        if wf_url:
            track.waveform_url = wf_url

        # 3) Audio embedding -> pgvector
        vec = asyncio.run(audio_analysis.compute_track_embedding(local_path))
        emb = db.execute(
            select(TrackEmbedding).where(TrackEmbedding.track_id == track.id)
        ).scalar_one_or_none()
        if emb:
            emb.vector = vec
        else:
            db.add(TrackEmbedding(track_id=track.id, vector=vec))

        track.is_analyzed = 1
        db.commit()
        logger.info(f"Analyzed track {track_id}: {analysis.get('bpm')} BPM, {analysis.get('key')}")
        return {"status": "done", "bpm": analysis.get("bpm"), "key": analysis.get("key")}

    except Exception as exc:
        db.rollback()
        track = db.execute(select(Track).where(Track.id == UUID(track_id))).scalar_one_or_none()
        if track:
            track.is_analyzed = 2
            db.commit()
        logger.error(f"Analysis failed for {track_id}: {exc}")
        raise self.retry(exc=exc, countdown=10)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        db.close()
