from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class GuestInfoSchema(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    special_requests: Optional[str] = None
    estimated_arrival_time: Optional[str] = None


class CreateBookingRequest(BaseModel):
    hotel_id: UUID
    room_type_id: UUID
    check_in_date: date
    check_out_date: date
    adults: int
    children: int = 0
    rooms_count: int = 1
    guest_info: GuestInfoSchema
    payment_method_id: Optional[str] = None


class CancelBookingRequest(BaseModel):
    reason: str


class ModifyDatesRequest(BaseModel):
    new_check_in_date: date
    new_check_out_date: date


class UpdateBookingStatusRequest(BaseModel):
    status: str


class BookingStatusEventRead(BaseModel):
    id: UUID
    booking_id: UUID
    status: str
    note: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingRead(BaseModel):
    id: UUID
    booking_reference: str
    user_id: UUID
    hotel_id: UUID
    room_type_id: UUID
    hotel_name: str
    hotel_slug: str
    hotel_city: str
    hotel_country: str
    hotel_image: str
    room_name: str
    room_image: str
    check_in_date: date
    check_out_date: date
    nights: int
    adults: int
    children: int
    rooms_count: int
    status: str
    cancellation_reason: Optional[str] = None
    price_breakdown: dict
    guest_info: dict
    payment: dict
    status_history: List[BookingStatusEventRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True