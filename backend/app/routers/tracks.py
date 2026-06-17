import os
import uuid
import shutil
import tempfile
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.track import Track
from app.models.preferences import TrackEmbedding
from app.schemas.track import TrackCreate, TrackResponse, TrackAnalysis, TrackCompatibility, TransitionSuggestion, TrackWaveform
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.recommendation import score_compatibility
from app.services.transition_ai import suggest_transition
from app.services import storage
from app.tasks import analyze_track_task
from app.config import settings
from uuid import UUID

router = APIRouter(prefix="/tracks", tags=["tracks"])

ALLOWED_AUDIO = {".mp3", ".wav", ".flac", ".aiff", ".m4a", ".ogg"}
LOCAL_UPLOAD_DIR = "uploads"
CONTENT_TYPES = {
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac",
    ".aiff": "audio/aiff", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
}


@router.post("/upload", response_model=TrackResponse, status_code=201)
async def upload_track(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    artist: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_AUDIO:
        raise HTTPException(400, f"Unsupported format. Allowed: {sorted(ALLOWED_AUDIO)}")

    # Stream upload to a temp file (size-guarded)
    file_size = 0
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp_path = tmp.name
    tmp.close()
    async with aiofiles.open(tmp_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > settings.max_file_size_mb * 1024 * 1024:
                os.remove(tmp_path)
                raise HTTPException(413, "File too large")
            await f.write(chunk)

    track_id = uuid.uuid4()
    storage_key = f"{current_user.id}/{track_id}{ext}"
    audio_url = None
    file_path = None

    if storage.storage_enabled():
        # Supabase Storage — upload first; returns None on network/bucket failure
        audio_url = storage.upload_audio(tmp_path, storage_key, CONTENT_TYPES.get(ext, "audio/mpeg"))

    if audio_url:
        os.remove(tmp_path)
    else:
        # Local fallback — Supabase disabled OR upload failed: keep file on disk for the worker
        os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(LOCAL_UPLOAD_DIR, f"{track_id}{ext}")
        # shutil.move (not os.replace) — the temp file and uploads/ are on
        # different mounts (Docker volume), so a rename would fail cross-device.
        shutil.move(tmp_path, file_path)
        storage_key = None
        audio_url = f"/uploads/{track_id}{ext}"

    track = Track(
        id=track_id,
        title=title or os.path.splitext(file.filename or "unknown")[0],
        artist=artist or "Unknown Artist",
        storage_key=storage_key,
        audio_url=audio_url,
        file_path=file_path,
        is_analyzed=0,
    )
    db.add(track)
    await db.flush()
    await db.refresh(track)

    # Hand heavy analysis to the Celery worker
    analyze_track_task.delay(str(track.id))

    return track


@router.get("/", response_model=List[TrackResponse])
async def list_tracks(
    search: Optional[str] = None,
    genre: Optional[str] = None,
    bpm_min: Optional[float] = None,
    bpm_max: Optional[float] = None,
    analyzed_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Track)
    if search:
        q = q.where(
            Track.title.ilike(f"%{search}%") | Track.artist.ilike(f"%{search}%")
        )
    if genre:
        q = q.where(Track.genre == genre)
    if bpm_min:
        q = q.where(Track.bpm >= bpm_min)
    if bpm_max:
        q = q.where(Track.bpm <= bpm_max)
    if analyzed_only:
        q = q.where(Track.is_analyzed == 1)
    q = q.offset(skip).limit(limit).order_by(Track.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")
    return track


@router.get("/{track_id}/analysis", response_model=TrackAnalysis)
async def get_track_analysis(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")
    if track.is_analyzed != 1:
        raise HTTPException(202, "Track not yet analyzed")
    return TrackAnalysis(
        bpm=track.bpm, key=track.key, key_standard=track.key_standard,
        energy=track.energy, danceability=track.danceability, valence=track.valence,
        loudness=track.loudness, genre=track.genre, subgenre=track.subgenre,
        cue_points=track.cue_points, mix_in_point=track.mix_in_point, mix_out_point=track.mix_out_point,
    )


@router.get("/{track_id}/waveform", response_model=TrackWaveform)
async def get_track_waveform(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")
    if not track.waveform_peaks:
        raise HTTPException(202, "Waveform not yet generated")
    return TrackWaveform(track_id=track_id, peaks=track.waveform_peaks, audio_url=track.audio_url)


@router.get("/compatibility/{track_a_id}/{track_b_id}", response_model=TrackCompatibility)
async def check_compatibility(
    track_a_id: UUID,
    track_b_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = await db.execute(select(Track).where(Track.id.in_([track_a_id, track_b_id])))
    tracks = {t.id: t for t in results.scalars().all()}
    if track_a_id not in tracks or track_b_id not in tracks:
        raise HTTPException(404, "One or both tracks not found")

    a, b = tracks[track_a_id], tracks[track_b_id]
    from app.services.recommendation import camelot_compatible
    key_compat, camelot_dist = camelot_compatible(a.key or "", b.key or "")

    return TrackCompatibility(
        track_a_id=track_a_id,
        track_b_id=track_b_id,
        bpm_diff=abs((a.bpm or 0) - (b.bpm or 0)),
        key_compatible=key_compat,
        camelot_distance=camelot_dist if camelot_dist != 99 else -1,
        energy_diff=abs((a.energy or 0) - (b.energy or 0)),
        overall_score=score_compatibility(a, b),
    )


@router.get("/transition/{track_a_id}/{track_b_id}", response_model=TransitionSuggestion)
async def get_transition_suggestion(
    track_a_id: UUID,
    track_b_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = await db.execute(select(Track).where(Track.id.in_([track_a_id, track_b_id])))
    tracks = {t.id: t for t in results.scalars().all()}
    if track_a_id not in tracks or track_b_id not in tracks:
        raise HTTPException(404, "One or both tracks not found")
    return suggest_transition(tracks[track_a_id], tracks[track_b_id])


@router.delete("/{track_id}", status_code=204)
async def delete_track(
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")
    if track.file_path and os.path.exists(track.file_path):
        os.remove(track.file_path)
    if track.storage_key:
        storage.delete_audio(track.storage_key)
    await db.delete(track)
