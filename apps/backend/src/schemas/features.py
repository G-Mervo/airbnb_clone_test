from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Calendar schemas
class DateAvailability(BaseModel):
    available: bool
    base_price: float
    special_price: Optional[float] = None

class PropertyAvailability(BaseModel):
    property_id: int
    availability: Dict[str, DateAvailability]

class BlockDatesRequest(BaseModel):
    start_date: str
    end_date: str
    reason: Optional[str] = None

class PriceBreakdown(BaseModel):
    base_price: str
    cleaning_fee: str
    service_fee: str
    weekend_premium: str
    total: str

class PropertyPricing(BaseModel):
    property_id: int
    start_date: str
    end_date: str
    nights: int
    base_price_per_night: float
    base_price_total: float
    cleaning_fee: float
    service_fee: float
    weekend_premium: float
    total_price: float
    price_breakdown: PriceBreakdown

# Messaging schemas
class MessageUser(BaseModel):
    id: int
    first_name: str
    last_name: str
    profile_picture: Optional[str] = None

class PropertySummary(BaseModel):
    id: int
    title: str
    image: Optional[str] = None

class Message(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    read: bool

class ConversationSummary(BaseModel):
    id: int
    property_id: int
    host_id: int
    guest_id: int
    last_message: str
    last_message_time: datetime
    unread_count: int
    created_at: datetime
    property: PropertySummary
    host: MessageUser
    guest: MessageUser

class ConversationDetail(ConversationSummary):
    messages: List[Message]

class CreateConversationRequest(BaseModel):
    property_id: int
    guest_id: int
    initial_message: str

class SendMessageRequest(BaseModel):
    sender_id: int
    content: str

# Notification schemas
class Notification(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    related_id: int
    is_read: bool
    created_at: datetime

class NotificationCount(BaseModel):
    user_id: int
    unread_count: int

class NotificationSettings(BaseModel):
    user_id: int
    email_notifications: bool = True
    push_notifications: bool = True
    booking_reminders: bool = True
    message_notifications: bool = True
    review_reminders: bool = True
    payment_notifications: bool = True
