from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
import random

# Import our service layer
from services import payment_service, ServiceError, ValidationError, NotFoundError

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_payments():
    """Get payment history"""
    try:
        return payment_service.get_all()
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Dict[str, Any])
async def process_payment(payment_data: Dict[str, Any]):
    """Process payment"""
    try:
        booking_id = payment_data.get("booking_id")
        amount = payment_data.get("amount", 0)
        payment_method = payment_data.get("payment_method", "card")

        if not booking_id or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid payment data")

        # Process payment using service
        result = payment_service.process_payment(
            booking_id=booking_id,
            amount=amount,
            payment_method=payment_method
        )

        return result

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{payment_id}", response_model=Dict[str, Any])
async def get_payment(payment_id: str):
    """Get specific payment details"""
    try:
        payment = payment_service.get_by_id(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Payment not found")
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refund", response_model=Dict[str, Any])
async def refund_payment(refund_data: Dict[str, Any]):
    """Process payment refund"""
    try:
        payment_id = refund_data.get("payment_id")
        amount = refund_data.get("amount", 0)

        if not payment_id or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid refund data")

        result = payment_service.process_refund(payment_id, amount)
        return result

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
