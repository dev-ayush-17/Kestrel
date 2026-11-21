from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserPasswordChange, UserRead, UserUpdate

router = APIRouter(prefix="/account", tags=["Customer Account"])


@router.get("/profile", response_model=UserRead)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user's profile details
    """
    return UserRead.model_validate(current_user)


@router.patch("/profile", response_model=UserRead)
async def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update name, phone or avatar url
    """
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    payload: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Secure password rotation validating the previous password
    """
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect"
        )

    if payload.new_password == payload.old_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from old password"
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()

    return {
        "success": True, "message": "Password changed successfully"
    }