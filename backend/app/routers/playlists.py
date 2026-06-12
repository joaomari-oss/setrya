from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.playlist import Playlist, PlaylistTrack
from app.models.track import Track
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.playlist import PlaylistCreate, PlaylistUpdate, PlaylistResponse
from app.integrations.rekordbox import export_playlist_to_rekordbox_xml

router = APIRouter(prefix="/playlists", tags=["playlists"])


def _playlist_response(playlist: Playlist) -> PlaylistResponse:
    track_count = len(playlist.tracks) if playlist.tracks else 0
    tracks = None
    if playlist.tracks:
        from app.schemas.track import TrackResponse
        from app.schemas.playlist import PlaylistTrackItem
        tracks = [
            PlaylistTrackItem(
                track=TrackResponse.model_validate(pt.track),
                position=pt.position,
                transition_type=pt.transition_type,
                transition_notes=pt.transition_notes,
            )
            for pt in playlist.tracks if pt.track
        ]
    return PlaylistResponse(
        id=playlist.id,
        name=playlist.name,
        description=playlist.description,
        cover_url=playlist.cover_url,
        is_auto_generated=playlist.is_auto_generated,
        track_count=track_count,
        created_at=playlist.created_at,
        tracks=tracks,
    )


@router.post("/", response_model=PlaylistResponse, status_code=201)
async def create_playlist(
    data: PlaylistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    playlist = Playlist(user_id=current_user.id, **data.model_dump())
    db.add(playlist)
    await db.flush()
    await db.refresh(playlist)
    return _playlist_response(playlist)


@router.get("/", response_model=List[PlaylistResponse])
async def list_playlists(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        select(Playlist)
        .where(Playlist.user_id == current_user.id)
        .options(selectinload(Playlist.tracks).selectinload(PlaylistTrack.track))
        .order_by(Playlist.created_at.desc())
        .offset(skip).limit(limit)
    )
    result = await db.execute(q)
    playlists = result.scalars().all()
    return [_playlist_response(p) for p in playlists]


@router.get("/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(
    playlist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        select(Playlist)
        .where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
        .options(selectinload(Playlist.tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(q)
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(404, "Playlist not found")
    return _playlist_response(playlist)


@router.patch("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: UUID,
    data: PlaylistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id))
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(404, "Playlist not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(playlist, k, v)
    await db.flush()
    return _playlist_response(playlist)


@router.delete("/{playlist_id}", status_code=204)
async def delete_playlist(
    playlist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id))
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(404, "Playlist not found")
    await db.delete(playlist)


@router.post("/{playlist_id}/tracks/{track_id}")
async def add_track_to_playlist(
    playlist_id: UUID,
    track_id: UUID,
    position: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id).options(selectinload(Playlist.tracks)))
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(404, "Playlist not found")

    track_result = await db.execute(select(Track).where(Track.id == track_id))
    if not track_result.scalar_one_or_none():
        raise HTTPException(404, "Track not found")

    if position is None:
        position = len(playlist.tracks)

    pt = PlaylistTrack(playlist_id=playlist_id, track_id=track_id, position=position)
    db.add(pt)
    return {"status": "added", "position": position}


@router.delete("/{playlist_id}/tracks/{track_id}", status_code=204)
async def remove_track_from_playlist(
    playlist_id: UUID,
    track_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Playlist not found")

    pt_result = await db.execute(
        select(PlaylistTrack).where(
            PlaylistTrack.playlist_id == playlist_id,
            PlaylistTrack.track_id == track_id,
        )
    )
    pt = pt_result.scalar_one_or_none()
    if not pt:
        raise HTTPException(404, "Track not in playlist")
    await db.delete(pt)


@router.get("/{playlist_id}/export/rekordbox")
async def export_rekordbox(
    playlist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        select(Playlist)
        .where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
        .options(selectinload(Playlist.tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(q)
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(404, "Playlist not found")

    tracks = [pt.track for pt in playlist.tracks if pt.track]
    xml_content = export_playlist_to_rekordbox_xml(playlist.name, tracks)

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{playlist.name}.xml"'},
    )
