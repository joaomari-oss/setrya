from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.database import get_db
from app.models.preferences import UserPreferences
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.learning_system import update_user_preferences

router = APIRouter(prefix="/preferences", tags=["preferences"])


class PreferencesResponse(BaseModel):
    preferred_bpm_min: float
    preferred_bpm_max: float
    preferred_genres: List[str] = []
    preferred_keys: List[str] = []
    preferred_energy_min: float
    preferred_energy_max: float
    mixing_style: Optional[str] = None
    transition_patterns: Dict[str, float] = {}

    model_config = {"from_attributes": True}


@router.get("/", response_model=PreferencesResponse)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        await db.flush()
    return prefs


@router.post("/refresh", response_model=PreferencesResponse)
async def refresh_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-learn preferences from the user's playlists + listening history."""
    prefs = await update_user_preferences(db, current_user.id)
    return prefs
