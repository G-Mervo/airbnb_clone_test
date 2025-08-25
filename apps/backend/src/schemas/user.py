from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: int
    is_host: bool
    is_verified: bool
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    date_of_birth: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
