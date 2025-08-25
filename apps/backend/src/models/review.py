from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    
    # Ratings (1-5 scale)
    overall_rating = Column(Float, nullable=False)
    cleanliness_rating = Column(Float)
    accuracy_rating = Column(Float)
    communication_rating = Column(Float)
    location_rating = Column(Float)
    check_in_rating = Column(Float)
    value_rating = Column(Float)
    
    # Review content
    comment = Column(Text)
    private_comment = Column(Text)  # Only visible to host
    
    # Host response
    host_response = Column(Text)
    host_response_date = Column(DateTime)
    
    # Status
    is_public = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    guest = relationship("User", foreign_keys=[guest_id])
    property = relationship("Property", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")
