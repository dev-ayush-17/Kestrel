from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cached_endpoint
from app.core.database import get_db
from app.models.destination import Destination
from app.models.hotel import Hotel
from app.schemas.public import DestinationRead

router = APIRouter(prefix="/destinations", tags=["Destinations"])


@router.get("", response_model=List[DestinationRead])
@cached_endpoint(ttl_seconds=600)
async def list_destinations(db: AsyncSession = Depends(get_db)):
    """
    List all curated travel destinations with live property counts.
    """
    query = select(Destination).order_by(Destination.name.asc())
    destinations = (await db.execute(query)).scalars().all()

    results = []
    for dest in destinations:
        count_query = select(func.count(Hotel.id)).where(
            func.lower(Hotel.location["city"].astext) == dest.name.lower()
        )
        count = (await db.execute(count_query)).scalar() or 0
        dest.hotel_count = count
        results.append(dest)

    return [DestinationRead.model_validate(d) for d in results]


@router.get("/{slug}", response_model=DestinationRead)
async def get_destination(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve single destination metadata by URL slug.
    """
    query = select(Destination).where(Destination.slug == slug)
    dest = (await db.execute(query)).scalar_one_or_none()

    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{slug}' does not exist in our catalog",
        )

    count_query = select(func.count(Hotel.id)).where(
        func.lower(Hotel.location["city"].astext) == dest.name.lower()
    )
    dest.hotel_count = (await db.execute(count_query)).scalar() or 0

    return DestinationRead.model_validate(dest)
