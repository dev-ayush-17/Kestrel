from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.schemas.hotel import HotelRead


class AddFavoriteRequest(BaseModel):
    hotel_id: UUID


class FavoriteRead(BaseModel):
    id: UUID
    user_id: UUID
    hotel_id: UUID
    hotel: HotelRead
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
