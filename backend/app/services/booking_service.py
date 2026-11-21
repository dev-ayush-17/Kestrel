import random
from datetime import datetime, timezone
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, BookingStatusEvent
from app.models.hotel import Hotel
from app.models.room import RoomType
from app.models.user import User
from app.schemas.booking import CreateBookingRequest, ModifyBookingDatesRequest
from app.services.pricing import PricingService


class BookingService:
    @staticmethod
    def generate_reference() -> str:
        """
        Generates human-readable booking reference e.g. KS-892147
        """
        return f"KS-{random.randint(100000, 999999)}"

    @classmethod 
    async def create_booking(
        cls,
        db: AsyncSession,
        payload: CreateBookingRequest,
        current_user: User,
    ) -> Booking:
        if payload.check_out_date <= payload.check_in_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out date must be after check in date",
            )

        room_query = (
            select(RoomType)
            .where(RoomType.id == payload.room_type_id)
            .with_for_update()
        )

        room = (await db.execute(room_query)).scalar_one_or_none()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected room type does not exist",
            )

        hotel = (
            await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))
        ).scalar_one_or_none()
        if not hotel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hotel does not exist",
            )

        overlap_query = select(
            func.coalesce(func.sum(Booking.rooms_count), 0)
        ).where(
            Booking.room_type_id == payload.room_type_id,
            Booking.status != "cancelled",
            Booking.check_in_date < payload.check_out_date,
            Booking.check_out_date > payload.check_in_date,
        )
        currently_booked = (await db.execute(overlap_query)).scalar() or 0

        available_units = room.total_inventory - currently_booked

        if available_units < payload.rooms_count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only {available_units} units available for the selected dates. Please adjust your reservation",
            )

        price_breakdown = PricingService.calculate_stay_price(
            base_nightly_rate_cents=room.base_nightly_rate_cents,
            check_in=payload.check_in_date,
            check_out=payload.check_out_date,
            rooms_count=payload.rooms_count,
            currency=room.currency,
        )

        booking_ref = cls.generate_reference()

        booking = Booking(
            booking_reference=booking_ref,
            user_id=current_user.id,
            hotel_id=hotel.id,
            room_type_id=room.id,
            hotel_name=hotel.name,
            hotel_slug=hotel.slug,
            hotel_city=hotel.location.get("city", ""),
            hotel_country=hotel.location.get("country", ""),
            hotel_image=hotel.hero_image,
            room_name=room.name,
            room_image=room.images[0] if room.images else hotel.hero_image,
            check_in_date=payload.check_in_date,
            check_out_date=payload.check_out_date,
            nights=price_breakdown["nights"],
            adults=payload.adults,
            children=payload.children,
            rooms_count=payload.rooms_count,
            status="confirmed",
            price_breakdown=price_breakdown,
            guest_info=payload.guest_info.model_dump(),
            payment={
                "transaction_id": f"tx_mock_{random.randint(10000, 99999)}",
                "status": "succeeded",
                "card_last4": "4242",
                "card_brand": "Visa",
                "amount_cents": price_breakdown["total_cents"],
                "currency": price_breakdown["currency"],
                "paid_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        db.add(booking)
        await db.flush()

        event = BookingStatusEvent(
            booking_id=booking.id,
            status="confirmed",
            note=f"Reservation confirmed for {booking.nights} night(s)",
            created_by=current_user.full_name,
        )
        db.add(event)

        await db.commit()
        await db.refresh(booking)

        query = (
            select(Booking)
            .options(selectinload(Booking.status_history))
            .where(Booking.id == booking.id)
        )
        return (await db.execute(query)).scalar_one()

    @classmethod
    async def modify_dates(
        cls,
        db: AsyncSession,
        booking_id: UUID,
        payload: ModifyBookingDatesRequest,
        current_user: User,
    ) -> Booking:
        if payload.new_check_out_date <= payload.new_check_in_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New check out date must be after new check in date",
            )

        booking = (
            await db.execute(
                select(Booking)
                .options(selectinload(Booking.status_history))
                .where(Booking.id == booking_id)
            )
        ).scalar_one_or_none()

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        if booking.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        if booking.status != "confirmed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify booking with status '{booking.status}'",
            )

        room = (
            await db.execute(
                select(RoomType)
                .where(RoomType.id == booking.room_type_id)
                .with_for_update()
            )
        ).scalar_one()

        overlap_query = select(
            func.coalesce(func.sum(Booking.rooms_count), 0)
        ).where(
            Booking.room_type_id == booking.room_type_id,
            Booking.id != booking.id,
            Booking.status != "cancelled",
            Booking.check_in_date < payload.new_check_out_date,
            Booking.check_out_date > payload.new_check_in_date,
        )
        other_booked = (await db.execute(overlap_query)).scalar() or 0

        if (room.total_inventory - other_booked) < booking.rooms_count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The requested room is not available for these modified dates.",
            )

        new_pricing = PricingService.calculate_stay_price(
            base_nightly_rate_cents=room.base_nightly_rate_cents,
            check_in=payload.new_check_in_date,
            check_out=payload.new_check_out_date,
            rooms_count=booking.rooms_count,
            currency=room.currency,
        )

        booking.check_in_date = payload.new_check_in_date
        booking.check_out_date = payload.new_check_out_date
        booking.nights = new_pricing["nights"]
        booking.price_breakdown = new_pricing

        event = BookingStatusEvent(
            booking_id=booking.id,
            status="confirmed",
            note=f"Dates modified to {payload.new_check_in_date} – {payload.new_check_out_date}.",
            created_by=current_user.full_name,
        )
        db.add(event)

        await db.commit()
        await db.refresh(booking)
        return booking
