from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import json


# ============== HOUSE/PROPERTY SCHEMAS ==============

class HouseBase(BaseModel):
    """Base schema for a house/property (the main listing)"""
    title: str
    description: Optional[str] = None
    property_type: str  # "House", "Apartment", "Condo", "Villa", etc.
    address: str
    city: str
    state: str
    country: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: Optional[List[str]] = []  # Property-level amenities (Pool, Gym, etc.)
    house_rules: Optional[str] = None
    cancellation_policy: str = "flexible"
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"
    minimum_stay: int = 1
    maximum_stay: Optional[int] = None
    is_instant_bookable: bool = False


class HouseCreate(HouseBase):
    pass


class HouseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    house_rules: Optional[str] = None
    is_active: Optional[bool] = None
    is_instant_bookable: Optional[bool] = None


class HouseResponse(HouseBase):
    id: int
    host_id: int
    is_active: bool
    images: Optional[List[str]] = []  # Main property images
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_rooms: int = 0  # Number of bookable rooms

    class Config:
        from_attributes = True


class HouseDetail(HouseResponse):
    host: Dict[str, Any]
    average_rating: Optional[float] = None
    total_reviews: int = 0
    total_bookings: int = 0
    rooms: Optional[List["RoomResponse"]] = []  # List of available rooms


# ============== ROOM SCHEMAS ==============

class RoomBase(BaseModel):
    """Base schema for a room (bookable unit within a house)"""
    name: str  # "Master Bedroom", "Guest Room 1", "Entire Apartment", etc.
    room_type: str  # "Private room", "Shared room", "Entire place"
    max_guests: int
    bedrooms: int
    bathrooms: float
    beds: int
    base_price: float
    cleaning_fee: float = 0.0
    service_fee: float = 0.0
    security_deposit: float = 0.0
    room_amenities: Optional[List[str]] = []  # Room-specific amenities (Private bathroom, TV, etc.)
    is_available: bool = True


class RoomCreate(RoomBase):
    house_id: int


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    max_guests: Optional[int] = None
    base_price: Optional[float] = None
    cleaning_fee: Optional[float] = None
    service_fee: Optional[float] = None
    security_deposit: Optional[float] = None
    room_amenities: Optional[List[str]] = None
    is_available: Optional[bool] = None


class RoomResponse(RoomBase):
    id: int
    house_id: int
    images: Optional[List[str]] = []  # Room-specific images
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoomDetail(RoomResponse):
    house: Optional["HouseResponse"] = None  # Parent house information
    average_rating: Optional[float] = None
    total_reviews: int = 0
    total_bookings: int = 0


# ============== SEARCH SCHEMAS ==============

class HouseSearch(BaseModel):
    location: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    guests: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    property_type: Optional[str] = None
    amenities: Optional[List[str]] = None
    instant_bookable: Optional[bool] = None
    page: int = 1
    limit: int = 20


class RoomSearch(BaseModel):
    location: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    guests: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    room_type: Optional[str] = None
    house_id: Optional[int] = None  # Search rooms within specific house
    amenities: Optional[List[str]] = None
    page: int = 1
    limit: int = 20


# ============== LEGACY COMPATIBILITY ==============

# Keep the old PropertyDetail for backward compatibility
# This will represent a "house with a single room" scenario
class PropertyDetail(BaseModel):
    """Legacy compatibility - represents a house as a single bookable unit"""
    id: int
    title: str
    description: str
    property_type: str
    room_type: str
    max_guests: int
    bedrooms: int
    bathrooms: float
    beds: int
    address: str
    city: str
    state: str
    country: str
    postal_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_price: float
    cleaning_fee: float
    service_fee: float
    security_deposit: float
    amenities: List[str]
    house_rules: Optional[str] = None
    cancellation_policy: str
    check_in_time: str
    check_out_time: str
    is_instant_bookable: bool
    host_id: int
    is_active: bool
    images: List[str]
    created_at: str
    updated_at: Optional[str] = None
    host: Optional[Dict[str, Any]] = None
    average_rating: Optional[float] = None
    total_reviews: int = 0
    total_bookings: int = 0
    # Additional fields for compatibility
    rating: Optional[float] = None
    is_new: Optional[bool] = None
    is_guest_favorite: Optional[bool] = None
    filter: Optional[str] = None
    section: Optional[int] = None


# Update forward references
HouseDetail.model_rebuild()
RoomDetail.model_rebuild()
