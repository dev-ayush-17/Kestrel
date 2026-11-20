from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.room import RoomType
from app.schemas.rooms import RoomTypeRead

router = APIRouter(tags=["Rooms"])

@router.get("/hotels/{hotel_id}/rooms", response_model= List[RoomTypeRead])
async def get_hotel_rooms(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(RoomType).where(RoomType.hotel_id == hotel_id)
    result = await db.execute(query)
    return [RoomTypeRead.model_validate(r) for r in result.scalars().all()]

@router.get("/rooms/{room_id}", response_model=RoomTypeRead)
async def get_room(room_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(RoomType).where(RoomType.id == room_id)
    result = await db.execute(query)
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return RoomTypeRead.model_validate(room)
