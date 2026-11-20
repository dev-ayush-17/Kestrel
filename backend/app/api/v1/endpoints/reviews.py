from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.hotel import Hotel
from app.models.review import Review
from app.models.user import User
from app.schemas.review import CreateReviewRequest, ReviewRatingSummary, ReviewRead

router = APIRouter(tags=["Reviews"])


@router.get("/hotels/{hotel_id}/reviews")
@router.get("/hotel/{hotel_id}/reviews")
async def get_hotel_reviews(hotel_id: UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(Review)
        .where(Review.hotel_id == hotel_id, Review.moderation_status == "approved")
        .order_by(Review.created_at.desc())
    )
    reviews = (await db.execute(query)).scalars().all()

    total = len(reviews)
    avg_rating = round(sum(r.overall_rating for r in reviews) / total, 2) if total > 0 else 5.0

    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        star = min(5, max(1, round(r.overall_rating)))
        distribution[star] += 1

    summary = ReviewRatingSummary(
        average_rating=avg_rating,
        total_reviews=total,
        rating_distribution=distribution,
        category_averages={
            "cleanliness": 5.0,
            "location": 5.0,
            "service": 5.0,
            "comfort": 5.0,
            "value": 4.8,
        },
    )

    return {
        "reviews": [ReviewRead.model_validate(r) for r in reviews],
        "summary": summary,
    }


@router.post("/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    hotel = (await db.execute(select(Hotel).where(Hotel.id == payload.hotel_id))).scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    review = Review(
        hotel_id=payload.hotel_id,
        booking_id=payload.booking_id,
        user_id=current_user.id,
        hotel_name=hotel.name,
        user_name=current_user.full_name,
        user_avatar=current_user.avatar_url,
        overall_rating=payload.overall_rating,
        title=payload.title,
        content=payload.content,
        categories=payload.categories.model_dump(),
        moderation_status="approved",
    )
    db.add(review)

    hotel.review_count += 1
    await db.commit()
    await db.refresh(review)

    return ReviewRead.model_validate(review)


@router.get("/reviews/my", response_model=list[ReviewRead])
async def list_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Review)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
    )
    reviews = (await db.execute(query)).scalars().all()
    return [ReviewRead.model_validate(r) for r in reviews]
