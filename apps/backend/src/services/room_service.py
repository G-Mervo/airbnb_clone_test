"""
Property service for handling property-related operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import json

from .base_service import BaseService, ValidationError, NotFoundError
from utils.data_manager import properties_manager, reviews_manager, bookings_manager


class RoomService(BaseService):
    """Service for room operations including search, details, and availability"""

    def __init__(self):
        super().__init__(properties_manager, "room")
        self.reviews_manager = reviews_manager
        self.bookings_manager = bookings_manager

    def get_high_priority_file(self) -> str:
        return "nyc-properties.json"

    def get_primary_file(self, high_priority_file: bool=False) -> str:
        if high_priority_file:
            return self.get_high_priority_file()

        return "rooms.json"

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate room data

        Args:
            data: Room data to validate
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

    def _filter_by_location(self, properties: List[Dict[str, Any]], location_query: str) -> List[Dict[str, Any]]:
        """
        Filter properties by location using partial matches (LIKE behavior)

        Args:
            properties: List of properties to filter
            location_query: Location search query

        Returns:
            Filtered list of properties
        """
        if not location_query:
            return properties

        location_lower = location_query.lower().strip()
        if not location_lower or location_lower == "anywhere":
            return properties

        filtered_properties = []

        for prop in properties:
            # Check standard location fields
            city = prop.get("city", "").lower()
            state = prop.get("state", "").lower()
            country = prop.get("country", "").lower()
            property_name = prop.get("property_name", "").lower()
            title = prop.get("title_1", "").lower()

            # Check location object address field
            location_obj = prop.get("location", {})
            address = ""
            if isinstance(location_obj, dict):
                address = location_obj.get("address", "").lower()

            # Perform partial matching (LIKE behavior)
            if (location_lower in city or
                location_lower in state or
                location_lower in country or
                location_lower in property_name or
                location_lower in title or
                location_lower in address or
                # Also check if any location field starts with the query
                city.startswith(location_lower) or
                state.startswith(location_lower) or
                country.startswith(location_lower) or
                address.startswith(location_lower)):
                filtered_properties.append(prop)

        return filtered_properties

    def _filter_by_guest_capacity(self, properties: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter properties by guest capacity requirements

        Args:
            properties: List of properties to filter
            filters: Dictionary containing guest requirements

        Returns:
            Filtered list of properties
        """
        adults = filters.get("adults") or 0
        children = filters.get("children") or 0
        infants = filters.get("infants") or 0
        pets = filters.get("pets") or 0
        guests = filters.get("guests") or 0

        # If no guest requirements specified, return all properties
        if not any([adults, children, infants, pets, guests]):
            return properties

        filtered_properties = []

        for prop in properties:
            # Check guest capacity from guestCapacity object first
            guest_capacity = prop.get("guestCapacity", {})
            max_guests_total = prop.get("max_guests", 0)

            # If guestCapacity object exists, use detailed capacity checks
            if guest_capacity:
                capacity_adults = guest_capacity.get("adults", max_guests_total)
                capacity_children = guest_capacity.get("children", 0)
                capacity_infants = guest_capacity.get("infants", 0)
                capacity_pets = guest_capacity.get("pets", 0)

                # Check if property can accommodate the requested guests
                if (adults <= capacity_adults and
                    children <= capacity_children and
                    infants <= capacity_infants and
                    pets <= capacity_pets):
                    filtered_properties.append(prop)
            else:
                # Fallback to total guest count comparison
                total_requested = adults + children + infants  # Don't count pets in total
                if total_requested <= max_guests_total:
                    filtered_properties.append(prop)
        return filtered_properties

    def _filter_by_availability(self, properties: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter properties by check-in/check-out dates and availability requirements

        Args:
            properties: List of properties to filter
            filters: Dictionary containing date and availability requirements

        Returns:
            Filtered list of properties
        """
        check_in = filters.get("check_in")
        check_out = filters.get("check_out")
        instant_bookable = filters.get("instant_bookable")
        min_stay_days = filters.get("min_stay_days")
        max_stay_days = filters.get("max_stay_days")

        if not check_in or not check_out:
            return properties

        filtered_properties = []

        for prop in properties:
            availability = prop.get("availability", {})
            property_min_stay = availability.get("minimumStay", 1)
            property_max_stay = availability.get("maximumStay", 365)
            property_instant_book = availability.get("instantBook", False)

            # Filter by instant bookable requirement
            if instant_bookable is not None and property_instant_book != instant_bookable:
                continue

            # Filter by minimum stay requirement (user's minimum must not exceed property's minimum)
            if min_stay_days is not None and property_min_stay > min_stay_days:
                continue

            # Filter by maximum stay requirement (user's maximum must not be less than property's minimum)
            if max_stay_days is not None and property_max_stay < max_stay_days:
                continue

            # If specific dates are provided, check stay duration compliance
            if check_in and check_out:
                try:
                    # Parse dates if they're strings
                    if isinstance(check_in, str):
                        check_in_date = datetime.fromisoformat(check_in.replace('Z', '+00:00'))
                        check_out_date = datetime.fromisoformat(check_out.replace('Z', '+00:00'))
                    else:
                        check_in_date = check_in
                        check_out_date = check_out

                    # Calculate stay duration in days
                    stay_duration = (check_out_date - check_in_date).days

                    # Check if the requested stay duration is within property limits
                    if not (property_min_stay <= stay_duration <= property_max_stay):
                        continue

                    # Additional calendar availability check could be added here
                    # For now, we assume the property is available if it meets stay requirements

                except Exception as e:
                    self.logger.warning(f"Error parsing dates {check_in}, {check_out}: {e}")
                    continue

            # Property passed all availability checks
            filtered_properties.append(prop)

        return filtered_properties

    def _filter_by_bounds(self, properties: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter properties by geographic bounds (map viewport)

        Args:
            properties: List of properties to filter
            filters: Dictionary containing bounds (ne_lat, ne_lng, sw_lat, sw_lng)

        Returns:
            Filtered list of properties within the bounds
        """
        # Check if all required bounds parameters are present
        required_bounds = ["ne_lat", "ne_lng", "sw_lat", "sw_lng"]
        if not all(key in filters and filters[key] is not None for key in required_bounds):
            return properties

        try:
            ne_lat = float(filters["ne_lat"])
            ne_lng = float(filters["ne_lng"])
            sw_lat = float(filters["sw_lat"])
            sw_lng = float(filters["sw_lng"])

            filtered_properties = []

            for prop in properties:
                # Get coordinates from location object
                location_obj = prop.get("location", {})
                latitude = None
                longitude = None

                if isinstance(location_obj, dict):
                    latitude = location_obj.get("lat")
                    longitude = location_obj.get("lng")

                # Skip properties without valid coordinates
                if latitude is None or longitude is None:
                    continue

                try:
                    lat = float(latitude)
                    lng = float(longitude)

                    # Check if property is within bounds
                    if (sw_lat <= lat <= ne_lat and sw_lng <= lng <= ne_lng):
                        filtered_properties.append(prop)

                except (ValueError, TypeError):
                    # Skip properties with invalid coordinates
                    continue

            return filtered_properties

        except (ValueError, TypeError) as e:
            self.logger.warning(f"Error parsing bounds: {e}")
            return properties

    def _filter_by_flexible_search(self, properties: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter properties by flexible search criteria

        Args:
            properties: List of properties to filter
            filters: Dictionary containing flexible search criteria:
                - flexible_months: list of month indices (0-11)
                - stay_duration: "weekend", "week", "month"
                - date_option: "dates", "month", "flexible"

        Returns:
            Filtered list of properties
        """
        date_option = filters.get("date_option")
        flexible_months = filters.get("flexible_months")
        stay_duration = filters.get("stay_duration")

        # Only apply flexible filtering when in flexible mode
        if date_option != "flexible":
            return properties

        # If no flexible criteria specified, return all properties
        if not flexible_months and not stay_duration:
            return properties

        try:
            from datetime import datetime, timedelta
            import calendar

            current_date = datetime.now()
            current_year = current_date.year

            # Generate date ranges for selected months
            valid_date_ranges = []

            if flexible_months:
                for month_index in flexible_months:
                    # Convert month index (0-11) to actual month (1-12)
                    target_month = (month_index % 12) + 1
                    target_year = current_year

                    # If month has passed this year, use next year
                    if target_month <= current_date.month:
                        target_year += 1

                    # Get first and last day of the month
                    first_day = datetime(target_year, target_month, 1)
                    last_day = datetime(target_year, target_month, calendar.monthrange(target_year, target_month)[1])

                    valid_date_ranges.append((first_day, last_day))

            # Filter properties based on availability and stay duration preferences
            filtered_properties = []

            for prop in properties:
                # For flexible search, we're more lenient - if the property exists and is active, include it
                # In a real implementation, you would check availability within the selected months
                # and ensure the property supports the requested stay duration

                availability = prop.get("availability", {})
                min_stay = availability.get("minimumStay", 1)
                max_stay = availability.get("maximumStay", 365)

                # Map stay duration to days
                duration_days = {
                    "weekend": 2,
                    "week": 7,
                    "month": 30
                }

                if stay_duration and stay_duration in duration_days:
                    required_days = duration_days[stay_duration]

                    # Check if property can accommodate the stay duration
                    if min_stay <= required_days <= max_stay:
                        filtered_properties.append(prop)
                else:
                    # If no specific duration or invalid duration, include the property
                    filtered_properties.append(prop)

            self.logger.info(f"Flexible search: filtered {len(properties)} -> {len(filtered_properties)} properties")
            self.logger.info(f"Flexible criteria: months={flexible_months}, duration={stay_duration}")

            return filtered_properties

        except Exception as e:
            self.logger.warning(f"Error in flexible search filtering: {e}")
            # Return all properties if filtering fails
            return properties

    def _filter_by_month_mode(self, properties: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Filter properties by month mode criteria

        Args:
            properties: List of properties to filter
            filters: Dictionary containing month mode criteria:
                - date_option: "month" (only applies when in month mode)
                - month_duration: number of months for the stay
                - start_duration_date: start date from circular slider
                - date_flexibility: date flexibility setting
                - start_date_flexibility: start date flexibility
                - end_date_flexibility: end date flexibility

        Returns:
            Filtered list of properties
        """
        date_option = filters.get("date_option", None)
        month_duration = filters.get("month_duration")
        start_duration_date = filters.get("start_duration_date")
        date_flexibility = filters.get("date_flexibility")

        # Only apply month mode filtering when in month mode
        if date_option != "month":
            return properties

        # If no month criteria specified, return all properties
        if not month_duration and not start_duration_date:
            return properties

        try:
            from datetime import datetime, timedelta
            import calendar

            filtered_properties = []

            for prop in properties:
                availability = prop.get("availability", {})
                min_stay = availability.get("minimumStay", 1)
                max_stay = availability.get("maximumStay", 365)

                # Calculate approximate stay duration in days for month mode
                if month_duration:
                    # Convert months to approximate days (30 days per month)
                    estimated_days = month_duration * 30

                    # Apply flexibility if specified
                    flexibility_days = 0
                    if date_flexibility and date_flexibility != 'exact':
                        try:
                            flexibility_days = int(date_flexibility)
                        except ValueError:
                            flexibility_days = 0

                    # Check if property can accommodate the stay duration within flexibility range
                    min_days = max(1, estimated_days - flexibility_days)
                    max_days = estimated_days + flexibility_days

                    # Property must be able to accommodate at least the minimum stay duration
                    if min_stay <= max_days and max_stay >= min_days:
                        filtered_properties.append(prop)
                else:
                    # If no specific duration specified, include the property
                    filtered_properties.append(prop)

            self.logger.info(f"Month mode search: filtered {len(properties)} -> {len(filtered_properties)} properties")
            self.logger.info(f"Month criteria: duration={month_duration} months, flexibility={date_flexibility}")

            return filtered_properties

        except Exception as e:
            self.logger.warning(f"Error in month mode filtering: {e}")
            # Return all properties if filtering fails
            return properties

    def search_properties(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search properties with advanced filtering

        Args:
            filters: Dictionary containing search criteria:
                - location: string for location-based filtering
                - check_in/check_out: date strings for availability filtering
                - adults/children/infants/pets: guest capacity filtering
                - min_price/max_price: price range filtering
                - bedrooms/bathrooms: room count filtering
                - amenities: list of required amenities
                - property_type/room_type: property classification
                - instant_bookable: boolean for instant booking availability

        Returns:
            List of filtered properties
        """
        # Start with all properties
        properties = self.get_all()

        # Apply location filtering using the reusable function
        properties = self._filter_by_location(properties, filters.get("location"))

        # Apply guest capacity filtering with detailed breakdown
        properties = self._filter_by_guest_capacity(properties, filters)

        # Apply date availability filtering
        properties = self._filter_by_availability(properties, filters)

        # Apply geographic bounds filtering (map-based search)
        properties = self._filter_by_bounds(properties, filters)

        # Apply bedrooms filtering
        if filters.get("bedrooms") and filters["bedrooms"] != "Any":
            bedrooms = int(filters["bedrooms"]) if isinstance(filters["bedrooms"], str) else filters["bedrooms"]
            properties = [
                p for p in properties
                if p.get("bedrooms", 0) >= bedrooms
            ]

        # Apply bathrooms filtering
        if filters.get("bathrooms") and filters["bathrooms"] != "Any":
            bathrooms = int(filters["bathrooms"]) if isinstance(filters["bathrooms"], str) else filters["bathrooms"]
            properties = [
                p for p in properties
                if p.get("bathrooms", 0) >= bathrooms
            ]

        # Apply price filtering
        if filters.get("min_price"):
            min_price = float(filters["min_price"])
            properties = [
                p for p in properties
                if p.get("price", 0) >= min_price
            ]

        if filters.get("max_price"):
            max_price = float(filters["max_price"])
            properties = [
                p for p in properties
                if p.get("price", 0) <= max_price
            ]

        # Apply property type filtering
        if filters.get("property_type"):
            property_type = filters["property_type"]
            properties = [
                p for p in properties
                if p.get("propertyType") == property_type or p.get("property_type") == property_type
            ]

        # Apply room type filtering
        if filters.get("room_type"):
            room_type = filters["room_type"]
            properties = [
                p for p in properties
                if p.get("roomType") == room_type or p.get("room_type") == room_type
            ]

        # Note: instant_bookable filtering is now handled in _filter_by_availability method

        # Apply amenities filtering
        if filters.get("amenities"):
            required_amenities = filters["amenities"]
            if isinstance(required_amenities, list):
                properties = [
                    p for p in properties
                    if all(
                        amenity in (p.get("amenities") or [])
                        for amenity in required_amenities
                    )
                ]

        # Apply flexible search filtering
        properties = self._filter_by_flexible_search(properties, filters)

        # Apply month mode filtering
        properties = self._filter_by_month_mode(properties, filters)

        return properties
