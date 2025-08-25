"""
Geolocation services for maps and nearby attractions
"""
from typing import Dict, Any, List, Optional, Tuple
import logging
import requests
from ..config.settings import settings
from ..utils.cache import cache

logger = logging.getLogger("geolocation")

# Check if Google Maps API key is configured
GOOGLE_MAPS_AVAILABLE = bool(settings.google_maps_api_key)


@cache(ttl=86400)  # Cache for 24 hours
async def geocode_address(address: str) -> Dict[str, Any]:
    """
    Geocode an address to get latitude and longitude
    
    Args:
        address: Full address string
        
    Returns:
        Dictionary with geocoding results including lat/lng
    """
    if not GOOGLE_MAPS_AVAILABLE:
        logger.warning("Google Maps API key not configured. Using mock geocoding.")
        # Return mock data with approximate coordinates
        return {
            "status": "OK",
            "results": [{
                "formatted_address": address,
                "geometry": {
                    "location": {
                        "lat": 37.7749,  # Default to San Francisco
                        "lng": -122.4194
                    }
                }
            }]
        }
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": address,
            "key": settings.google_maps_api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.debug(f"Geocoded address: {address}")
        return data
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return {
            "status": "ERROR",
            "error_message": str(e)
        }


@cache(ttl=86400)  # Cache for 24 hours
async def get_place_details(place_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a place from Google Places API
    
    Args:
        place_id: Google Place ID
        
    Returns:
        Dictionary with place details
    """
    if not GOOGLE_MAPS_AVAILABLE:
        logger.warning("Google Maps API key not configured. Using mock place details.")
        return {
            "status": "OK",
            "result": {
                "name": "Mock Place",
                "formatted_address": "123 Mock Street, Mock City",
                "rating": 4.5,
                "types": ["point_of_interest", "establishment"]
            }
        }
    
    try:
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "name,formatted_address,geometry,rating,types,photos,url,website,opening_hours",
            "key": settings.google_maps_api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.debug(f"Got place details for: {place_id}")
        return data
    except Exception as e:
        logger.error(f"Place details error: {e}")
        return {
            "status": "ERROR",
            "error_message": str(e)
        }


@cache(ttl=3600)  # Cache for 1 hour
async def find_nearby_places(
    lat: float, 
    lng: float, 
    radius: int = 1500, 
    place_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Find nearby places of interest
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in meters
        place_type: Type of place to search for (restaurant, tourist_attraction, etc.)
        
    Returns:
        Dictionary with nearby places results
    """
    if not GOOGLE_MAPS_AVAILABLE:
        logger.warning("Google Maps API key not configured. Using mock nearby places.")
        return {
            "status": "OK",
            "results": [
                {
                    "name": "Mock Restaurant",
                    "vicinity": "123 Mock Street",
                    "types": ["restaurant", "food"],
                    "rating": 4.2,
                    "place_id": "mock_place_id_1",
                    "geometry": {
                        "location": {
                            "lat": lat + 0.01,
                            "lng": lng + 0.01
                        }
                    }
                },
                {
                    "name": "Mock Attraction",
                    "vicinity": "456 Mock Avenue",
                    "types": ["tourist_attraction", "point_of_interest"],
                    "rating": 4.8,
                    "place_id": "mock_place_id_2",
                    "geometry": {
                        "location": {
                            "lat": lat - 0.01,
                            "lng": lng - 0.01
                        }
                    }
                }
            ]
        }
    
    try:
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "key": settings.google_maps_api_key
        }
        
        if place_type:
            params["type"] = place_type
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.debug(f"Found nearby places at {lat},{lng}")
        return data
    except Exception as e:
        logger.error(f"Nearby places error: {e}")
        return {
            "status": "ERROR",
            "error_message": str(e)
        }


@cache(ttl=86400)  # Cache for 24 hours
async def get_distance_matrix(
    origins: List[str],
    destinations: List[str],
    mode: str = "driving"
) -> Dict[str, Any]:
    """
    Get distance and duration between multiple origins and destinations
    
    Args:
        origins: List of origin addresses or coordinates
        destinations: List of destination addresses or coordinates
        mode: Travel mode (driving, walking, bicycling, transit)
        
    Returns:
        Dictionary with distance matrix results
    """
    if not GOOGLE_MAPS_AVAILABLE:
        logger.warning("Google Maps API key not configured. Using mock distance matrix.")
        return {
            "status": "OK",
            "rows": [
                {
                    "elements": [
                        {
                            "status": "OK",
                            "duration": {"text": "10 mins", "value": 600},
                            "distance": {"text": "5 km", "value": 5000}
                        }
                    ]
                }
            ]
        }
    
    try:
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": "|".join(origins),
            "destinations": "|".join(destinations),
            "mode": mode,
            "key": settings.google_maps_api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.debug(f"Got distance matrix for {len(origins)} origins and {len(destinations)} destinations")
        return data
    except Exception as e:
        logger.error(f"Distance matrix error: {e}")
        return {
            "status": "ERROR",
            "error_message": str(e)
        }


async def get_coordinates_from_address(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Get latitude and longitude from an address
    
    Args:
        address: Full address string
        
    Returns:
        Tuple of (latitude, longitude) or (None, None) if geocoding fails
    """
    geocode_result = await geocode_address(address)
    
    if geocode_result.get("status") == "OK" and geocode_result.get("results"):
        location = geocode_result["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]
    
    return None, None
