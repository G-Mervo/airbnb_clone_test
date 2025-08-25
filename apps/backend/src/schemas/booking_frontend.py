from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, date


class GuestCount(BaseModel):
    adults: int
    children: int
    infants: int
    pets: int


class RoomData(BaseModel):
    title: str
    location: str
    image: str
    price: float


class FrontendBookingCreate(BaseModel):
    roomId: str
    userId: int
    startDate: str
    endDate: str
    guestCount: GuestCount
    totalAmount: float
    roomData: RoomData
    bookingDate: str
    status: str = Field(default="pending")


class BookingResponse(BaseModel):
    id: int
    roomId: str
    userId: int
    startDate: str
    endDate: str
    guestCount: GuestCount
    totalAmount: float
    roomData: RoomData
    bookingDate: str
    status: str

    class Config:
        from_attributes = True
