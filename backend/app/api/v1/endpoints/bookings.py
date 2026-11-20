import random
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.user import User
from app.schemas.booking import BookingRead, CancelBookingRequest, CreateBookingRequest, ModifyDatesRequest
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingRead)
async def create_booking(
    payload: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    nights = (payload.check_out_date - payload.check_in_date).days
    if nights <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be after check-in date",
        )

    # ATOMIC TRANSACTION WITH ROW LOCKING
    async with db.begin_nested():
        # 1. Pessimistic lock on RoomType (SELECT ... FOR UPDATE)
        room_query = (
            select(RoomType)
            .where(RoomType.id == payload.room_type_id)
            .with_for_update()
        )
        room_result = await db.execute(room_query)
        room = room_result.scalar_one_or_none()

        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room type not found")

        # 2. Check overlapping non-cancelled bookings
        overlap_query = select(func.coalesce(func.sum(Booking.rooms_count), 0)).where(
            Booking.room_type_id == payload.room_type_id,
            Booking.status != "cancelled",
            Booking.check_in_date < payload.check_out_date,
            Booking.check_out_date > payload.check_in_date,
        )
        booked_units = (await db.execute(overlap_query)).scalar() or 0
        available_units = room.total_inventory - booked_units

        # 3. Reject if room is oversold
        if available_units < payload.rooms_count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The selected room is no longer available for these dates.",
            )

        # 4. Fetch Hotel for snapshot
        hotel_result = await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))
        hotel = hotel_result.scalar_one_or_none()
        if not hotel:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

        # Calculate finances strictly in integer cents
        subtotal_cents = room.base_nightly_rate_cents * nights * payload.rooms_count
        taxes_cents = round(subtotal_cents * 0.14)
        cleaning_fee_cents = 4500  # $45.00
        total_cents = subtotal_cents + taxes_cents + cleaning_fee_cents

        booking_ref = f"KS-{random.randint(100000, 999999)}"
        now_utc = datetime.now(timezone.utc)

        # 5. Insert Booking
        new_booking = Booking(
            booking_reference=booking_ref,
            user_id=current_user.id,
            hotel_id=hotel.id,
            room_type_id=room.id,
            hotel_name=hotel.name,
            hotel_slug=hotel.slug,
            hotel_city=hotel.location.get("city", "Kyoto"),
            hotel_country=hotel.location.get("country", "Japan"),
            hotel_image=hotel.hero_image,
            room_name=room.name,
            room_image=room.images[0] if room.images else hotel.hero_image,
            check_in_date=payload.check_in_date,
            check_out_date=payload.check_out_date,
            nights=nights,
            adults=payload.adults,
            children=payload.children,
            rooms_count=payload.rooms_count,
            status="confirmed",
            price_breakdown={
                "nightly_rate_cents": room.base_nightly_rate_cents,
                "nights": nights,
                "subtotal_cents": subtotal_cents,
                "taxes_and_fees_cents": taxes_cents,
                "cleaning_fee_cents": cleaning_fee_cents,
                "discount_cents": 0,
                "total_cents": total_cents,
                "currency": "USD",
            },
            guest_info=payload.guest_info.model_dump(),
            payment={
                "transaction_id": f"tx_{random.randint(10000000, 99999999)}",
                "status": "succeeded",
                "card_last4": "4242",
                "card_brand": "Visa",
                "amount_cents": total_cents,
                "currency": "USD",
                "paid_at": now_utc.isoformat(),
            },
        )
        db.add(new_booking)
        await db.flush()

        event = BookingStatusEvent(
            booking_id=new_booking.id,
            status="confirmed",
            note="Reservation confirmed; inventory guaranteed via atomic lock",
            created_by="System",
        )
        db.add(event)

    await db.commit()
    await db.refresh(new_booking)

    # Reload with status history
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(Booking.id == new_booking.id)
    )
    booking_with_history = (await db.execute(query)).scalar_one()
    return BookingRead.model_validate(booking_with_history)


@router.get("/my", response_model=PaginatedResponse[BookingRead])
async def list_my_bookings(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(Booking.user_id == current_user.id)
    )

    if status and status != "all":
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    items = (await db.execute(query.offset(offset).limit(page_size))).scalars().all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[BookingRead](
        items=[BookingRead.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{id}", response_model=BookingRead)
async def get_booking(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where((Booking.id.cast(str) == id) | (Booking.booking_reference == id))
    )
    booking = (await db.execute(query)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to booking")

    return BookingRead.model_validate(booking)


@router.post("/{id}/cancel", response_model=BookingRead)
async def cancel_booking(
    id: str,
    payload: CancelBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where((Booking.id.cast(str) == id) | (Booking.booking_reference == id))
    )
    booking = (await db.execute(query)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if booking.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already cancelled")

    booking.status = "cancelled"
    booking.cancellation_reason = payload.reason
    booking.payment["status"] = "refunded"

    event = BookingStatusEvent(
        booking_id=booking.id,
        status="cancelled",
        note=f"Cancelled: {payload.reason}. Refund initiated.",
        created_by=current_user.full_name,
    )
    db.add(event)
    await db.commit()
    await db.refresh(booking)

    return BookingRead.model_validate(booking)
