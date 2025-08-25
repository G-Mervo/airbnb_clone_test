from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.base import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    
    # Dates
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    
    # Guests
    number_of_guests = Column(Integer, nullable=False)
    
    # Pricing
    base_price = Column(Float, nullable=False)
    cleaning_fee = Column(Float, default=0.0)
    service_fee = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    
    # Status
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Payment
    payment_intent_id = Column(String)
    stripe_payment_id = Column(String)
    
    # Cancellation
    cancelled_at = Column(DateTime)
    cancellation_reason = Column(Text)
    refund_amount = Column(Float, default=0.0)
    
    # Messages
    guest_message = Column(Text)
    host_message = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    guest = relationship("User", foreign_keys=[guest_id])
    property = relationship("Property", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)
