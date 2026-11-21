from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    availability,
    bookings,
    destinations,
    favorites,
    hotels,
    public,
    reviews,
    rooms,
)

api_router = APIRouter()


#Public & Catalog Routes
api_router.include_router(auth.router)
api_router.include_router(hotels.router)
api_router.include_router(rooms.router)
api_router.include_router(availability.router)
api_router.include_router(destinations.router)
api_router.include_router(public.router)


#User & Protected Routes
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(favorites.router)


#Administrative Console
api_router.include_router(admin.router)