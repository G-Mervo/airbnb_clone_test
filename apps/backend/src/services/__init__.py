"""
Service layer initialization
Provides centralized access to all services
"""

from .base_service import BaseService, ServiceError, ValidationError, NotFoundError, ConflictError
from .user_service import UserService
from .auth_service import AuthService
from .booking_service import BookingService
from .property_service import PropertyService
from .review_service import ReviewService
from .payment_service import PaymentService
from .communication_service import CommunicationService
from .room_service import RoomService

# Service instances for easy import
user_service = UserService()
auth_service = AuthService(user_service)
booking_service = BookingService()
property_service = PropertyService()
review_service = ReviewService()
review_service.enrich_review_with_guest = review_service.enrich_review_with_guest
payment_service = PaymentService()
communication_service = CommunicationService()
room_service = RoomService()

__all__ = [
    "BaseService",
    "ServiceError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    "UserService",
    "AuthService",
    "BookingService",
    "PropertyService",
    "ReviewService",
    "PaymentService",
    "CommunicationService",
    "user_service",
    "auth_service",
    "booking_service",
    "property_service",
    "review_service",
    "payment_service",
    "communication_service",
    "room_service"
]
