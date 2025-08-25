"""
Property service for handling property-related operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import json

from .base_service import BaseService, ValidationError, NotFoundError
from utils.data_manager import properties_manager, reviews_manager, bookings_manager


class PropertyService(BaseService):
    """Service for property operations including search, details, and availability"""

    def __init__(self):
        super().__init__(properties_manager, "property")
        self.reviews_manager = reviews_manager
        self.bookings_manager = bookings_manager

    def get_primary_file(self) -> str:
        return "rooms.json"

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate property data

        Args:
            data: Property data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            required_fields = ["title", "description", "price_per_night", "city", "country", "property_type"]
            for field in required_fields:
                if field not in validated_data or not validated_data[field]:
                    raise ValidationError(f"Field '{field}' is required")

            # Validate price
            price = validated_data.get("price_per_night")
            if not isinstance(price, (int, float)) or price <= 0:
                raise ValidationError("Price per night must be a positive number")

            # Validate guest capacity
            max_guests = validated_data.get("max_guests", 1)
            if not isinstance(max_guests, int) or max_guests < 1:
                raise ValidationError("Maximum guests must be a positive integer")

        return validated_data

    def search_properties(self,
                         city: Optional[str]=None,
                         country: Optional[str]=None,
                         property_type: Optional[str]=None,
                         min_price: Optional[float]=None,
                         max_price: Optional[float]=None,
                         min_guests: Optional[int]=None,
                         check_in: Optional[str]=None,
                         check_out: Optional[str]=None,
                         skip: int=0,
                         limit: int=20) -> List[Dict[str, Any]]:
        """
        Search properties with multiple filters

        Args:
            city: City filter
            country: Country filter
            property_type: Property type filter
            min_price: Minimum price filter
            max_price: Maximum price filter
            min_guests: Minimum guest capacity
            check_in: Check-in date for availability
            check_out: Check-out date for availability
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of filtered properties with enriched data
        """
        try:
            properties = self.data_manager.load(self.get_primary_file())

            # Apply filters
            filtered_properties = properties

            if city:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("city", "").lower() == city.lower()]

            if country:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("country", "").lower() == country.lower()]

            if property_type:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("property_type", "").lower() == property_type.lower()]

            if min_price is not None:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("price_per_night", 0) >= min_price]

            if max_price is not None:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("price_per_night", 0) <= max_price]

            if min_guests is not None:
                filtered_properties = [p for p in filtered_properties
                                     if p.get("max_guests", 1) >= min_guests]

            # Check availability if dates provided
            if check_in and check_out:
                available_properties = []
                for prop in filtered_properties:
                    if self._check_property_availability(prop["id"], check_in, check_out):
                        available_properties.append(prop)
                filtered_properties = available_properties

            # Apply pagination
            total = len(filtered_properties)
            end_idx = min(skip + limit, total)
            paginated_properties = filtered_properties[skip:end_idx]

            # Enrich with additional data
            enriched_properties = []
            for prop in paginated_properties:
                enriched_prop = self._enrich_property_data(prop)
                enriched_properties.append(enriched_prop)

            return enriched_properties

        except Exception as e:
            self.logger.error(f"Error searching properties: {e}")
            raise

    def get_property_details(self, property_id: int) -> Dict[str, Any]:
        """
        Get detailed property information with reviews and availability

        Args:
            property_id: Property ID

        Returns:
            Detailed property data
        """
        property_data = self.get_by_id(property_id)

        # Enrich with additional data
        enriched_property = self._enrich_property_data(property_data, include_reviews=True)

        return enriched_property

    def _enrich_property_data(self, property_data: Dict[str, Any], include_reviews: bool=False) -> Dict[str, Any]:
        """
        Enrich property data with additional information

        Args:
            property_data: Base property data
            include_reviews: Whether to include detailed reviews

        Returns:
            Enriched property data
        """
        enriched_data = property_data.copy()

        try:
            # Add review statistics
            property_id = property_data["id"]
            reviews = self.reviews_manager.find_by_field("property_reviews.json", "property_id", property_id)

            if reviews:
                total_reviews = len(reviews)
                avg_rating = sum(r.get("overall_rating", 0) for r in reviews) / total_reviews

                enriched_data["review_stats"] = {
                    "total_reviews": total_reviews,
                    "average_rating": round(avg_rating, 2),
                    "rating_breakdown": self._calculate_rating_breakdown(reviews)
                }

                if include_reviews:
                    # Include recent reviews
                    sorted_reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)
                    enriched_data["recent_reviews"] = sorted_reviews[:5]
            else:
                enriched_data["review_stats"] = {
                    "total_reviews": 0,
                    "average_rating": 0,
                    "rating_breakdown": {}
                }

            # Add availability status for next 30 days
            enriched_data["availability_preview"] = self._get_availability_preview(property_id)

        except Exception as e:
            self.logger.error(f"Error enriching property data: {e}")

        return enriched_data

    def _calculate_rating_breakdown(self, reviews: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate average ratings by category"""
        if not reviews:
            return {}

        categories = ["cleanliness_rating", "accuracy_rating", "communication_rating",
                     "location_rating", "check_in_rating", "value_rating"]

        breakdown = {}
        for category in categories:
            ratings = [r.get(category, 0) for r in reviews if r.get(category)]
            if ratings:
                breakdown[category] = round(sum(ratings) / len(ratings), 2)

        return breakdown

    def _check_property_availability(self, property_id: int, check_in: str, check_out: str) -> bool:
        """
        Check if property is available for given dates

        Args:
            property_id: Property ID
            check_in: Check-in date string
            check_out: Check-out date string

        Returns:
            True if available, False otherwise
        """
        try:
            bookings = self.bookings_manager.find_by_field("bookings.json", "property_id", property_id)

            check_in_date = datetime.fromisoformat(check_in.replace('Z', '+00:00')).date()
            check_out_date = datetime.fromisoformat(check_out.replace('Z', '+00:00')).date()

            for booking in bookings:
                if booking.get("status") in ["confirmed", "pending"]:
                    booking_check_in = datetime.fromisoformat(booking["check_in"].replace('Z', '+00:00')).date()
                    booking_check_out = datetime.fromisoformat(booking["check_out"].replace('Z', '+00:00')).date()

                    # Check for date overlap
                    if not (check_out_date <= booking_check_in or check_in_date >= booking_check_out):
                        return False

            return True
        except Exception as e:
            self.logger.error(f"Error checking availability: {e}")
            return True  # Default to available if check fails

    def _get_availability_preview(self, property_id: int, days: int=30) -> Dict[str, bool]:
        """
        Get availability preview for the next N days

        Args:
            property_id: Property ID
            days: Number of days to check

        Returns:
            Dictionary with date strings as keys and availability as values
        """
        try:
            availability = {}
            today = date.today()

            bookings = self.bookings_manager.find_by_field("bookings.json", "property_id", property_id)
            confirmed_bookings = [b for b in bookings if b.get("status") in ["confirmed", "pending"]]

            for i in range(days):
                check_date = today + timedelta(days=i)
                date_str = check_date.isoformat()

                # Check if date falls within any booking
                is_available = True
                for booking in confirmed_bookings:
                    booking_check_in = datetime.fromisoformat(booking["check_in"].replace('Z', '+00:00')).date()
                    booking_check_out = datetime.fromisoformat(booking["check_out"].replace('Z', '+00:00')).date()

                    if booking_check_in <= check_date < booking_check_out:
                        is_available = False
                        break

                availability[date_str] = is_available

            return availability
        except Exception as e:
            self.logger.error(f"Error getting availability preview: {e}")
            return {}

    def get_property_reviews(self, property_id: int, skip: int=0, limit: int=10) -> List[Dict[str, Any]]:
        """
        Get reviews for a specific property

        Args:
            property_id: Property ID
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of reviews
        """
        try:
            reviews = self.reviews_manager.find_by_field("property_reviews.json", "property_id", property_id)

            # Sort by created_at descending
            sorted_reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)

            # Apply pagination
            end_idx = min(skip + limit, len(sorted_reviews))
            return sorted_reviews[skip:end_idx]

        except Exception as e:
            self.logger.error(f"Error getting property reviews: {e}")
            return []

    def get_similar_properties(self, property_id: int, limit: int=5) -> List[Dict[str, Any]]:
        """
        Get similar properties based on location and type

        Args:
            property_id: Property ID
            limit: Maximum number of similar properties

        Returns:
            List of similar properties
        """
        try:
            target_property = self.get_by_id(property_id)
            all_properties = self.data_manager.load(self.get_primary_file())

            # Filter by same city and property type, excluding the target property
            similar_properties = [
                p for p in all_properties
                if p["id"] != property_id
                and p.get("city") == target_property.get("city")
                and p.get("property_type") == target_property.get("property_type")
            ]

            # Sort by price similarity
            target_price = target_property.get("price_per_night", 0)
            similar_properties.sort(key=lambda x: abs(x.get("price_per_night", 0) - target_price))

            # Enrich and return limited results
            enriched_similar = []
            for prop in similar_properties[:limit]:
                enriched_prop = self._enrich_property_data(prop)
                enriched_similar.append(enriched_prop)

            return enriched_similar

        except Exception as e:
            self.logger.error(f"Error getting similar properties: {e}")
            return []

    def get_property(self, property_id: int) -> Optional[Dict[str, Any]]:
        """Get property by ID"""
        return self.get_by_id(property_id)

    def create_property(self, property_data: Dict[str, Any], host_id: int) -> Dict[str, Any]:
        """Create a new property"""
        # Add host_id to property data
        property_data["host_id"] = host_id

        # Convert lists to JSON strings if needed
        if "amenities" in property_data and isinstance(property_data["amenities"], list):
            property_data["amenities"] = json.dumps(property_data["amenities"])

        if "images" in property_data and isinstance(property_data["images"], list):
            property_data["images"] = json.dumps(property_data["images"])

        return self.create(property_data)

    def update_property(self, property_id: int, property_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing property"""
        # Convert lists to JSON strings if needed
        if "amenities" in property_data and isinstance(property_data["amenities"], list):
            property_data["amenities"] = json.dumps(property_data["amenities"])

        if "images" in property_data and isinstance(property_data["images"], list):
            property_data["images"] = json.dumps(property_data["images"])

        return self.update(property_id, property_data)

    def delete_property(self, property_id: int) -> bool:
        """Delete a property"""
        return self.delete(property_id)

    def get_host_properties(self, host_id: int, skip: int=0, limit: int=100) -> List[Dict[str, Any]]:
        """Get properties for a specific host"""
        # This would need custom implementation since base service doesn't have get_by_host
        properties = self.get_all()
        host_properties = [p for p in properties if p.get("host_id") == host_id]
        return host_properties[skip:skip + limit]

    def format_property_for_response(self, property_obj: Dict[str, Any]) -> Dict[str, Any]:
        """Format property for API response"""
        # Since we're working with dictionaries, just return a copy with any needed transformations
        property_dict = property_obj.copy()

        # Parse JSON fields if they're strings
        try:
            if "amenities" in property_dict and isinstance(property_dict["amenities"], str):
                property_dict["amenities"] = json.loads(property_dict["amenities"])
        except (json.JSONDecodeError, TypeError):
            property_dict["amenities"] = []

        try:
            if "images" in property_dict and isinstance(property_dict["images"], str):
                property_dict["images"] = json.loads(property_dict["images"])
        except (json.JSONDecodeError, TypeError):
            property_dict["images"] = []

        return property_dict
