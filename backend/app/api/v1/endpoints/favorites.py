from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.favorite import Favorite
from app.models.hotel import Hotel
from app.models.user import User
from app.schemas.favorite import AddFavoriteRequest, FavoriteRead

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=list[FavoriteRead])
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Favorite)
        .options(selectinload(Favorite.hotel))
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    favs = (await db.execute(query)).scalars().all()
    return [FavoriteRead.model_validate(f) for f in favs]


@router.post("", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    payload: AddFavoriteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if already in favorites
    query = (
        select(Favorite)
        .options(selectinload(Favorite.hotel))
        .where(
            Favorite.user_id == current_user.id,
            Favorite.hotel_id == payload.hotel_id,
        )
    )
    existing = (await db.execute(query)).scalar_one_or_none()
    if existing:
        return FavoriteRead.model_validate(existing)

    hotel = (await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    fav = Favorite(user_id=current_user.id, hotel_id=payload.hotel_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)

    # Attach loaded hotel for validation
    fav.hotel = hotel
    return FavoriteRead.model_validate(fav)


@router.delete("/{hotel_id}")
async def remove_favorite(
    hotel_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Favorite).where(
        Favorite.user_id == current_user.id,
        Favorite.hotel_id == hotel_id,
    )
    fav = (await db.execute(query)).scalar_one_or_none()
    if fav:
        await db.delete(fav)
        await db.commit()

    return {"success": True}
