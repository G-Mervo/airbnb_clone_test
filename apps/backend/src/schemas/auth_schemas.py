"""
Authentication schemas for request/response models
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
import re


class UserRegisterSchema(BaseModel):
    """Schema for user registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    first_name: str = Field(..., min_length=1, max_length=50, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number")

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip().title()

    class Config:
        schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "password": "securepassword123",
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+1234567890"
            }
        }


class UserLoginSchema(BaseModel):
    """Schema for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    class Config:
        schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "password": "securepassword123"
            }
        }


class TokenSchema(BaseModel):
    """Schema for authentication token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: Optional[int] = Field(None, description="Token expiration time in seconds")

    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class UserProfileSchema(BaseModel):
    """Schema for user profile response"""
    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number")
    bio: Optional[str] = Field(None, description="User bio")
    location: Optional[str] = Field(None, description="User location")
    profile_picture: Optional[str] = Field(None, description="User profile picture URL")
    is_host: bool = Field(default=False, description="Whether user is a host")
    is_verified: bool = Field(default=False, description="Whether user is verified")
    is_active: bool = Field(default=True, description="Whether user account is active")
    created_at: Optional[str] = Field(None, description="Account creation timestamp")

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "email": "john.doe@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+1234567890",
                "bio": "Travel enthusiast and host",
                "location": "San Francisco, CA",
                "profile_picture": "https://example.com/profile.jpg",
                "is_host": True,
                "is_verified": True,
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        }


class UserUpdateSchema(BaseModel):
    """Schema for updating user profile"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50, description="User first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=50, description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number")
    bio: Optional[str] = Field(None, max_length=500, description="User bio")
    location: Optional[str] = Field(None, max_length=100, description="User location")
    profile_picture: Optional[str] = Field(None, description="User profile picture URL")

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip().title() if v else v

    class Config:
        schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "phone_number": "+1234567890",
                "bio": "Updated bio",
                "location": "New York, NY",
                "profile_picture": "https://example.com/new-profile.jpg"
            }
        }


class UserListSchema(BaseModel):
    """Schema for user list item"""
    id: int = Field(..., description="User ID")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    profile_picture: Optional[str] = Field(None, description="User profile picture URL")
    is_host: bool = Field(default=False, description="Whether user is a host")
    is_verified: bool = Field(default=False, description="Whether user is verified")

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "first_name": "John",
                "last_name": "Doe",
                "profile_picture": "https://example.com/profile.jpg",
                "is_host": True,
                "is_verified": True
            }
        }


class AuthResponseSchema(BaseModel):
    """Schema for authentication response"""
    message: str = Field(..., description="Response message")
    user: UserProfileSchema = Field(..., description="User profile data")
    token: Optional[TokenSchema] = Field(None, description="Authentication token")

    class Config:
        schema_extra = {
            "example": {
                "message": "User registered successfully",
                "user": {
                    "id": 1,
                    "email": "john.doe@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "is_host": False,
                    "is_verified": False,
                    "is_active": True
                },
                "token": {
                    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                    "token_type": "bearer"
                }
            }
        }


class ErrorResponseSchema(BaseModel):
    """Schema for error responses"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

    class Config:
        schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid input data",
                "details": {
                    "field": "email",
                    "reason": "Invalid email format"
                }
            }
        }
