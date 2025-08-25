from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime

# Import our service layer

from services import user_service, property_service

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.get("/", response_model=List[Dict[str, Any]])
async def get_wishlists(
    user_id: Optional[int]=None,
    include_properties: bool=False,
    page: int=1,
    limit: int=10
):
    """Get all wishlists with optional filtering"""
    skip = (page - 1) * limit
    return user_service.get_wishlists(user_id=user_id, include_properties=include_properties, skip=skip, limit=limit)


@router.get("/{wishlist_id}", response_model=Dict[str, Any])
async def get_wishlist(
    wishlist_id: int,
    include_properties: bool=True
):
    """Get wishlist by ID"""
    # Use service method to get all wishlists (mock: get all for all users)
    wishlists = []
    for uid in range(1, 1000):
        wishlists.extend(user_service.get_user_wishlists(uid))
    # Filter for wishlist functionality
    # In a real app, this would be a separate wishlist service

    wishlist = next((w for w in wishlists if w["id"] == wishlist_id), None)

    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )

    # In a real implementation, we would check if the wishlist is public
    # or if the current user is the owner

    result = {**wishlist}

    if include_properties:
        # Enrich with property details
        properties = property_service.get_all()
        property_dict = {p["id"]: p for p in properties}

        property_list = []
        for prop_id in wishlist.get("properties", []):
            prop_data = property_dict.get(prop_id)
            if prop_data:
                property_list.append({
                    "id": prop_data["id"],
                    "title": prop_data["title"],
                    "property_type": prop_data["property_type"],
                    "city": prop_data["city"],
                    "state": prop_data["state"],
                    "country": prop_data["country"],
                    "image": prop_data.get("images", [])[0] if prop_data.get("images") else None,
                    "base_price": prop_data["base_price"]
                })

        result["property_details"] = property_list

    return result


@router.get("/{wishlist_id}", response_model=Dict[str, Any])
async def get_wishlist(
    wishlist_id: int,
    include_properties: bool=True
):
    """Get wishlist by ID"""
    return user_service.get_wishlist_by_id(wishlist_id, include_properties=include_properties)
    property_data = next((p for p in properties if p["id"] == property_id), None)

    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    # For mock purposes, we'll return a success message
    properties_list = wishlist.get("properties", [])
    if property_id not in properties_list:
        properties_list.append(property_id)

    return {
        **wishlist,
        "properties": properties_list,
        "message": "Property added to wishlist successfully (mock implementation)"
    }


@router.delete("/{wishlist_id}/remove-property/{property_id}", response_model=Dict[str, Any])
async def remove_property_from_wishlist(
    wishlist_id: int,
    property_id: int
):
    """Remove a property from a wishlist (mock implementation)"""
    # Use service method to get all wishlists (mock: get all for all users)
    wishlists = []
    for uid in range(1, 1000):
        wishlists.extend(user_service.get_user_wishlists(uid))
    # Filter for wishlist functionality
    # In a real app, this would be a separate wishlist service

    wishlist = next((w for w in wishlists if w["id"] == wishlist_id), None)

    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )

    # In a real implementation, we would check if the current user is the owner
    # and remove the property from the wishlist in the database

    # For mock purposes, we'll return a success message
    properties_list = wishlist.get("properties", [])
    if property_id in properties_list:
        properties_list.remove(property_id)

    return {
        **wishlist,
        "properties": properties_list,
        "message": "Property removed from wishlist successfully (mock implementation)"
    }


@router.delete("/{wishlist_id}", response_model=Dict[str, Any])
async def delete_wishlist(wishlist_id: int):
    """Delete a wishlist (mock implementation)"""
    # Use service method to get all wishlists (mock: get all for all users)
    wishlists = []
    for uid in range(1, 1000):
        wishlists.extend(user_service.get_user_wishlists(uid))
    # Filter for wishlist functionality
    # In a real app, this would be a separate wishlist service

    wishlist = next((w for w in wishlists if w["id"] == wishlist_id), None)

    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )

    # In a real implementation, we would check if the current user is the owner
    # and delete the wishlist from the database

    # For mock purposes, we'll return a success message
    return {
        **wishlist,
        "message": "Wishlist deleted successfully (mock implementation)"
    }
