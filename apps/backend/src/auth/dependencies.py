"""
Authentication dependencies for FastAPI routes
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

from services import auth_service, user_service

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials=Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get current user from JWT token

    Args:
        credentials: HTTP Authorization credentials

    Returns:
        Current user data

    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        token = credentials.credentials
        user = auth_service.get_current_user_from_token(token)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: Dict[str, Any]=Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to get current active user

    Args:
        current_user: Current user from token

    Returns:
        Current active user data

    Raises:
        HTTPException: If user is not active
    """
    if not current_user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_host_user(
    current_user: Dict[str, Any]=Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Dependency to get current user who is a host

    Args:
        current_user: Current active user

    Returns:
        Current host user data

    Raises:
        HTTPException: If user is not a host
    """
    if not current_user.get('is_host', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host privileges required"
        )
    return current_user


async def get_current_verified_user(
    current_user: Dict[str, Any]=Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Dependency to get current verified user

    Args:
        current_user: Current active user

    Returns:
        Current verified user data

    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.get('is_verified', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account verification required"
        )
    return current_user
