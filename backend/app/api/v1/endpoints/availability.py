from datetime import date
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.booking import Booking
from app.models.room import RoomType
from app.schemas.rooms import RoomAvailabilityRead

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.get("", response_model=List[RoomAvailabilityRead])
async def get_availability(
    hotel_id: UUID = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
    guests: int = Query(2),
    rooms: int = Query(1),
    db: AsyncSession = Depends(get_db),
):
    nights = (check_out - check_in).days
    if nights <= 0:
        nights = 1

    # 1. Fetch all room types belonging to this hotel
    rooms_query = select(RoomType).where(RoomType.hotel_id == hotel_id)
    rooms_list = (await db.execute(rooms_query)).scalars().all()

    # 2. Query overlapping active bookings for this date range
    # Formula: check_in < b.check_out AND check_out > b.check_in
    overlapping_query = (
        select(Booking.room_type_id, func.sum(Booking.rooms_count).label("booked_count"))
        .where(
            Booking.hotel_id == hotel_id,
            Booking.status != "cancelled",
            Booking.check_in_date < check_out,
            Booking.check_out_date > check_in,
        )
        .group_by(Booking.room_type_id)
    )
    overlap_results = (await db.execute(overlapping_query)).all()
    booked_map = {row.room_type_id: row.booked_count for row in overlap_results}

    # 3. Calculate remaining inventory per room
    availability_list = []
    for room in rooms_list:
        booked = booked_map.get(room.id, 0)
        available_units = max(0, room.total_inventory - booked)
        is_available = available_units >= rooms

        availability_list.append(
            RoomAvailabilityRead(
                room_type_id=room.id,
                hotel_id=hotel_id,
                available_units=available_units,
                is_available=is_available,
                nightly_rate_cents=room.base_nightly_rate_cents,
                total_cents=room.base_nightly_rate_cents * nights * rooms,
                nights=nights,
            )
        )

    return availability_list
