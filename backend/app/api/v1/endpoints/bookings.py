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
from app.schemas.booking import BookingRead, CancelBookingRequest, CreateBookingRequest, ModifyBookingDatesRequest
from app.schemas.common import PaginatedResponse
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Atomically reserve room units with concurrency check and price calculations
    """
    return await BookingService.create_booking(db, payload, current_user)


@router.get("/my", response_model=PaginatedResponse[BookingRead])
async def list_my_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    timeframe: Optional[str] = Query(None, pattern="^(upcoming|past|all)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List user reservations with tab filters (upcoming, past, cancelled)  
    """
    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(Booking.user_id == current_user.id)
    )

    today = func.current_date()

    if status_filter and status_filter != "all":
        query = query.where(Booking.status == status_filter)

    if timeframe == "upcoming":
        query = query.where(Booking.check_in_date >= today, Booking.status != "cancelled")
    elif timeframe == "past":
        query = query.where(Booking.check_out_date < today)

    query = query.order_by(Booking.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0

    offset = (page - 1) * page_size
    items = (await db.execute(query.offset(offset).limit(page_size))).scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0


    return PaginatedResponse[BookingRead](
        items=[BookingRead.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/{id}/modify-dates", response_model=BookingRead)
async def modify_booking_dates(
    id: UUID,
    payload: ModifyBookingDatesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reschedule stay dates with availability check and price re-computation.
    """
    return await BookingService.modify_dates(db, id, payload, current_user)


@router.post("/{id}/cancel", response_model=BookingRead)
async def cancel_booking(
    id: str,
    payload: CancelBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking_uuid = UUID(id)
        where_clause = (Booking.id == booking_uuid) | (Booking.booking_reference == id)
    except ValueError:
        where_clause = (Booking.booking_reference == id)

    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(where_clause)
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


@router.get("/{id}", response_model=BookingRead)
async def get_booking(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking_uuid = UUID(id)
        where_clause = (Booking.id == booking_uuid) | (Booking.booking_reference == id)
    except ValueError:
        where_clause = (Booking.booking_reference == id)

    query = (
        select(Booking)
        .options(selectinload(Booking.status_history))
        .where(where_clause)
    )
    booking = (await db.execute(query)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to booking")

    return BookingRead.model_validate(booking)
