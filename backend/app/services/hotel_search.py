from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.schemas.public import SearchHotelsParams


class HotelSearchService:
    @staticmethod
    async def search(
        db: AsyncSession, params: SearchHotelsParams
    ) -> Tuple[List[Hotel], int]:
        """
        Executes an optimized, multi-faceted search query.
        Optionally joins room availability constraints when check-in/out are provided.
        """

        query = select(Hotel).options(selectinload(Hotel.rooms))
        conditions = []

        if params.destination:
            term = f"%{params.destination.strip().lower()}%"
            conditions.append(
                or_(
                    func.lower(Hotel.name).like(term),
                    func.lower(Hotel.location["city"].astext).like(term),
                    func.lower(Hotel.location["country"].astext).like(term),
                )
            )

        if params.property_types:
            conditions.append(Hotel.property_type.in_(params.property_types))

        if params.min_price_cents is not None:
            conditions.append(Hotel.min_price_cents >= params.min_price_cents)

        if params.max_price_cents is not None:
            conditions.append(Hotel.min_price_cents <= params.max_price_cents)

        if params.min_rating is not None:
            conditions.append(Hotel.average_rating >= params.min_rating)

        if params.free_cancellation_only:
            conditions.append(
                Hotel.policies["free_cancellation_hours"].astext.cast(func.integer) > 0
            )

        if params.amenities:
            for amenity_id in params.amenities:
                conditions.append(
                    Hotel.amenities.cast(func.text).ilike(f"%{amenity_id}%")
                )

        if params.check_in and params.check_out:
            requested_rooms = params.rooms or 1
            requested_guests = params.guests or 1

            overlap_subquery = (
                select(
                    Booking.room_type_id,
                    func.coalesce(func.sum(Booking.rooms_count), 0).label("booked_count"),
                )
                .where(
                    Booking.status != "cancelled",
                    Booking.check_in_date < params.check_out,
                    Booking.check_out_date > params.check_in,
                )
                .group_by(Booking.room_type_id)
                .subquery()
            )

            available_rooms_subquery = (
                select(RoomType.hotel_id)
                .outerjoin(
                    overlap_subquery,
                    RoomType.id == overlap_subquery.c.room_type_id,
                )
                .where(
                    (
                        RoomType.total_inventory - func.coalesce(overlap_subquery.c.booked_count, 0)
                    )
                    >= requested_rooms,
                    RoomType.max_occupancy >= requested_guests,
                )
                .distinct()
                .subquery()
            )

            conditions.append(Hotel.id.in_(select(available_rooms_subquery.c.hotel_id)))

        if conditions:
            query = query.where(and_(*conditions))

        if params.sort_by == "price_asc":
            query = query.order_by(Hotel.min_price_cents.asc())
        elif params.sort_by == "price_desc":
            query = query.order_by(Hotel.min_price_cents.desc())
        elif params.sort_by == "rating_desc":
            query = query.order_by(Hotel.average_rating.desc())
        else:
            query = query.order_by(Hotel.featured.desc(), Hotel.average_rating.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        offset = (params.page - 1) * params.page_size
        paginated_query = query.offset(offset).limit(params.page_size)
        items = (await db.execute(paginated_query)).scalars().all()

        return list(items), total
