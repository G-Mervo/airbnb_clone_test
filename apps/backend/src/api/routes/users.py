"""
User management routes for profile, update, listing, and public user info
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any
from services import user_service, ServiceError, ValidationError, NotFoundError
from schemas.auth_schemas import (
    UserProfileSchema,
    UserUpdateSchema,
    UserListSchema
)
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_active_user)])


@router.get("/me", response_model=UserProfileSchema)
async def get_current_user_profile(current_user: Dict[str, Any]=Depends(get_current_active_user)):
    """
    Get current user profile
    """
    try:
        user_profile = user_service.get_user_profile(current_user["id"])
        return user_profile
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve user profile")


@router.put("/me", response_model=UserProfileSchema)
async def update_current_user_profile(
    user_update: UserUpdateSchema,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """
    Update current user profile
    """
    try:
        update_data = user_update.dict(exclude_unset=True)
        updated_user = user_service.update(current_user["id"], update_data)
        return user_service.get_user_profile(updated_user["id"])
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update user profile")


@router.get("/", response_model=List[UserListSchema])
async def get_users(
    page: int=Query(1, ge=1, description="Page number (starts at 1)"),
    limit: int=Query(10, ge=1, le=100, description="Number of records to return")
):
    """
    Get all users (limited fields for public access)
    """
    try:
        skip = (page - 1) * limit
        users = user_service.get_all(skip, limit)
        return [
            {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "profile_picture": user.get("profile_picture"),
                "is_host": user.get("is_host", False),
                "is_verified": user.get("is_verified", False)
            }
            for user in users
        ]
    except ServiceError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve users")


@router.get("/{user_id}", response_model=UserProfileSchema)
async def get_user(user_id: int):
    """
    Get user by ID (public profile)
    """
    try:
        user = user_service.get_user_profile(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve user")
