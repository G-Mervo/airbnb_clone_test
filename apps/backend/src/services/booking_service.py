"""
Booking service for handling booking-related operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta

from .base_service import BaseService, ValidationError, NotFoundError, ConflictError
from utils.data_manager import bookings_manager, properties_manager, users_manager


class BookingService(BaseService):
    """Service for booking operations including creation, management, and validation"""

    def __init__(self):
        super().__init__(bookings_manager, "booking")
        self.properties_manager = properties_manager
        self.users_manager = users_manager

    def get_primary_file(self) -> str:
        return "bookings.json"

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate booking data

        Args:
            data: Booking data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data

        Raises:
            ValidationError: If validation fails
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            # Required fields for creation
            required_fields = ["property_id", "guest_id", "check_in", "check_out", "guests"]
            for field in required_fields:
                if field not in validated_data:
                    raise ValidationError(f"Field '{field}' is required")

            # Validate property exists
            property_id = validated_data["property_id"]
            property_data = self.properties_manager.find_by_id("rooms.json", property_id)
            if not property_data:
                raise ValidationError(f"Property with ID {property_id} not found")

            # Validate user exists
            guest_id = validated_data["guest_id"]
            guest_data = self.users_manager.find_by_id("users.json", guest_id)
            if not guest_data:
                raise ValidationError(f"User with ID {guest_id} not found")

            # Validate dates
            check_in = validated_data["check_in"]
            check_out = validated_data["check_out"]

            try:
                check_in_date = datetime.fromisoformat(check_in.replace('Z', '+00:00')).date()
                check_out_date = datetime.fromisoformat(check_out.replace('Z', '+00:00')).date()
            except ValueError:
                raise ValidationError("Invalid date format. Use ISO format (YYYY-MM-DD)")

            if check_in_date >= check_out_date:
                raise ValidationError("Check-out date must be after check-in date")

            if check_in_date < date.today():
                raise ValidationError("Check-in date cannot be in the past")

            # Validate guest count
            guests = validated_data["guests"]
            if guests < 1:
                raise ValidationError("Number of guests must be at least 1")

            max_guests = property_data.get("max_guests", 1)
            if guests > max_guests:
                raise ValidationError(f"Property can accommodate maximum {max_guests} guests")

            # Check availability
            if not self._check_availability(property_id, check_in_date, check_out_date):
                raise ConflictError("Property is not available for selected dates")

            # Set default status
            if "status" not in validated_data:
                validated_data["status"] = "pending"

        return validated_data

    def _check_availability(self, property_id: int, check_in: date, check_out: date) -> bool:
        """
        Check if property is available for given dates

        Args:
            property_id: Property ID
            check_in: Check-in date
            check_out: Check-out date

        Returns:
            True if available, False otherwise
        """
        try:
            existing_bookings = self.find_by_field("property_id", property_id)

            for booking in existing_bookings:
                if booking.get("status") in ["confirmed", "pending"]:
                    booking_check_in = datetime.fromisoformat(booking["check_in"].replace('Z', '+00:00')).date()
                    booking_check_out = datetime.fromisoformat(booking["check_out"].replace('Z', '+00:00')).date()

                    # Check for date overlap
                    if not (check_out <= booking_check_in or check_in >= booking_check_out):
                        return False

            return True
        except Exception as e:
            self.logger.error(f"Error checking availability: {e}")
            return False

    def get_user_bookings(self, user_id: int, status: Optional[str]=None) -> List[Dict[str, Any]]:
        """
        Get bookings for a specific user

        Args:
            user_id: User ID
            status: Optional status filter

        Returns:
            List of user bookings with property details
        """
        try:
            user_bookings = self.find_by_field("guest_id", user_id)

            if status:
                user_bookings = [b for b in user_bookings if b.get("status") == status]

            # Enrich with property details
            rooms = self.properties_manager.load("rooms.json")
            property_dict = {p["id"]: p for p in rooms}

            enriched_bookings = []
            for booking in user_bookings:
                # Transform booking data to match frontend expectations
                transformed_booking = {
                    "id": booking["id"],
                    "roomId": str(booking["room_id"]),
                    "userId": booking["guest_id"],
                    "startDate": booking.get("check_in_date") or booking.get("check_in"),
                    "endDate": booking.get("check_out_date") or booking.get("check_out"),
                    "guestCount": {
                        "adults": booking.get("number_of_guests") or booking.get("guests") or 1,
                        "children": 0,
                        "infants": 0,
                        "pets": 0
                    },
                    "totalAmount": booking["total_price"],
                    "bookingDate": booking.get("created_at", ""),
                    "status": booking["status"]
                }

                # Add property details
                property_data = property_dict.get(booking["room_id"])
                if property_data:
                    transformed_booking["roomData"] = {
                        "title": property_data.get("property_name", ""),
                        "location": f"{property_data.get('city', '')}, {property_data.get('state', '')}",
                        "image": property_data.get("images", [None])[0] if property_data.get("images") else None,
                        "price": property_data.get("price", 0)
                    }

                enriched_bookings.append(transformed_booking)

            return enriched_bookings
        except Exception as e:
            self.logger.error(f"Error getting user bookings: {e}")
            raise

    def get_property_bookings(self, property_id: int, status: Optional[str]=None) -> List[Dict[str, Any]]:
        """
        Get bookings for a specific property

        Args:
            property_id: Property ID
            status: Optional status filter

        Returns:
            List of property bookings with guest details
        """
        try:
            property_bookings = self.find_by_field("property_id", property_id)

            if status:
                property_bookings = [b for b in property_bookings if b.get("status") == status]

            # Enrich with guest details
            users = self.users_manager.load("users.json")
            user_dict = {u["id"]: u for u in users}

            enriched_bookings = []
            for booking in property_bookings:
                enriched_booking = booking.copy()
                guest_data = user_dict.get(booking["guest_id"])
                if guest_data:
                    enriched_booking["guest"] = {
                        "id": guest_data["id"],
                        "first_name": guest_data["first_name"],
                        "last_name": guest_data["last_name"],
                        "email": guest_data["email"],
                        "avatar": guest_data.get("avatar")
                    }
                enriched_bookings.append(enriched_booking)

            return enriched_bookings
        except Exception as e:
            self.logger.error(f"Error getting property bookings: {e}")
            raise

    def confirm_booking(self, booking_id: int) -> Dict[str, Any]:
        """
        Confirm a pending booking

        Args:
            booking_id: Booking ID

        Returns:
            Updated booking
        """
        booking = self.get_by_id(booking_id)

        if booking.get("status") != "pending":
            raise ValidationError("Only pending bookings can be confirmed")

        return self.update(booking_id, {"status": "confirmed"})

    def cancel_booking(self, booking_id: int, reason: Optional[str]=None) -> Dict[str, Any]:
        """
        Cancel a booking

        Args:
            booking_id: Booking ID
            reason: Optional cancellation reason

        Returns:
            Updated booking
        """
        booking = self.get_by_id(booking_id)

        if booking.get("status") in ["cancelled", "completed"]:
            raise ValidationError("Booking cannot be cancelled")

        update_data = {"status": "cancelled"}
        if reason:
            update_data["cancellation_reason"] = reason
            update_data["cancelled_at"] = datetime.now().isoformat()

        return self.update(booking_id, update_data)

    def calculate_total_price(self, booking_data: Dict[str, Any]) -> float:
        """
        Calculate total price for a booking

        Args:
            booking_data: Booking data with check_in, check_out, room_id

        Returns:
            Total price
        """
        try:
            property_data = self.properties_manager.find_by_id("rooms.json", booking_data["room_id"])
            if not property_data:
                raise ValidationError("Property not found")

            check_in = datetime.fromisoformat(booking_data["check_in"].replace('Z', '+00:00')).date()
            check_out = datetime.fromisoformat(booking_data["check_out"].replace('Z', '+00:00')).date()

            nights = (check_out - check_in).days
            price_per_night = property_data.get("price_per_night", 0)

            total_price = nights * price_per_night

            # Add service fee (10%)
            service_fee = total_price * 0.1

            # Add taxes (5%)
            taxes = total_price * 0.05

            return round(total_price + service_fee + taxes, 2)

        except Exception as e:
            self.logger.error(f"Error calculating price: {e}")
            raise ValidationError("Failed to calculate booking price")

    def _transform_frontend_booking_data(self, frontend_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform frontend booking data to backend format

        Args:
            frontend_data: Booking data from frontend

        Returns:
            Transformed booking data for backend
        """
        # Transform field names
        transformed_data = {
            "room_id": frontend_data.get("roomId"),
            "check_in": frontend_data.get("startDate") or frontend_data.get("check_in_date"),
            "check_out": frontend_data.get("endDate") or frontend_data.get("check_out_date"),
            "guests": (
                frontend_data.get("guestCount", {}).get("adults", 1) +
                frontend_data.get("guestCount", {}).get("children", 0)
            ) if "guestCount" in frontend_data else frontend_data.get("number_of_guests", 1),
            "base_price": frontend_data.get("roomData", {}).get("price") or frontend_data.get("base_price", 0),
            "total_price": frontend_data.get("totalAmount") or frontend_data.get("total_price", 0),
            "status": frontend_data.get("status", "pending"),
        }

        # Add any other fields that are directly compatible
        if "guest_id" in frontend_data:
            transformed_data["guest_id"] = frontend_data["guest_id"]

        if "cleaning_fee" in frontend_data:
            transformed_data["cleaning_fee"] = frontend_data["cleaning_fee"]

        if "service_fee" in frontend_data:
            transformed_data["service_fee"] = frontend_data["service_fee"]

        if "payment_status" in frontend_data:
            transformed_data["payment_status"] = frontend_data["payment_status"]

        return transformed_data

    def create_booking(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new booking with price calculation

        Args:
            booking_data: Booking data (can be in frontend or backend format)

        Returns:
            Created booking with calculated price
        """
        # Transform data if it's from frontend
        if "roomId" in booking_data or "startDate" in booking_data:
            booking_data = self._transform_frontend_booking_data(booking_data)

        # Calculate total price if not provided or if it's 0
        if booking_data.get("total_price", 0) == 0:
            total_price = self.calculate_total_price(booking_data)
            booking_data["total_price"] = total_price
        else:
            # Use provided total_price
            pass

        return self.create(booking_data)
