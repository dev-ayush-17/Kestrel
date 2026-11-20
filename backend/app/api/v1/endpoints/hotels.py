from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.hotel import Hotel
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelRead

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=PaginatedResponse[HotelRead])
async def search_hotels(
    destination: Optional[str] = None,
    property_types: Optional[str] = None,
    min_price_cents: Optional[int] = None,
    max_price_cents: Optional[int] = None,
    min_rating: Optional[float] = None,
    free_cancellation_only: Optional[bool] = False,
    sort_by: Optional[str] = Query("recommended"),
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Hotel)

    if destination:
        term = f"%{destination.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Hotel.name).like(term),
                func.lower(Hotel.location["city"].astext).like(term),
                func.lower(Hotel.location["country"].astext).like(term),
            )
        )

    if property_types:
        types_list = [t.strip() for t in property_types.split(",") if t.strip()]
        if types_list:
            query = query.where(Hotel.property_type.in_(types_list))

    if min_price_cents is not None:
        query = query.where(Hotel.min_price_cents >= min_price_cents)

    if max_price_cents is not None:
        query = query.where(Hotel.min_price_cents <= max_price_cents)

    if min_rating is not None:
        query = query.where(Hotel.average_rating >= min_rating)

    if free_cancellation_only:
        query = query.where(
            Hotel.policies["free_cancellation_hours"].astext.cast(func.integer) > 0
        )

    if sort_by == "price_asc":
        query = query.order_by(Hotel.min_price_cents.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Hotel.min_price_cents.desc())
    elif sort_by == "rating_desc":
        query = query.order_by(Hotel.average_rating.desc())
    else:
        query = query.order_by(Hotel.featured.desc(), Hotel.average_rating.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    items_query = query.offset(offset).limit(page_size)
    items = (await db.execute(items_query)).scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse[HotelRead](
        items=[HotelRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=List[HotelRead])
async def get_featured_hotels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Hotel).where(Hotel.featured == True).order_by(Hotel.average_rating.desc()).limit(4)
    )
    return [HotelRead.model_validate(h) for h in result.scalars().all()]


@router.get("/{slug}", response_model=HotelRead)
async def get_hotel(slug: str, db: AsyncSession = Depends(get_db)):
    try:
        hotel_uuid = UUID(slug)
        query = select(Hotel).where((Hotel.slug == slug) | (Hotel.id == hotel_uuid))
    except ValueError:
        query = select(Hotel).where(Hotel.slug == slug)

    result = await db.execute(query)
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return HotelRead.model_validate(hotel)


@router.get("/{hotel_id}/similar", response_model=List[HotelRead])
async def get_similar_hotels(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Hotel).where(Hotel.id != hotel_id).order_by(Hotel.average_rating.desc()).limit(3)
    )
    return [HotelRead.model_validate(h) for h in result.scalars().all()]
