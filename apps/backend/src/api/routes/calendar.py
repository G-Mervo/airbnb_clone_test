from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date

# Import our service layer
from services import property_service, booking_service, ServiceError, ValidationError, NotFoundError
from utils.data_manager import properties_manager, bookings_manager

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/availability/{property_id}", response_model=Dict[str, Any])
async def get_property_availability(
    property_id: int,
    start_date: str,
    end_date: str
):
    """Get property availability for a specific date range"""
    try:
        # Validate property exists using service
        property_obj = property_service.get_property(property_id)
        if not property_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )

        # Check availability using booking service
        is_available = booking_service.check_availability(
            property_id=property_id,
            check_in=start_date,
            check_out=end_date
        )

        return {
            "property_id": property_id,
            "start_date": start_date,
            "end_date": end_date,
            "is_available": is_available,
            "property_title": property_obj.get("title", "")
        }

    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Load existing bookings for this property
    bookings = booking_service.get_all()
    property_bookings = [b for b in bookings if b["property_id"] == property_id]

    # Parse input dates
    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)."
        )

    # Generate all dates in range
    date_range = []
    current_date = start
    while current_date <= end:
        date_range.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)

    # Check which dates are available
    availability = {}
    for date in date_range:
        # A date is unavailable if there's a booking that includes this date
        is_available = True
        for booking in property_bookings:
            booking_start = datetime.fromisoformat(booking["check_in_date"].replace('Z', '+00:00'))
            booking_end = datetime.fromisoformat(booking["check_out_date"].replace('Z', '+00:00'))

            current_date = datetime.fromisoformat(date)
            # Check if current date falls within a booking
            if booking_start <= current_date < booking_end:
                is_available = False
                break

        # Add availability status with price for the date
        availability[date] = {
            "available": is_available,
            "base_price": property_obj["base_price"],
            # In a real implementation, this might be different based on the date
            "special_price": None
        }

    return {
        "property_id": property_id,
        "availability": availability
    }

@router.post("/block-dates/{property_id}", response_model=Dict[str, Any])
async def block_property_dates(
    property_id: int,
    start_date: str,
    end_date: str,
    reason: Optional[str] = None
):
    """Block specific dates for a property (mock implementation)"""
    # Validate property exists
    properties = property_service.get_all()
    property_obj = next((p for p in properties if p["id"] == property_id), None)

    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    # In a real implementation, we would update the database with blocked dates
    # For mock purposes, we'll return a success message

    return {
        "property_id": property_id,
        "start_date": start_date,
        "end_date": end_date,
        "reason": reason,
        "message": "Dates blocked successfully (mock implementation)"
    }

@router.post("/unblock-dates/{property_id}", response_model=Dict[str, Any])
async def unblock_property_dates(
    property_id: int,
    start_date: str,
    end_date: str
):
    """Unblock specific dates for a property (mock implementation)"""
    # Validate property exists
    properties = property_service.get_all()
    property_obj = next((p for p in properties if p["id"] == property_id), None)

    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    # In a real implementation, we would update the database with unblocked dates
    # For mock purposes, we'll return a success message

    return {
        "property_id": property_id,
        "start_date": start_date,
        "end_date": end_date,
        "message": "Dates unblocked successfully (mock implementation)"
    }

@router.get("/pricing/{property_id}", response_model=Dict[str, Any])
async def get_property_pricing(
    property_id: int,
    start_date: str,
    end_date: str
):
    """Get property pricing for a specific date range"""
    # Validate property exists
    properties = property_service.get_all()
    property_obj = next((p for p in properties if p["id"] == property_id), None)

    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    # Parse input dates
    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)."
        )

    # Calculate number of nights
    nights = (end - start).days

    if nights <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )

    # Calculate base price
    base_price_total = property_obj["base_price"] * nights

    # Add cleaning fee and service fee
    cleaning_fee = property_obj.get("cleaning_fee", 0)
    service_fee = property_obj.get("service_fee", 0)

    # In a real implementation, we might have dynamic pricing based on demand, seasons, etc.
    # For mock purposes, we'll use fixed rates with a simple weekend premium

    # Check for weekends and apply premium
    weekend_premium = 0
    current_date = start
    while current_date < end:
        if current_date.weekday() >= 5:  # 5 and 6 are Saturday and Sunday
            weekend_premium += property_obj["base_price"] * 0.2  # 20% premium on weekends
        current_date += timedelta(days=1)

    # Calculate total
    total_price = base_price_total + cleaning_fee + service_fee + weekend_premium

    return {
        "property_id": property_id,
        "start_date": start_date,
        "end_date": end_date,
        "nights": nights,
        "base_price_per_night": property_obj["base_price"],
        "base_price_total": base_price_total,
        "cleaning_fee": cleaning_fee,
        "service_fee": service_fee,
        "weekend_premium": weekend_premium,
        "total_price": total_price,
        "price_breakdown": {
            "base_price": f"{base_price_total:.2f}",
            "cleaning_fee": f"{cleaning_fee:.2f}",
            "service_fee": f"{service_fee:.2f}",
            "weekend_premium": f"{weekend_premium:.2f}",
            "total": f"{total_price:.2f}"
        }
    }
