"""
Geolocation API routes for property locations and nearby attractions
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from ..services.geolocation import (
    geocode_address, 
    get_place_details,
    find_nearby_places, 
    get_distance_matrix,
    get_coordinates_from_address
)
from ..auth.jwt import get_current_active_user
from ..utils.cache import cache

router = APIRouter(prefix="/geo", tags=["geolocation"])


@router.get("/geocode", response_model=Dict[str, Any])
@cache(ttl=86400)  # Cache for 24 hours
async def geocode_location(
    address: str,
    current_user = Depends(get_current_active_user)
):
    """
    Geocode an address to get latitude and longitude
    
    Args:
        address: Full address string
        
    Returns:
        Geocoding results including formatted address and coordinates
    """
    result = await geocode_address(address)
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geocoding failed: {result.get('error_message', 'Unknown error')}"
        )
    
    return result


@router.get("/nearby", response_model=Dict[str, Any])
@cache(ttl=3600)  # Cache for 1 hour
async def get_nearby_places(
    lat: float,
    lng: float,
    radius: int = Query(1500, ge=100, le=5000),
    place_type: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """
    Find nearby places of interest
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in meters (100-5000)
        place_type: Type of place to search for (restaurant, tourist_attraction, etc.)
        
    Returns:
        Nearby places results with details
    """
    result = await find_nearby_places(lat, lng, radius, place_type)
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nearby places search failed: {result.get('error_message', 'Unknown error')}"
        )
    
    return result


@router.get("/place/{place_id}", response_model=Dict[str, Any])
@cache(ttl=86400)  # Cache for 24 hours
async def get_place_info(
    place_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Get detailed information about a place
    
    Args:
        place_id: Google Place ID
        
    Returns:
        Detailed place information
    """
    result = await get_place_details(place_id)
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Place details failed: {result.get('error_message', 'Unknown error')}"
        )
    
    return result


@router.get("/distance", response_model=Dict[str, Any])
@cache(ttl=86400)  # Cache for 24 hours
async def calculate_distance(
    origin: str,
    destination: str,
    mode: str = Query("driving", regex="^(driving|walking|bicycling|transit)$"),
    current_user = Depends(get_current_active_user)
):
    """
    Calculate distance and travel time between two locations
    
    Args:
        origin: Origin address or coordinates
        destination: Destination address or coordinates
        mode: Travel mode (driving, walking, bicycling, transit)
        
    Returns:
        Distance and duration information
    """
    result = await get_distance_matrix([origin], [destination], mode)
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Distance calculation failed: {result.get('error_message', 'Unknown error')}"
        )
    
    return result


@router.get("/property/{property_id}/nearby", response_model=Dict[str, Any])
@cache(ttl=3600)  # Cache for 1 hour
async def get_property_nearby_places(
    property_id: int,
    radius: int = Query(1500, ge=100, le=5000),
    place_type: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """
    Find nearby places for a specific property
    
    Args:
        property_id: Property ID
        radius: Search radius in meters (100-5000)
        place_type: Type of place to search for (restaurant, tourist_attraction, etc.)
        
    Returns:
        Nearby places results for the property
    """
    # Load mock data for property
    from pathlib import Path
    import json
    
    base_dir = Path(__file__).parent.parent.parent
    data_path = base_dir / "data" / "mock" / "properties.json"
    
    try:
        with open(data_path, "r") as f:
            properties = json.load(f)
            
        property_obj = next((p for p in properties if p["id"] == property_id), None)
        
        if not property_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
            
        # Get coordinates
        lat = property_obj.get("latitude")
        lng = property_obj.get("longitude")
        
        # If coordinates not available, geocode the address
        if not lat or not lng:
            address = f"{property_obj['address']}, {property_obj['city']}, {property_obj['state']}, {property_obj['country']}"
            lat, lng = await get_coordinates_from_address(address)
            
            if not lat or not lng:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not determine property coordinates"
                )
        
        # Find nearby places
        result = await find_nearby_places(lat, lng, radius, place_type)
        
        if result.get("status") != "OK":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nearby places search failed: {result.get('error_message', 'Unknown error')}"
            )
        
        return {
            "property": {
                "id": property_id,
                "name": property_obj.get("title"),
                "address": property_obj.get("address"),
                "coordinates": {
                    "lat": lat,
                    "lng": lng
                }
            },
            "nearby_places": result.get("results", [])
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get nearby places: {str(e)}"
        )
