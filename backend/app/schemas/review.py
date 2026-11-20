from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ReviewCategoriesSchema(BaseModel):
    cleanliness: float
    location: float
    service: float
    comfort: float
    value: float


class CreateReviewRequest(BaseModel):
    hotel_id: UUID
    booking_id: Optional[UUID] = None
    overall_rating: float
    title: str
    content: str
    categories: ReviewCategoriesSchema


class ReviewRead(BaseModel):
    id: UUID
    hotel_id: UUID
    hotel_name: Optional[str] = None
    user_id: UUID
    user_name: str
    user_avatar: Optional[str] = None
    overall_rating: float
    title: str
    content: str
    stay_date: str
    room_name: Optional[str] = None
    categories: dict
    helpful_count: int
    moderation_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ModerateReviewRequest(BaseModel):
    status: str  # "approved" | "rejected"


class ReviewRatingSummary(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict
    category_averages: dict