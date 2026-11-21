from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import cached_endpoint
from app.core.database import get_db
from app.models.hotel import Hotel
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelRead
from app.schemas.public import SearchHotelsParams
from app.services.hotel_search import HotelSearchService

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=PaginatedResponse[HotelRead])
async def search_hotels(
    destination: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = Query(default=None, ge=1, le=10),
    rooms: Optional[int] = Query(default=None, ge=1, le=5),
    property_types: Optional[str] = None,
    min_price_cents: Optional[int] = Query(default=None, ge=0),
    max_price_cents: Optional[int] = Query(default=None, ge=0),
    min_rating: Optional[float] = Query(default=None, ge=1.0, le=5.0),
    free_cancellation_only: Optional[bool] = False,
    amenities: Optional[str] = None,
    sort_by: Optional[str] = Query(
        "recommended",
        pattern="^(recommended|price_asc|price_desc|rating_desc)$",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    types_list = [t.strip() for t in property_types.split(",")] if property_types else None
    amenities_list = [a.strip() for a in amenities.split(",")] if amenities else None

    search_params = SearchHotelsParams(
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        rooms=rooms,
        property_types=types_list,
        min_price_cents=min_price_cents,
        max_price_cents=max_price_cents,
        min_rating=min_rating,
        free_cancellation_only=free_cancellation_only,
        amenities=amenities_list,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    items, total = await HotelSearchService.search(db, search_params)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return PaginatedResponse[HotelRead](
        items=[HotelRead.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=List[HotelRead])
@cached_endpoint(ttl_seconds=300)
async def get_featured_hotels(db: AsyncSession = Depends(get_db)):
    """
    Returns curated featured hotels for the homepage showcase.
    Cached for 5 minutes.
    """
    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(Hotel.featured == True)
        .order_by(Hotel.average_rating.desc())
        .limit(4)
    )
    result = await db.execute(query)
    hotels = result.scalars().all()
    return [HotelRead.model_validate(h) for h in hotels]


@router.get("/{slug}", response_model=HotelRead)
async def get_hotel(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Returns detailed hotel data by slug or UUID.
    Eagerly loads rooms to prevent N+1 queries.
    """
    query = select(Hotel).options(selectinload(Hotel.rooms))
    try:
        hotel_uuid = UUID(slug)
        query = query.where(or_(Hotel.slug == slug, Hotel.id == hotel_uuid))
    except ValueError:
        query = query.where(Hotel.slug == slug)

    result = await db.execute(query)
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hotel with identifier '{slug}' was not found",
        )

    return HotelRead.model_validate(hotel)


@router.get("/{hotel_id}/similar", response_model=List[HotelRead])
async def get_similar_hotels(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Recommends 3 alternative hotels sharing the same city or property type.
    """
    current = (
        await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    ).scalar_one_or_none()

    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found"
        )

    city = current.location.get("city", "")

    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(
            Hotel.id != hotel_id,
            or_(
                Hotel.location["city"].astext == city,
                Hotel.property_type == current.property_type,
            ),
        )
        .order_by(Hotel.average_rating.desc())
        .limit(3)
    )

    result = await db.execute(query)
    similar = result.scalars().all()
    return [HotelRead.model_validate(h) for h in similar]
