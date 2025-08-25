from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime

# Import our service layer
from services import user_service, ServiceError, ValidationError, NotFoundError
from utils.data_manager import users_manager
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Constants
USER_NOT_FOUND = "User not found"
NOTIFICATION_NOT_FOUND = "Notification not found"


@router.get("/", response_model=List[Dict[str, Any]])
async def get_notifications(
    page: int=Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int=Query(20, ge=0, le=100, description="Number of rooms per page (0 = return all)"),
    is_read: Optional[bool]=None,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Get notifications for a user"""
    # Validate user exists
    notifications = user_service.get_user_notifications(current_user["id"])

    if not notifications:
        return []

    # Filter by is_read if specified
    if is_read is not None:
        notifications = [n for n in notifications if n["is_read"] == is_read]

    # Apply pagination
    skip = (page - 1) * limit
    end_idx = min(skip + limit, len(notifications))

    return notifications[skip:end_idx]


@router.get("/unread-count", response_model=Dict[str, Any])
async def get_unread_notification_count(
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Get count of unread notifications for a user"""
    # Validate user exists
    notifications = user_service.get_user_notifications(current_user["id"])
    unread_count = sum(1 for n in notifications if not n["is_read"])

    return {
        "user_id": current_user["id"],
        "unread_count": unread_count
    }


@router.get("/{notification_id}", response_model=Dict[str, Any])
async def get_notification(
    notification_id: int,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Get a specific notification"""
    # Validate user exists
    notifications = user_service.get_user_notifications(current_user["id"])
    notification = next((n for n in notifications if n["id"] == notification_id), None)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOTIFICATION_NOT_FOUND
        )

    # In a real implementation, we would load the notification from a database
    # For mock purposes, we'll create some sample notifications
    mock_notifications = [
        {
            "id": 1,
            "user_id": user_id,
            "type": "booking_confirmed",
            "title": "Booking Confirmed",
            "message": "Your booking at Oceanview Villa has been confirmed.",
            "related_id": 101,  # booking ID
            "is_read": True,
            "created_at": "2025-08-10T14:30:15"
        },
        {
            "id": 2,
            "user_id": user_id,
            "type": "booking_reminder",
            "title": "Upcoming Trip",
            "message": "Your trip to Mountain Cabin starts tomorrow!",
            "related_id": 102,  # booking ID
            "is_read": False,
            "created_at": "2025-08-11T09:00:00"
        },
        {
            "id": 3,
            "user_id": user_id,
            "type": "new_message",
            "title": "New Message",
            "message": "You have a new message from Jane about your booking.",
            "related_id": 201,  # conversation ID
            "is_read": False,
            "created_at": "2025-08-12T16:45:20"
        },
        {
            "id": 4,
            "user_id": user_id,
            "type": "review_reminder",
            "title": "Leave a Review",
            "message": "How was your stay at Cozy Apartment? Leave a review!",
            "related_id": 103,  # booking ID
            "is_read": False,
            "created_at": "2025-08-13T10:20:30"
        },
        {
            "id": 5,
            "user_id": user_id,
            "type": "payment_processed",
            "title": "Payment Processed",
            "message": "Your payment of $450 for Lakeside Cottage has been processed.",
            "related_id": 104,  # booking ID
            "is_read": True,
            "created_at": "2025-08-09T11:15:45"
        }
    ]

    # Find the notification
    notification = next((n for n in mock_notifications if n["id"] == notification_id), None)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOTIFICATION_NOT_FOUND
        )

    # Check if the notification belongs to the user
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this notification"
        )

    return notification


@router.put("/{notification_id}/read", response_model=Dict[str, Any])
async def mark_notification_as_read(
    notification_id: int,
    current_user: Dict[str, Any]=Depends(get_current_active_user)
):
    """Mark a notification as read"""
    # Validate user exists
    notifications = user_service.get_user_notifications(current_user["id"])
    notification = next((n for n in notifications if n["id"] == notification_id), None)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOTIFICATION_NOT_FOUND
        )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOTIFICATION_NOT_FOUND
        )

    # Check if the notification belongs to the user
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this notification"
        )

    # In a real implementation, we would update the notification in the database
    # For mock purposes, we'll return a success message

    notification["is_read"] = True
    user_service.update(notification_id, notification)

    return {
        **notification,
        "message": "Notification marked as read successfully (mock implementation)"
    }


@router.put("/read-all", response_model=Dict[str, Any])
async def mark_all_notifications_as_read(
    user_id: int
):
    """Mark all notifications as read for a user"""
    # Validate user exists
    users = user_service.get_all()
    user = next((u for u in users if u["id"] == user_id), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=USER_NOT_FOUND
        )

    # In a real implementation, we would update all notifications in the database
    # For mock purposes, we'll return a success message

    return {
        "user_id": user_id,
        "unread_count": 0,
        "message": "All notifications marked as read successfully (mock implementation)"
    }


@router.post("/settings", response_model=Dict[str, Any])
async def update_notification_settings(
    user_id: int,
    email_notifications: bool=True,
    push_notifications: bool=True,
    booking_reminders: bool=True,
    message_notifications: bool=True,
    review_reminders: bool=True,
    payment_notifications: bool=True
):
    """Update notification settings for a user"""
    # Validate user exists
    users = user_service.get_all()
    user = next((u for u in users if u["id"] == user_id), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=USER_NOT_FOUND
        )

    # In a real implementation, we would update the settings in the database
    # For mock purposes, we'll return a success message

    return {
        "user_id": user_id,
        "email_notifications": email_notifications,
        "push_notifications": push_notifications,
        "booking_reminders": booking_reminders,
        "message_notifications": message_notifications,
        "review_reminders": review_reminders,
        "payment_notifications": payment_notifications,
        "message": "Notification settings updated successfully (mock implementation)"
    }
