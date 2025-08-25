"""
Authentication routes for user registration, login, and profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Dict, Any
import logging

# Import services and schemas
from services import auth_service, user_service, ServiceError, ValidationError, NotFoundError, ConflictError
from schemas.auth_schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    TokenSchema,
    UserProfileSchema,
    UserUpdateSchema,
    UserListSchema,
    AuthResponseSchema,
    ErrorResponseSchema
)
from auth.dependencies import get_current_user, get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

# Constants for error messages
USER_NOT_FOUND_MSG = "User not found"
INTERNAL_ERROR_MSG = "Internal server error"
INVALID_CREDENTIALS_MSG = "Could not validate credentials"


@router.post("/register", response_model=AuthResponseSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegisterSchema):
    """
    Register a new user

    Args:
        user_data: User registration data

    Returns:
        User profile and success message

    Raises:
        HTTPException: If registration fails
    """
    try:
        # Register user through auth service
        user_profile = auth_service.register_user(user_data.dict())

        return {
            "message": "User registered successfully",
            "user": user_profile
        }

    except ValidationError as e:
        logger.error(f"Registration validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ConflictError as e:
        logger.error(f"Registration conflict error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ServiceError as e:
        logger.error(f"Registration service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to internal error"
        )


@router.post("/login", response_model=TokenSchema)
async def login(form_data: OAuth2PasswordRequestForm=Depends()):
    """
    Login user and return access token

    Args:
        form_data: OAuth2 password form with username (email) and password

    Returns:
        Access token and token type

    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Login user through auth service
        token_data = auth_service.login_user(form_data.username, form_data.password)
        return token_data

    except HTTPException:
        # Re-raise HTTP exceptions from auth service
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to internal error"
        )


@router.post("/login/json", response_model=TokenSchema)
async def login_json(user_data: UserLoginSchema):
    """
    Login user with JSON payload and return access token

    Args:
        user_data: User login data

    Returns:
        Access token and token type

    Raises:
        HTTPException: If authentication fails
    """
    try:
        # Login user through auth service
        token_data = auth_service.login_user(user_data.email, user_data.password)
        return token_data

    except HTTPException:
        # Re-raise HTTP exceptions from auth service
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to internal error"
        )

# NOTE: User management routes have been moved to users.py. Import and include users.router in your main app.


@router.post("/refresh", response_model=TokenSchema)
async def refresh_token(current_user: Dict[str, Any]=Depends(get_current_user)):
    """
    Refresh access token

    Args:
        current_user: Current authenticated user

    Returns:
        New access token
    """
    try:
        # Generate new token through auth service
        token_data = auth_service.create_access_token(
            data={"sub": current_user["email"], "user_id": current_user["id"]}
        )

        return {
            "access_token": token_data,
            "token_type": "bearer"
        }

    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )


@router.post("/logout")
async def logout(current_user: Dict[str, Any]=Depends(get_current_user)):
    """
    Logout user (client-side token removal)

    Args:
        current_user: Current authenticated user

    Returns:
        Success message
    """
    return {"message": "Successfully logged out"}
