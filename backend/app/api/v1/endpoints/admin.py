from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.review import Review
from app.models.room import RoomType
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardResponse,
    ModerateReviewActionRequest,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.schemas.booking import BookingRead, UpdateBookingStatusRequest
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelCreate, HotelRead, HotelUpdate
from app.schemas.review import ModerateReviewRequest, ReviewRead
from app.schemas.rooms import RoomTypeCreate, RoomTypeRead, RoomTypeUpdate
from app.schemas.user import UserRead
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Control"], dependencies=[Depends(require_admin)])


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    """"
    Computes real time occupancy, revenue, ADR and cohorts
    """

    return await AdminService.get_dashboard_data(db)


@router.get("/bookings", response_model=PaginatedResponse[BookingRead])
async def list_admin_bookings(
    search: Optional[str] = None,
    status: Optional[str] = None,
    hotel_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).options(selectinload(Booking.status_history))

    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            func.lower(Booking.booking_reference).like(term)
            | func.lower(Booking.hotel_name).like(term)
        )

    if status and status != "all":
        query = query.where(Booking.status == status)

    if hotel_id and hotel_id != "all":
        try:
            h_uuid = UUID(hotel_id)
            query = query.where(Booking.hotel_id == h_uuid)
        except ValueError:
            pass

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
        total_pages=total_pages,
    )


@router.patch("/bookings/{booking_id}/status", response_model=BookingRead)
async def update_booking_status(
    booking_id: UUID,
    payload: UpdateBookingStatusRequest,
    db: AsyncSession = Depends(get_db),
):
    booking = (
        await db.execute(
            select(Booking)
            .options(selectinload(Booking.status_history))
            .where(Booking.id == booking_id)
        )
    ).scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    new_status = payload.status
    booking.status = new_status
    event = BookingStatusEvent(
        booking_id=booking.id,
        status=new_status,
        note=f"Status updated to {new_status} by Admin",
        created_by="Admin Console",
    )
    db.add(event)
    await db.commit()
    await db.refresh(booking)

    return BookingRead.model_validate(booking)


# Admin Hotel CRUD
@router.post("/hotels", response_model=HotelRead, status_code=status.HTTP_201_CREATED)
async def create_hotel(
    payload: HotelCreate,
    db: AsyncSession = Depends(get_db),
):
    hotel = Hotel(
        slug=payload.slug,
        name=payload.name,
        tagline=payload.tagline,
        description=payload.description,
        property_type=payload.property_type,
        star_rating=payload.star_rating,
        average_rating=payload.average_rating,
        review_count=payload.review_count,
        featured=payload.featured,
        min_price_cents=payload.min_price_cents,
        currency=payload.currency,
        location=payload.location.model_dump(),
        policies=payload.policies.model_dump(),
        amenities=payload.amenities,
        images=payload.images,
        hero_image=payload.hero_image,
    )
    db.add(hotel)
    await db.commit()
    await db.refresh(hotel)
    return HotelRead.model_validate(hotel)


@router.patch("/hotels/{hotel_id}", response_model=HotelRead)
async def update_hotel(
    hotel_id: UUID,
    payload: HotelUpdate,
    db: AsyncSession = Depends(get_db),
):
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(hotel, field, val)

    await db.commit()
    await db.refresh(hotel)
    return HotelRead.model_validate(hotel)


@router.delete("/hotels/{hotel_id}")
async def delete_hotel(
    hotel_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    await db.delete(hotel)
    await db.commit()
    return {"success": True}


# Admin Rooms CRUD
@router.post("/hotels/{hotel_id}/rooms", response_model=RoomTypeRead, status_code=status.HTTP_201_CREATED)
async def create_room(
    hotel_id: UUID,
    payload: RoomTypeCreate,
    db: AsyncSession = Depends(get_db),
):
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    room = RoomType(
        hotel_id=hotel_id,
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        max_occupancy=payload.max_occupancy,
        bed_type=payload.bed_type,
        bed_count=payload.bed_count,
        size_sqm=payload.size_sqm,
        base_nightly_rate_cents=payload.base_nightly_rate_cents,
        currency=payload.currency,
        total_inventory=payload.total_inventory,
        images=payload.images,
        amenities=payload.amenities,
        features=payload.features,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return RoomTypeRead.model_validate(room)


@router.patch("/rooms/{room_id}", response_model=RoomTypeRead)
async def update_room(
    room_id: UUID,
    payload: RoomTypeUpdate,
    db: AsyncSession = Depends(get_db),
):
    room = (await db.execute(select(RoomType).where(RoomType.id == room_id))).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(room, field, val)

    await db.commit()
    await db.refresh(room)
    return RoomTypeRead.model_validate(room)


# Admin Review Moderation
@router.patch("/reviews/{review_id}/moderate", response_model=ReviewRead)
async def moderate_review(
    review_id: UUID,
    payload: ModerateReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    review = (await db.execute(select(Review).where(Review.id == review_id))).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    review.moderation_status = payload.status
    await db.commit()
    await AdminService.recalculate_hotel_reviews(db, review.hotel_id)
    await db.refresh(review)
    return ReviewRead.model_validate(review)


# Admin User Management
@router.get("/users", response_model=list[UserRead])
async def list_users(db: AsyncSession = Depends(get_db)):
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return [UserRead.model_validate(u) for u in users]


@router.patch("/users/{user_id}/role", response_model= UserRead)
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Promote or demote user account role
    """

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}/status", response_model=UserRead)
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate user account, immediately invalidating active sessions."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)
