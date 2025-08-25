from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any

from schemas.house import (
    HouseResponse, HouseDetail, HouseSearch, HouseCreate, HouseUpdate
)

# Import our service layer
from services import property_service, user_service, ServiceError, ValidationError, NotFoundError

router = APIRouter(prefix="/houses", tags=["houses"])


def transform_house_data(property_data: Dict) -> Dict:
    """Transform JSON property data to house schema"""
    # Handle location data
    location = property_data.get("location", {})

    # Handle availability
    availability = property_data.get("availability", {})

    return {
        "id": int(property_data.get("id", 0)),
        "title": property_data.get("property_name", property_data.get("title_1", "No Title")),
        "description": property_data.get("description", ""),
        "property_type": property_data.get("propertyType", "Unknown"),
        "address": location.get("address", ""),
        "city": property_data.get("city", ""),
        "state": property_data.get("state", ""),
        "country": property_data.get("country", ""),
        "postal_code": property_data.get("postal_code", ""),
        "latitude": location.get("lat"),
        "longitude": location.get("lng"),
        "amenities": property_data.get("amenities", []),
        "house_rules": "",
        "cancellation_policy": "flexible",
        "check_in_time": availability.get("checkInTime", "15:00"),
        "check_out_time": availability.get("checkOutTime", "11:00"),
        "minimum_stay": availability.get("minimumStay", 1),
        "maximum_stay": availability.get("maximumStay"),
        "is_instant_bookable": availability.get("instantBook", False),
        "host_id": 1,  # Default host ID
        "is_active": True,
        "images": property_data.get("images", []),
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "total_rooms": 1,  # Most properties have 1 bookable unit
        # Additional fields for frontend display
        "average_rating": property_data.get("rating", property_data.get("house_rating", 0)),
        "total_reviews": property_data.get("rating_count", 0),
        "total_bookings": property_data.get("rating_count", 0) * 2,
        "is_new": property_data.get("is_new", False),
        "is_guest_favorite": property_data.get("isGuestFavorite", False),
        "filter": property_data.get("filter", ""),
        "section": property_data.get("section", 1)
    }


# Service functions
def get_filtered_houses(filters: Dict[str, Any]) -> List[Dict]:
    """Get houses with filters applied"""
    try:
        # Use property service for advanced search
        search_params = {}

        if "location" in filters and filters["location"]:
            # Split location into city/country for property service
            location_parts = filters["location"].split(",")
            if len(location_parts) >= 1:
                search_params["city"] = location_parts[0].strip()
            if len(location_parts) >= 2:
                search_params["country"] = location_parts[1].strip()

        if "property_type" in filters:
            search_params["property_type"] = filters["property_type"]

        if "min_price" in filters:
            search_params["min_price"] = filters["min_price"]

        if "max_price" in filters:
            search_params["max_price"] = filters["max_price"]

        if "min_guests" in filters:
            search_params["min_guests"] = filters["min_guests"]

        # Get properties from service
        properties = property_service.search_properties(**search_params)

        # Transform properties to house schema
        transformed_houses = [transform_house_data(p) for p in properties]

        return transformed_houses

    except ServiceError:
        return []


@router.get("/", response_model=List[HouseResponse], summary="Get house/property information")
async def get_houses(
    page: int=Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int=Query(20, ge=0, le=100, description="Number of houses per page (0 = return all)"),
    location: Optional[str]=None,
    property_type: Optional[str]=None,
    amenities: Optional[List[str]]=Query(None),
    instant_bookable: Optional[bool]=None
):
    """
    Get house/property information without room details.

    ✅ **Recommended for property management and host dashboards**

    This endpoint returns pure house/property data including:
    - Location and address information
    - Property-level amenities (pool, gym, parking)
    - Host information
    - House rules and policies
    - Total number of rooms available

    For bookable room data with pricing, use `/api/rooms/` instead.

    - **page**: Page number (starts from 1)
    - **limit**: Number of houses per page (0 = return all houses)
    - Other parameters are filters for searching houses
    """
    filters = {
        "location": location,
        "property_type": property_type,
        "amenities": amenities,
        "instant_bookable": instant_bookable
    }

    all_houses = get_filtered_houses(filters)

    # If limit is 0, return all houses without pagination
    if limit == 0:
        return all_houses

    # Apply pagination using page and limit
    skip = (page - 1) * limit
    end_idx = min(skip + limit, len(all_houses))
    return all_houses[skip:end_idx]


@router.get("/search", response_model=List[HouseResponse])
async def search_houses(
    search_params: HouseSearch=Depends()
):
    """Advanced house search"""
    filters = {
        "location": search_params.location,
        "property_type": search_params.property_type,
        "amenities": search_params.amenities,
        "instant_bookable": search_params.instant_bookable
    }

    all_houses = get_filtered_houses(filters)

    # Apply pagination
    skip = (search_params.page - 1) * search_params.limit
    end_idx = min(skip + search_params.limit, len(all_houses))
    return all_houses[skip:end_idx]


@router.get("/{house_id}", response_model=HouseDetail)
async def get_house(house_id: int):
    """Get house by ID with host information and rooms"""
    try:
        # Get property details using service
        house_obj = property_service.get_property_details(house_id)

        if not house_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="House not found"
            )

        # Transform to house schema
        house_data = transform_house_data(house_obj)

        return house_data

    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="House not found"
        )
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Transform house data
    transformed_house = transform_house_data(house_obj)

    # Get host information
    host_info = house_obj.get("host", {})
    if not host_info and users:
        # Fallback to users data if available
        for user in users:
            if user["id"] == transformed_house["host_id"]:
                host_info = {
                    "id": user["id"],
                    "first_name": user.get("first_name", "Unknown"),
                    "last_name": user.get("last_name", "Host"),
                    "profile_picture": user.get("profile_picture", ""),
                    "is_verified": user.get("is_verified", False)
                }
                break

    # Format host info properly
    if host_info and "name" in host_info:
        host_info = {
            "id": 1,
            "first_name": host_info.get("name", "Unknown Host").split()[0],
            "last_name": " ".join(host_info.get("name", "Unknown Host").split()[1:]) or "Host",
            "profile_picture": host_info.get("image", ""),
            "is_verified": host_info.get("isSuperhost", False)
        }
    elif not host_info:
        # Default host info
        host_info = {
            "id": 1,
            "first_name": "Unknown",
            "last_name": "Host",
            "profile_picture": "",
            "is_verified": False
        }

    # Create a default room for this house (for now, each house has one bookable unit)
    rooms = [{
        "id": transformed_house["id"],
        "house_id": transformed_house["id"],
        "name": "Entire " + transformed_house["property_type"],
        "room_type": house_obj.get("roomType", "Entire home/apt"),
        "max_guests": house_obj.get("max_guests", 4),
        "bedrooms": house_obj.get("bedrooms", 1),
        "bathrooms": house_obj.get("bathrooms", 1),
        "beds": house_obj.get("beds", 1),
        "base_price": float(house_obj.get("price", 100)),
        "cleaning_fee": 0.0,
        "service_fee": 0.0,
        "security_deposit": 0.0,
        "room_amenities": [],
        "is_available": True,
        "images": house_obj.get("images", []),
        "created_at": transformed_house["created_at"],
        "updated_at": transformed_house["updated_at"]
    }]

    # Combine all the data
    result = {
        **transformed_house,
        "host": host_info,
        "rooms": rooms
    }

    return result


@router.get("/{house_id}/rooms", response_model=List[Dict[str, Any]])
async def get_house_rooms(house_id: int):
    """Get all rooms for a specific house"""
    try:
        house_obj = property_service.get_property(house_id)

        if not house_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="House not found"
            )

        # Extract room information from property
        rooms = []
        bedrooms = house_obj.get("bedrooms", 1)
        bathrooms = house_obj.get("bathrooms", 1)

        # Create mock room data based on property info
        for i in range(bedrooms):
            rooms.append({
                "id": f"room_{house_id}_{i+1}",
                "house_id": house_id,
                "name": f"Bedroom {i+1}",
                "type": "bedroom",
                "size": "Standard",
                "amenities": house_obj.get("amenities", [])[:3]  # Sample amenities
            })

        return rooms

    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="House not found"
        )
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="House not found"
        )

    # For now, return one room per house (the entire property)
    rooms = [{
        "id": house_id,
        "house_id": house_id,
        "name": "Entire " + house_obj.get("propertyType", "Property"),
        "room_type": house_obj.get("roomType", "Entire home/apt"),
        "max_guests": house_obj.get("max_guests", 4),
        "bedrooms": house_obj.get("bedrooms", 1),
        "bathrooms": house_obj.get("bathrooms", 1),
        "beds": house_obj.get("beds", 1),
        "base_price": float(house_obj.get("price", 100)),
        "cleaning_fee": 0.0,
        "service_fee": 0.0,
        "security_deposit": 0.0,
        "room_amenities": [],
        "is_available": True,
        "images": house_obj.get("images", []),
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }]

    return rooms


# For mock data, simplified creation endpoints
@router.post("/", response_model=Dict[str, Any])
async def create_house():
    """Mock house creation - returns success message only"""
    return {
        "message": "House creation not implemented in mock mode",
        "status": "mock_success"
    }


@router.get("/my-houses", response_model=List[Dict[str, Any]])
async def get_my_houses():
    """Get current user's houses (mock data)"""
    try:
        properties = property_service.get_all()[:3]  # Get first 3 for demo
        # Transform and return properties as houses
        transformed_houses = [transform_house_data(p) for p in properties]
        return transformed_houses
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
