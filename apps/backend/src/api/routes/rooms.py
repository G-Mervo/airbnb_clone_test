from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any

from schemas.room import (
    RoomResponse, RoomDetail, RoomSearch, RoomCreate, RoomUpdate, RoomListing
)

# Import our service layer
from services.room_service import RoomService
from services import user_service, ServiceError, ValidationError, NotFoundError

# Create service instance
room_service = RoomService()
import datetime

router = APIRouter(prefix="/rooms", tags=["rooms"])

# Constants
DEFAULT_TIMESTAMP = datetime.datetime.now().isoformat() + "Z"


def transform_room_data(property_data: Dict) -> Dict:
    """Transform JSON property data to room schema (bookable unit)"""
    # Handle location data
    location = property_data.get("location", {})

    # Handle guest capacity
    guest_capacity = property_data.get("guestCapacity", {})
    max_guests = property_data.get("max_guests") or guest_capacity.get("adults", 2)

    # Handle availability
    availability = property_data.get("availability", {})

    return {
        "id": int(property_data.get("id", 0)),
        "house_id": int(property_data.get("id", 0)),  # For now, 1:1 mapping
        "name": f"Entire {property_data.get('propertyType', 'Property')}",
        "room_type": property_data.get("roomType", "Entire home/apt"),
        "max_guests": max_guests,
        "bedrooms": property_data.get("bedrooms", 1),
        "bathrooms": float(property_data.get("bathrooms", 1)),
        "beds": property_data.get("beds", 1),
        "base_price": float(property_data.get("price", 0)),
        "cleaning_fee": 0.0,
        "service_fee": 0.0,
        "security_deposit": 0.0,
        "room_amenities": [],  # Room-specific amenities
        "is_available": True,
        "description": property_data.get("description", ""),
        "images": property_data.get("images", []),
        "sleep_bed_1_link": property_data.get("sleep_bed_1_link", 'https://a0.muscache.com/im/pictures/miso/Hosting-853340545527020346/original/7fdc4dc1-f4d6-4947-8fa9-4b0b26c228e7.jpeg?im_w=480'),
        "created_at": DEFAULT_TIMESTAMP,
        "updated_at": DEFAULT_TIMESTAMP,
        # Host information
        "host": property_data.get("host", {}),
        # House context information
        "house_title": property_data.get("property_name", property_data.get("title_1", "No Title")),
        "city": property_data.get("city", ""),
        "country": property_data.get("country", ""),
        "house_amenities": property_data.get("amenities", []),
        # Additional fields for frontend compatibility
        "average_rating": property_data.get("rating", property_data.get("house_rating", 0)),
        "total_reviews": property_data.get("rating_count", 0),
        "total_bookings": property_data.get("rating_count", 0) * 2
    }


def transform_to_room_listing(property_data: Dict) -> Dict:
    """Transform to RoomListing format for frontend compatibility"""
    location = property_data.get("location", {})
    guest_capacity = property_data.get("guestCapacity", {})
    max_guests = property_data.get("max_guests") or guest_capacity.get("adults", 2)
    availability = property_data.get("availability", {})

    return {
        "id": int(property_data.get("id", 0)),
        "title": property_data.get("property_name", property_data.get("title_1", "No Title")),
        "description": property_data.get("description", ""),
        "property_type": property_data.get("propertyType", "Unknown"),
        "room_type": property_data.get("roomType", "Entire home/apt"),
        "max_guests": max_guests,
        "bedrooms": property_data.get("bedrooms", 1),
        "bathrooms": float(property_data.get("bathrooms", 1)),
        "beds": property_data.get("beds", 1),
        "address": location.get("address", ""),
        "city": property_data.get("city", ""),
        "state": property_data.get("state", ""),
        "country": property_data.get("country", ""),
        "postal_code": property_data.get("postal_code", ""),
        "latitude": location.get("lat"),
        "longitude": location.get("lng"),
        "base_price": float(property_data.get("price", 0)),
        "cleaning_fee": 0.0,
        "service_fee": 0.0,
        "security_deposit": 0.0,
        "amenities": property_data.get("amenities", []),
        "house_rules": "",
        "cancellation_policy": "flexible",
        "check_in_time": availability.get("checkInTime", "15:00"),
        "check_out_time": availability.get("checkOutTime", "11:00"),
        "is_instant_bookable": availability.get("instantBook", False),
        "host_id": 1,  # Default host ID
        "is_active": True,
        "images": property_data.get("images", []),
        "created_at": DEFAULT_TIMESTAMP,
        "updated_at": DEFAULT_TIMESTAMP,
        "host": None,  # Will be populated separately if needed
        "average_rating": property_data.get("rating", property_data.get("house_rating", 0)),
        "total_reviews": property_data.get("rating_count", 0),
        "total_bookings": property_data.get("rating_count", 0) * 2,
        # Additional fields for frontend compatibility
        "rating": property_data.get("rating", property_data.get("house_rating", 0)),
        "is_new": property_data.get("is_new", False),
        "is_guest_favorite": property_data.get("isGuestFavorite", False),
        "filter": property_data.get("filter", ""),
        "section": property_data.get("section", 1),
        "house_id": int(property_data.get("id", 0))
    }


# Mock data access functions
def get_filtered_rooms(filters: Dict[str, Any]) -> List[Dict]:
    """Get rooms with filters applied"""
    properties = room_service.get_all()

    # Transform properties to room listings for frontend compatibility
    transformed_rooms = [transform_to_room_listing(p) for p in properties]
    filtered_rooms = transformed_rooms

    # Geographic bounds filtering (map-based search)
    if all(key in filters and filters[key] is not None for key in ["ne_lat", "ne_lng", "sw_lat", "sw_lng"]):
        ne_lat, ne_lng = filters["ne_lat"], filters["ne_lng"]
        sw_lat, sw_lng = filters["sw_lat"], filters["sw_lng"]

        filtered_rooms = [
            r for r in filtered_rooms
            if r.get("latitude") is not None and r.get("longitude") is not None and
               sw_lat <= r["latitude"] <= ne_lat and
               sw_lng <= r["longitude"] <= ne_lng
        ]

    if "location" in filters and filters["location"]:
        location = filters["location"].lower()
        filtered_rooms = [
            r for r in filtered_rooms
            if (r["city"] and location in r["city"].lower()) or
               (r["state"] and location in r["state"].lower()) or
               (r["country"] and location in r["country"].lower())
        ]

    if "min_price" in filters and filters["min_price"] is not None:
        filtered_rooms = [
            r for r in filtered_rooms
            if r["base_price"] >= filters["min_price"]
        ]

    if "max_price" in filters and filters["max_price"] is not None:
        filtered_rooms = [
            r for r in filtered_rooms
            if r["base_price"] <= filters["max_price"]
        ]

    if "room_type" in filters and filters["room_type"]:
        filtered_rooms = [
            r for r in filtered_rooms
            if r["room_type"] == filters["room_type"]
        ]

    if "guests" in filters and filters["guests"]:
        filtered_rooms = [
            r for r in filtered_rooms
            if r["max_guests"] >= filters["guests"]
        ]

    if "house_id" in filters and filters["house_id"]:
        filtered_rooms = [
            r for r in filtered_rooms
            if r["house_id"] == filters["house_id"]
        ]

    if "amenities" in filters and filters["amenities"]:
        filtered_rooms = [
            r for r in filtered_rooms
            if all(amenity in r["amenities"] for amenity in filters["amenities"])
        ]

    # Only return active rooms
    filtered_rooms = [r for r in filtered_rooms if r.get("is_active", True)]

    return filtered_rooms


def get_search_rooms(filters: Dict[str, Any]) -> List[Dict]:
    """Get rooms with filters applied"""
    properties = room_service.search_properties(filters)

    # Transform properties to room listings for frontend compatibility
    transformed_rooms = [transform_to_room_listing(p) for p in properties]
    filtered_rooms = transformed_rooms

    # Only return active rooms
    filtered_rooms = [r for r in filtered_rooms if r.get("is_active", True)]
    if len(filtered_rooms) == 0:
        filtered_rooms = get_filtered_rooms(filters)

    return filtered_rooms


@router.get("/", response_model=List[RoomListing], summary="Get bookable rooms with house context")
async def get_rooms(
    page: int=Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int=Query(20, ge=0, le=100, description="Number of rooms per page (0 = return all)"),
    location: Optional[str]=None,
    min_price: Optional[float]=None,
    max_price: Optional[float]=None,
    room_type: Optional[str]=None,
    guests: Optional[int]=None,
    house_id: Optional[int]=None,
    amenities: Optional[List[str]]=Query(None),
    # Map bounds parameters
    ne_lat: Optional[float]=None,
    ne_lng: Optional[float]=None,
    sw_lat: Optional[float]=None,
    sw_lng: Optional[float]=None,
    search_by_map: Optional[bool]=False
):
    """
    Get bookable rooms with their house context for booking interface.

    ✅ **Recommended for booking/listing interfaces**

    This endpoint returns room data (pricing, capacity, availability) combined with
    house context (location, amenities, host info) in a format compatible with
    the current frontend PropertyDetail interface.

    For pure house data without room details, use `/api/houses/` instead.

    - **page**: Page number (starts from 1)
    - **limit**: Number of rooms per page (0 = return all rooms)
    - **house_id**: Filter rooms within a specific house
    - Other parameters are filters for searching rooms
    """
    filters = {
        "location": location,
        "min_price": min_price,
        "max_price": max_price,
        "room_type": room_type,
        "guests": guests,
        "house_id": house_id,
        "amenities": amenities,
        # Map bounds parameters
        "ne_lat": ne_lat,
        "ne_lng": ne_lng,
        "sw_lat": sw_lat,
        "sw_lng": sw_lng,
        "search_by_map": search_by_map
    }

    all_rooms = get_search_rooms(filters)

    # If limit is 0, return all rooms without pagination
    if limit == 0:
        return all_rooms

    # Apply pagination using page and limit
    skip = (page - 1) * limit
    end_idx = min(skip + limit, len(all_rooms))

    return all_rooms[skip:end_idx]


@router.get("/search", response_model=List[RoomListing])
async def search_rooms(
    search_params: RoomSearch=Depends()
):
    """Advanced room search with comprehensive filtering support"""
    filters = {
        # Location filtering
        "location": search_params.location,
        # Date filtering
        "check_in": search_params.check_in,
        "check_out": search_params.check_out,
        # Guest capacity filtering (detailed breakdown)
        "guests": search_params.guests,
        "adults": search_params.adults,
        "children": search_params.children,
        "infants": search_params.infants,
        "pets": search_params.pets,
        # Property filtering
        "property_type": search_params.property_type,
        "room_type": search_params.room_type,
        "bedrooms": search_params.bedrooms,
        "bathrooms": search_params.bathrooms,
        "instant_bookable": search_params.instant_bookable,
        # Price filtering
        "min_price": search_params.min_price,
        "max_price": search_params.max_price,
        # Other parameters
        "house_id": search_params.house_id,
        "amenities": search_params.amenities,
        # Map bounds parameters
        "ne_lat": search_params.ne_lat,
        "ne_lng": search_params.ne_lng,
        "sw_lat": search_params.sw_lat,
        "sw_lng": search_params.sw_lng,
        "search_by_map": search_params.search_by_map,
        # Flexible search parameters
        "flexible_months": search_params.flexible_months,
        "stay_duration": search_params.stay_duration,
        "date_option": search_params.date_option,
        # Month mode specific parameters
        "month_duration": search_params.month_duration,
        "start_duration_date": search_params.start_duration_date,
        "date_flexibility": search_params.date_flexibility,
        "start_date_flexibility": search_params.start_date_flexibility,
        "end_date_flexibility": search_params.end_date_flexibility,
        # Additional availability filters
        "min_stay_days": search_params.min_stay_days,
        "max_stay_days": search_params.max_stay_days
    }

    all_rooms = get_search_rooms(filters)

    # If limit is 0, return all rooms without pagination
    if search_params.limit == 0:
        return all_rooms

    # Apply pagination
    skip = (search_params.page - 1) * search_params.limit
    end_idx = min(skip + search_params.limit, len(all_rooms))

    return all_rooms[skip:end_idx]


@router.get("/locations", response_model=List[Dict[str, str]])
async def get_location_suggestions(
    query: Optional[str]=Query(None, description="Search query for location filtering")
):
    """Get location suggestions for typeahead search"""
    try:
        # Get all properties
        properties = room_service.get_all()

        # Extract unique locations
        locations = set()

        for prop in properties:
            city = prop.get("city", "").strip()
            state = prop.get("state", "").strip()
            country = prop.get("country", "").strip()

            # Get address from location object or direct field
            location_obj = prop.get("location", {})
            address = ""
            if isinstance(location_obj, dict):
                address = location_obj.get("address", "").strip()
            if not address:
                address = prop.get("address", "").strip()

            # Add address-level locations (most specific)
            if address and city and country:
                # Check if address is different from city (avoid duplication like "Miami, Miami, FL")
                address_parts = [part.strip() for part in address.split(',')]
                first_address_part = address_parts[0].lower() if address_parts else ""

                # Only add if the first part of address is different from city
                if first_address_part != city.lower():
                    if state:
                        address_str = f"{address}, {country}"
                    else:
                        address_str = f"{address}, {country}"
                    locations.add((address_str, city, state, country, "address"))

            # Add city-level locations
            if city and country:
                if state:
                    city_str = f"{city}, {state}, {country}"
                else:
                    city_str = f"{city}, {country}"
                locations.add((city_str, city, state, country, "city"))

            # Add state-level location if available
            if state and country:
                state_str = f"{state}, {country}"
                locations.add((state_str, "", state, country, "state"))

            # Add country-level location
            if country:
                locations.add((country, "", "", country, "country"))

        # Convert to list and sort
        location_list = []
        for loc_tuple in locations:
            full_str, city, state, country, loc_type = loc_tuple
            location_list.append({
                "full": full_str,
                "city": city,
                "state": state,
                "country": country,
                "type": loc_type
            })

        # Filter by query if provided
        if query:
            query_lower = query.lower()
            filtered_list = []

            for loc in location_list:
                # Check if query matches any part of the location
                full_match = query_lower in loc["full"].lower()

                # Also check individual components for more flexible matching
                city_match = loc["city"] and query_lower in loc["city"].lower()
                state_match = loc["state"] and query_lower in loc["state"].lower()
                country_match = loc["country"] and query_lower in loc["country"].lower()

                if full_match or city_match or state_match or country_match:
                    filtered_list.append(loc)

            location_list = filtered_list

        # Sort by relevance - addresses first, then cities, then states, then countries
        type_order = {"address": 1, "city": 2, "state": 3, "country": 4}
        location_list.sort(key=lambda x: (type_order.get(x["type"], 5), x["full"]))

        # Limit results to avoid too many suggestions
        return location_list[:10]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching location suggestions: {str(e)}"
        )


@router.get("/{room_id}", response_model=RoomDetail)
async def get_room(room_id: int):
    """Get room by ID with house information"""
    room_obj = room_service.get_by_id(room_id)

    # Find the room (property)
    if not room_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )

    print(f"Found room: {room_obj}")
    # Transform room data
    transformed_room = transform_room_data(room_obj)
    print(f"Transformed room: {transformed_room}")

    # Get house information (same as room for now in 1:1 mapping)
    location = room_obj.get("location", {})
    availability = room_obj.get("availability", {})

    house_info = {
        "id": transformed_room["house_id"],
        "title": room_obj.get("property_name", room_obj.get("title_1", "No Title")),
        "property_type": room_obj.get("propertyType", "Unknown"),
        "city": room_obj.get("city", ""),
        "country": room_obj.get("country", ""),
        "amenities": room_obj.get("amenities", []),
        "check_in_time": availability.get("checkInTime", "15:00"),
        "check_out_time": availability.get("checkOutTime", "11:00"),
        "house_rules": "",
        "cancellation_policy": "flexible"
    }

    # Combine all the data
    result = {
        **transformed_room,
        "house": house_info
    }

    return result


# For mock data, simplified creation endpoints
@router.post("/", response_model=Dict[str, Any])
async def create_room():
    """Mock room creation - returns success message only"""
    return {
        "message": "Room creation not implemented in mock mode",
        "status": "mock_success"
    }


@router.get("/house/{house_id}/rooms", response_model=List[RoomResponse])
async def get_rooms_by_house(house_id: int):
    """Get all rooms for a specific house"""
    properties = room_service.get_all()

    # Find the house
    house_obj = None
    for p in properties:
        if int(p["id"]) == house_id:
            house_obj = p
            break

    if not house_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="House not found"
        )

    # Transform to room format
    room = transform_room_data(house_obj)
    return [room]
