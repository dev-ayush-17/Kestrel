from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    fields: Optional[dict] = None


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail
