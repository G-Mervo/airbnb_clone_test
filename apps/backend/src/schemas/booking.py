from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    room_id: int
    property_id: int
    check_in_date: datetime
    check_out_date: datetime
    number_of_guests: int
    base_price: float
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str = Field(default="pending")
    payment_status: Optional[str] = None
