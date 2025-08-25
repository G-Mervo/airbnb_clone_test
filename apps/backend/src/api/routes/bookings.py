from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

# Import our service layer
from services import booking_service, ServiceError, ValidationError, NotFoundError
from auth.dependencies import get_current_active_user, get_current_user
from schemas.booking import BookingCreate
from schemas.booking_frontend import FrontendBookingCreate, BookingResponse

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"],
    dependencies=[Depends(get_current_active_user)]
)


@router.get("/", response_model=List[Dict[str, Any]])
async def get_bookings(
    property_id: Optional[int]=None,
    status: Optional[str]=None,
    page: int=1,
    limit: int=10,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Get all bookings with optional filtering"""
    try:
        filters = {}
        if current_user:
            filters["guest_id"] = current_user["id"]
        if property_id:
            filters["property_id"] = property_id
        if status:
            filters["status"] = status

        skip = (page - 1) * limit
        return booking_service.get_all(skip=skip, limit=limit, filters=filters)
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(
    page: int=1,
    limit: int=10,
    booking_status: Optional[str]=None,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Get current user's bookings (requires authentication)"""
    try:
        user_id = current_user["id"]
        all_bookings = booking_service.get_user_bookings(
            user_id=user_id,
            status=booking_status
        )
        skip = (page - 1) * limit
        return all_bookings[skip:skip + limit]
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{booking_id}", response_model=Dict[str, Any])
async def get_booking(booking_id: int, current_user: Dict[str, Any]=Depends(get_current_active_user)):
    """Get a specific booking by ID"""
    try:
        booking = booking_service.get_by_id(booking_id)
        if booking["guest_id"] != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this booking")
        return booking
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_booking(booking_data: FrontendBookingCreate, current_user: Dict[str, Any]=Depends(get_current_active_user)):
    """Create a new booking"""
    try:
        # Convert Pydantic model to dict
        booking_dict = booking_data.dict()
        # Add guest_id from current user
        booking_dict["guest_id"] = current_user["id"]
        # Create booking through service
        return booking_service.create_booking(booking_dict)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{booking_id}", response_model=Dict[str, Any])
async def update_booking(booking_id: int, updates: Dict[str, Any]):
    """Update a booking"""
    try:
        return booking_service.update(booking_id, updates)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{booking_id}/confirm", response_model=Dict[str, Any])
async def confirm_booking(booking_id: int):
    """Confirm a pending booking"""
    try:
        return booking_service.confirm_booking(booking_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{booking_id}/cancel", response_model=Dict[str, Any])
async def cancel_booking(booking_id: int, cancellation_data: Optional[Dict[str, Any]]=None):
    """Cancel a booking"""
    try:
        reason = cancellation_data.get("reason") if cancellation_data else None
        return booking_service.cancel_booking(booking_id, reason)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/property/{property_id}", response_model=List[Dict[str, Any]])
async def get_property_bookings(
    property_id: int,
    booking_status: Optional[str]=None,
    page: int=1,
    limit: int=20
):
    """Get bookings for a specific property"""
    try:
        bookings = booking_service.get_property_bookings(property_id, booking_status)
        skip = (page - 1) * limit
        end_idx = min(skip + limit, len(bookings))
        return bookings[skip:end_idx]
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/calculate-price", response_model=Dict[str, Any])
async def calculate_booking_price(booking_data: Dict[str, Any]):
    """Calculate total price for a booking"""
    try:
        total_price = booking_service.calculate_total_price(booking_data)
        return {"total_price": total_price}
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        property_data = property_dict.get(booking["property_id"], {})
        result.append({
            **booking,
            "property": {
                "id": property_data.get("id"),
                "title": property_data.get("title"),
                "property_type": property_data.get("property_type"),
                "city": property_data.get("city"),
                "state": property_data.get("state"),
                "country": property_data.get("country"),
                "image": property_data.get("images", [])[0] if property_data.get("images") else None
            }
        })

    return result

