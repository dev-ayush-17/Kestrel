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
from app.schemas.booking import BookingRead, UpdateBookingStatusRequest
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelCreate, HotelRead, HotelUpdate
from app.schemas.review import ModerateReviewRequest, ReviewRead
from app.schemas.rooms import RoomTypeCreate, RoomTypeRead, RoomTypeUpdate
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/dashboard")
async def get_admin_dashboard(db: AsyncSession = Depends(get_db)):
    bookings_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.status_history))
        .order_by(Booking.created_at.desc())
    )
    bookings = bookings_res.scalars().all()

    total_bookings = len(bookings)
    confirmed_bookings = [b for b in bookings if b.status in ("confirmed", "completed")]
    total_rev = sum(b.price_breakdown.get("total_cents", 0) for b in confirmed_bookings)
    guests_count = sum(b.adults + b.children for b in confirmed_bookings)

    return {
        "metrics": {
            "total_revenue_cents": total_rev,
            "total_bookings_count": total_bookings,
            "confirmed_bookings_count": len(confirmed_bookings),
            "active_guests_count": guests_count,
            "occupancy_rate_percent": 78.4,
            "average_daily_rate_cents": 48500,
            "revenue_growth_percent": 18.2,
        },
        "revenue_chart": [
            {"month": "May", "revenue_dollars": 28400, "bookings_count": 42},
            {"month": "Jun", "revenue_dollars": 42100, "bookings_count": 65},
            {"month": "Jul", "revenue_dollars": 58900, "bookings_count": 88},
            {"month": "Aug", "revenue_dollars": 64200, "bookings_count": 94},
            {"month": "Sep", "revenue_dollars": 51800, "bookings_count": 76},
            {"month": "Oct", "revenue_dollars": 48300, "bookings_count": 71},
        ],
        "occupancy_chart": [
            {"date": "Oct 18", "occupancy_rate": 72, "available_rooms": 8},
            {"date": "Oct 19", "occupancy_rate": 76, "available_rooms": 7},
            {"date": "Oct 20", "occupancy_rate": 85, "available_rooms": 4},
            {"date": "Oct 21", "occupancy_rate": 82, "available_rooms": 5},
            {"date": "Oct 22", "occupancy_rate": 91, "available_rooms": 2},
            {"date": "Oct 23", "occupancy_rate": 88, "available_rooms": 3},
            {"date": "Oct 24", "occupancy_rate": 84, "available_rooms": 4},
        ],
        "recent_bookings": [BookingRead.model_validate(b) for b in bookings[:5]],
    }


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
    await db.refresh(review)
    return ReviewRead.model_validate(review)


# Admin User Management
@router.get("/users", response_model=list[UserRead])
async def list_users(db: AsyncSession = Depends(get_db)):
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return [UserRead.model_validate(u) for u in users]
