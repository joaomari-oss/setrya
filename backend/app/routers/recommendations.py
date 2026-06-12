from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.track import Track
from app.models.preferences import UserPreferences
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.track import TrackResponse
from app.services.recommendation import get_compatible_tracks, get_embedding_similar_tracks, recommend_next_track

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/for-track/{track_id}", response_model=List[TrackResponse])
async def recommend_for_track(
    track_id: UUID,
    limit: int = Query(10, le=50),
    bpm_range: float = Query(10.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")

    prefs_result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = prefs_result.scalar_one_or_none()

    candidates = await recommend_next_track(db, track, [], prefs, limit=limit)
    return candidates


@router.get("/similar/{track_id}", response_model=List[TrackResponse])
async def similar_by_audio(
    track_id: UUID,
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Track).where(Track.id == track_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(404, "Track not found")

    similar = await get_embedding_similar_tracks(db, track, limit=limit)
    return [s["track"] for s in similar]


@router.get("/search/spotify")
async def search_spotify(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
):
    from app.integrations.spotify import search_track
    return await search_track(q, limit)


@router.get("/search/soundcloud")
async def search_soundcloud(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
):
    from app.integrations.soundcloud import search_track
    return await search_track(q, limit)
