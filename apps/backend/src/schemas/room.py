from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


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
    room_amenities: Optional[List[str]] = []  # Room-specific amenities
    is_available: bool = True
    description: Optional[str] = None
    sleep_bed_1_link: Optional[str] = None  # Link to bed image


class RoomCreate(RoomBase):
    house_id: int


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    room_type: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    beds: Optional[int] = None
    base_price: Optional[float] = None
    cleaning_fee: Optional[float] = None
    service_fee: Optional[float] = None
    security_deposit: Optional[float] = None
    room_amenities: Optional[List[str]] = None
    is_available: Optional[bool] = None
    description: Optional[str] = None


class RoomResponse(RoomBase):
    id: int
    house_id: int
    images: Optional[List[str]] = []  # Room-specific images
    created_at: datetime
    updated_at: Optional[datetime] = None

    # House information for context
    house_title: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    house_amenities: Optional[List[str]] = []

    class Config:
        from_attributes = True


class RoomDetail(RoomResponse):
    house: Optional[Dict[str, Any]] = None  # Full house information
    host: Optional[Dict[str, Any]] = None  # Host information
    average_rating: Optional[float] = None
    total_reviews: int = 0
    total_bookings: int = 0
    availability: Optional[Dict[str, Any]] = None


class RoomSearch(BaseModel):
    location: Optional[str] = None
    # Date filtering parameters
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    # Detailed guest capacity parameters
    guests: Optional[int] = None  # Total guests (fallback)
    adults: Optional[int] = None
    children: Optional[int] = None
    infants: Optional[int] = None
    pets: Optional[int] = None
    # Price filtering
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    # Property filtering
    room_type: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[Union[int, str]] = None
    bathrooms: Optional[Union[int, str]] = None

    @validator('bedrooms', 'bathrooms', pre=True)
    @classmethod
    def parse_any_as_none(cls, v):
        """Convert 'Any' string to None, parse integers, leave None as None"""
        if v is None:
            return None
        if isinstance(v, str) and v.lower() == 'any':
            return None
        if isinstance(v, str) and v.isdigit():
            return int(v)
        if isinstance(v, int):
            return v
        return None  # Invalid values become None (no filtering)

    instant_bookable: Optional[bool] = None
    # Additional availability filters
    min_stay_days: Optional[int] = None  # Minimum stay requirement in days
    max_stay_days: Optional[int] = None  # Maximum stay requirement in days
    # Other parameters
    house_id: Optional[int] = None  # Search rooms within specific house
    amenities: Optional[List[str]] = None
    page: int = 1
    limit: int = 20
    # Map bounds parameters for geographic search
    ne_lat: Optional[float] = None  # Northeast latitude
    ne_lng: Optional[float] = None  # Northeast longitude
    sw_lat: Optional[float] = None  # Southwest latitude
    sw_lng: Optional[float] = None  # Southwest longitude
    search_by_map: Optional[bool] = False  # Flag to indicate map-based search
    # Flexible search parameters
    flexible_months: Optional[List[int]] = None  # Selected month indices (0-11)
    stay_duration: Optional[str] = None  # "weekend", "week", "month"
    date_option: Optional[str] = None  # "dates", "month", "flexible"
    # Month mode specific parameters
    month_duration: Optional[int] = None  # Number of months for duration
    start_duration_date: Optional[datetime] = None  # Start date from circular slider
    date_flexibility: Optional[str] = None  # "exact", "1", "3", "7" (days)
    start_date_flexibility: Optional[str] = None  # Flexibility for start date
    end_date_flexibility: Optional[str] = None  # Flexibility for end date

    @validator('flexible_months', pre=True)
    @classmethod
    def validate_flexible_months(cls, v):
        """Validate flexible months are within 0-11 range"""
        if v is None:
            return None
        if isinstance(v, list):
            for month in v:
                if not isinstance(month, int) or month < 0 or month > 11:
                    raise ValueError('flexible_months must contain integers between 0 and 11')
        return v

    @validator('stay_duration', pre=True)
    @classmethod
    def validate_stay_duration(cls, v):
        """Validate stay duration is a valid option"""
        if v is None:
            return None
        valid_durations = ['weekend', 'week', 'month']
        if v not in valid_durations:
            raise ValueError(f'stay_duration must be one of: {valid_durations}')
        return v

    @validator('date_option', pre=True)
    @classmethod
    def validate_date_option(cls, v):
        """Validate date option is a valid option"""
        if v is None:
            return None
        valid_options = ['dates', 'month', 'flexible']
        if v not in valid_options:
            raise ValueError(f'date_option must be one of: {valid_options}')
        return v

    @validator('month_duration', pre=True)
    @classmethod
    def validate_month_duration(cls, v):
        """Validate month duration is a positive integer"""
        if v is None:
            return None
        if not isinstance(v, int) or v < 0 or v > 12:
            raise ValueError('month_duration must be an integer between 0 and 12')
        return v

    @validator('date_flexibility', 'start_date_flexibility', 'end_date_flexibility', pre=True)
    @classmethod
    def validate_flexibility(cls, v):
        """Validate date flexibility options"""
        if v is None:
            return None
        valid_flexibility = ['exact', '1', '2' , '3', '7', '14']
        if v not in valid_flexibility:
            raise ValueError(f'flexibility must be one of: {valid_flexibility}')
        return v


# For compatibility with current frontend expectations
class RoomListing(BaseModel):
    """Room listing that looks like current PropertyDetail for frontend compatibility"""
    id: int
    title: str  # Combines house title + room name
    description: str
    property_type: str  # From house
    room_type: str
    max_guests: int
    bedrooms: int
    bathrooms: float
    beds: int
    address: str  # From house
    city: str  # From house
    state: str  # From house
    country: str  # From house
    postal_code: Optional[str] = None  # From house
    latitude: Optional[float] = None  # From house
    longitude: Optional[float] = None  # From house
    base_price: float
    cleaning_fee: float
    service_fee: float
    security_deposit: float
    amenities: List[str]  # Combined house + room amenities
    house_rules: Optional[str] = None  # From house
    cancellation_policy: str  # From house
    check_in_time: str  # From house
    check_out_time: str  # From house
    is_instant_bookable: bool  # From house
    host_id: int  # From house
    is_active: bool
    images: List[str]  # Combined house + room images
    created_at: str
    updated_at: Optional[str] = None
    host: Optional[Dict[str, Any]] = None  # From house
    average_rating: Optional[float] = None
    total_reviews: int = 0
    total_bookings: int = 0
    # Additional fields for frontend compatibility
    rating: Optional[float] = None
    is_new: Optional[bool] = None
    is_guest_favorite: Optional[bool] = None
    filter: Optional[str] = None  # From house property_type
    section: Optional[int] = None
    house_id: int  # Reference to parent house
