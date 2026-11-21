from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.booking import BookingRead
from app.schemas.user import UserRead


class AdminMetricsSchema(BaseModel):
    total_revenue_cents: int
    total_bookings_count: int
    confirmed_bookings_count: int
    active_guests_count: int
    occupancy_rate_percent: float
    average_daily_rate_cents: int
    revenue_growth_percent: float


class MonthlyRevenuePoint(BaseModel):
    month: str
    revenue_dollars: int
    bookings_count: int


class OccupancyChartPoint(BaseModel):
    date: str
    occupancy_rate: int
    available_rooms: int


class AdminDashboardResponse(BaseModel):
    metrics: AdminMetricsSchema
    revenue_chart: List[MonthlyRevenuePoint]
    occupancy_chart: List[OccupancyChartPoint]
    recent_bookings: List[BookingRead]


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(customer|admin)$")


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class ModerateReviewActionRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")