from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.playlist import Playlist, PlaylistTrack
from app.models.preferences import UserPreferences
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.playlist import SetGeneratorRequest, SetGeneratorResponse, PlaylistResponse
from app.services.set_generator import generate_set
from app.services.learning_system import update_user_preferences
from app.schemas.track import TrackResponse
from app.schemas.playlist import PlaylistTrackItem

router = APIRouter(prefix="/sets", tags=["sets"])


@router.post("/generate", response_model=SetGeneratorResponse, status_code=201)
async def generate_dj_set(
    request: SetGeneratorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs_result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = prefs_result.scalar_one_or_none()

    try:
        result = await generate_set(
            db=db,
            track_count=request.track_count,
            target_bpm_min=request.target_bpm_min,
            target_bpm_max=request.target_bpm_max,
            target_genres=request.target_genres,
            energy_curve_name=request.energy_curve,
            seed_track_ids=request.seed_track_ids,
            user_preferences=prefs,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    tracks = result["tracks"]
    name = request.name or f"Set {current_user.name} — {len(tracks)} tracks"

    playlist = Playlist(
        user_id=current_user.id,
        name=name,
        is_auto_generated=True,
    )
    db.add(playlist)
    await db.flush()

    for i, track in enumerate(tracks):
        pt = PlaylistTrack(playlist_id=playlist.id, track_id=track.id, position=i)
        db.add(pt)
    await db.flush()
    await db.refresh(playlist)

    track_items = [
        PlaylistTrackItem(
            track=TrackResponse.model_validate(t),
            position=i,
        )
        for i, t in enumerate(tracks)
    ]

    playlist_resp = PlaylistResponse(
        id=playlist.id,
        name=playlist.name,
        description=None,
        cover_url=None,
        is_auto_generated=True,
        track_count=len(tracks),
        created_at=playlist.created_at,
        tracks=track_items,
    )

    # Async learn from this action
    await update_user_preferences(db, current_user.id)

    return SetGeneratorResponse(
        playlist=playlist_resp,
        energy_curve=result["energy_curve"],
        bpm_progression=result["bpm_progression"],
        key_progression=result["key_progression"],
        generation_notes=result["generation_notes"],
    )
