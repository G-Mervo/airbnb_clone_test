from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime

# Import our service layer
from services import communication_service, user_service, property_service, ServiceError, ValidationError, NotFoundError

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations", response_model=List[Dict[str, Any]])
async def get_conversations(
    user_id: Optional[int]=None,
        page: int=1,
    limit: int=10
):
    """Get all conversations for a user"""
    try:
        if user_id:
            # Validate user exists
            user = user_service.get_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

                skip = (page - 1) * limit
                return communication_service.get_user_conversations(user_id, skip, limit)
        else:
                skip = (page - 1) * limit
                return communication_service.get_all(skip, limit)

    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    if user_id and not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=USER_NOT_FOUND
        )

    # Create mock conversations
    mock_conversations = [
        {
            "id": 1,
            "property_id": 2,
            "host_id": 1,
            "guest_id": 3,
            "last_message": "Is the parking free?",
            "last_message_time": "2025-08-10T14:23:15",
            "unread_count": 1,
            "created_at": "2025-08-10T10:15:30"
        },
        {
            "id": 2,
            "property_id": 5,
            "host_id": 2,
            "guest_id": 3,
            "last_message": "Thanks for the information!",
            "last_message_time": "2025-08-11T09:45:20",
            "unread_count": 0,
            "created_at": "2025-08-09T15:30:45"
        },
        {
            "id": 3,
            "property_id": 8,
            "host_id": 4,
            "guest_id": 3,
            "last_message": "What time is check-in?",
            "last_message_time": "2025-08-12T18:10:05",
            "unread_count": 2,
            "created_at": "2025-08-12T16:20:10"
        }
    ]

    # Filter by user if specified
    if user_id:
        mock_conversations = [
            c for c in mock_conversations
            if c["host_id"] == user_id or c["guest_id"] == user_id
        ]


@router.post("/conversations", response_model=Dict[str, Any])
async def create_conversation(conversation_data: Dict[str, Any]):
    """Create a new conversation"""
    try:
        guest_id = conversation_data.get("guest_id")
        host_id = conversation_data.get("host_id")
        property_id = conversation_data.get("property_id")

        if not all([guest_id, host_id, property_id]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Validate entities exist
        guest = user_service.get_by_id(guest_id)
        host = user_service.get_by_id(host_id)
        property_obj = property_service.get_property(property_id)

        if not guest or not host or not property_obj:
            raise HTTPException(status_code=404, detail="Referenced entity not found")

        # Create conversation using service
        conversation = communication_service.create_conversation(
            guest_id=guest_id,
            host_id=host_id,
            property_id=property_id
        )

        return conversation

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=Dict[str, Any])
async def get_conversation(conversation_id: int):
    """Get a specific conversation"""
    # Create mock conversations (same as above)
    mock_conversations = [
        {
            "id": 1,
            "property_id": 2,
            "host_id": 1,
            "guest_id": 3,
            "last_message": "Is the parking free?",
            "last_message_time": "2025-08-10T14:23:15",
            "unread_count": 1,
            "created_at": "2025-08-10T10:15:30"
        },
        {
            "id": 2,
            "property_id": 5,
            "host_id": 2,
            "guest_id": 3,
            "last_message": "Thanks for the information!",
            "last_message_time": "2025-08-11T09:45:20",
            "unread_count": 0,
            "created_at": "2025-08-09T15:30:45"
        },
        {
            "id": 3,
            "property_id": 8,
            "host_id": 4,
            "guest_id": 3,
            "last_message": "What time is check-in?",
            "last_message_time": "2025-08-12T18:10:05",
            "unread_count": 2,
            "created_at": "2025-08-12T16:20:10"
        }
    ]

    # Find the conversation
    conversation = next((c for c in mock_conversations if c["id"] == conversation_id), None)

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CONVERSATION_NOT_FOUND
        )

    # Enrich with property and user details
    properties = property_service.get_all()
    users = user_service.get_all()

    property_data = next((p for p in properties if p["id"] == conversation["property_id"]), {})
    host_data = next((u for u in users if u["id"] == conversation["host_id"]), {})
    guest_data = next((u for u in users if u["id"] == conversation["guest_id"]), {})

    # Create mock messages for this conversation
    mock_messages = [
        {
            "id": 1,
            "conversation_id": conversation_id,
            "sender_id": conversation["guest_id"],
            "receiver_id": conversation["host_id"],
            "content": "Hi! I'm interested in your property.",
            "created_at": "2025-08-10T10:15:30",
            "read": True
        },
        {
            "id": 2,
            "conversation_id": conversation_id,
            "sender_id": conversation["host_id"],
            "receiver_id": conversation["guest_id"],
            "content": "Hello! Thank you for your interest. Let me know if you have any questions.",
            "created_at": "2025-08-10T10:30:45",
            "read": True
        },
        {
            "id": 3,
            "conversation_id": conversation_id,
            "sender_id": conversation["guest_id"],
            "receiver_id": conversation["host_id"],
            "content": "Is the parking free?",
            "created_at": "2025-08-10T14:23:15",
            "read": False
        }
    ]

    result = {
        **conversation,
        "property": {
            "id": property_data.get("id"),
            "title": property_data.get("title"),
            "image": property_data.get("images", [])[0] if property_data.get("images") else None
        },
        "host": {
            "id": host_data.get("id"),
            "first_name": host_data.get("first_name"),
            "last_name": host_data.get("last_name"),
            "profile_picture": host_data.get("profile_picture")
        },
        "guest": {
            "id": guest_data.get("id"),
            "first_name": guest_data.get("first_name"),
            "last_name": guest_data.get("last_name"),
            "profile_picture": guest_data.get("profile_picture")
        },
        "messages": mock_messages
    }

    return result


@router.post("/conversations", response_model=Dict[str, Any])
async def create_conversation(
    property_id: int,
    guest_id: int,
    initial_message: str
):
    """Create a new conversation (mock implementation)"""
    # Validate property exists
    properties = property_service.get_all()
    property_data = next((p for p in properties if p["id"] == property_id), None)

    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROPERTY_NOT_FOUND
        )

    # Validate users exist
    users = user_service.get_all()
    guest = next((u for u in users if u["id"] == guest_id), None)

    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=USER_NOT_FOUND
        )

    host_id = property_data.get("host_id")
    host = next((u for u in users if u["id"] == host_id), None)

    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )

    # In a real implementation, we would create a new conversation in the database
    # For mock purposes, we'll return a fake conversation
    now = datetime.now().isoformat()

    new_conversation = {
        "id": 999,
        "property_id": property_id,
        "host_id": host_id,
        "guest_id": guest_id,
        "last_message": initial_message,
        "last_message_time": now,
        "unread_count": 1,
        "created_at": now,
        "property": {
            "id": property_data.get("id"),
            "title": property_data.get("title"),
            "image": property_data.get("images", [])[0] if property_data.get("images") else None
        },
        "host": {
            "id": host.get("id"),
            "first_name": host.get("first_name"),
            "last_name": host.get("last_name"),
            "profile_picture": host.get("profile_picture")
        },
        "guest": {
            "id": guest.get("id"),
            "first_name": guest.get("first_name"),
            "last_name": guest.get("last_name"),
            "profile_picture": guest.get("profile_picture")
        },
        "messages": [
            {
                "id": 1,
                "conversation_id": 999,
                "sender_id": guest_id,
                "receiver_id": host_id,
                "content": initial_message,
                "created_at": now,
                "read": False
            }
        ],
        "message": "Conversation created successfully (mock implementation)"
    }

    return new_conversation


@router.post("/conversations/{conversation_id}/messages", response_model=Dict[str, Any])
async def send_message(
    conversation_id: int,
    sender_id: int,
    content: str
):
    """Send a message in a conversation (mock implementation)"""
    # Create mock conversations (same as above)
    mock_conversations = [
        {
            "id": 1,
            "property_id": 2,
            "host_id": 1,
            "guest_id": 3,
            "last_message": "Is the parking free?",
            "last_message_time": "2025-08-10T14:23:15",
            "unread_count": 1,
            "created_at": "2025-08-10T10:15:30"
        },
        {
            "id": 2,
            "property_id": 5,
            "host_id": 2,
            "guest_id": 3,
            "last_message": "Thanks for the information!",
            "last_message_time": "2025-08-11T09:45:20",
            "unread_count": 0,
            "created_at": "2025-08-09T15:30:45"
        },
        {
            "id": 3,
            "property_id": 8,
            "host_id": 4,
            "guest_id": 3,
            "last_message": "What time is check-in?",
            "last_message_time": "2025-08-12T18:10:05",
            "unread_count": 2,
            "created_at": "2025-08-12T16:20:10"
        }
    ]

    # Find the conversation
    conversation = next((c for c in mock_conversations if c["id"] == conversation_id), None)

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CONVERSATION_NOT_FOUND
        )

    # Validate sender is part of the conversation
    if sender_id != conversation["host_id"] and sender_id != conversation["guest_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this conversation"
        )

    # Determine receiver based on sender
    receiver_id = conversation["host_id"] if sender_id == conversation["guest_id"] else conversation["guest_id"]

    # In a real implementation, we would add the message to the database
    # For mock purposes, we'll return a fake message
    now = datetime.now().isoformat()

    new_message = {
        "id": 999,
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "created_at": now,
        "read": False,
        "message": "Message sent successfully (mock implementation)"
    }

    return new_message


@router.put("/conversations/{conversation_id}/read", response_model=Dict[str, Any])
async def mark_conversation_as_read(
    conversation_id: int,
    user_id: int
):
    """Mark all messages in a conversation as read (mock implementation)"""
    # Create mock conversations (same as above)
    mock_conversations = [
        {
            "id": 1,
            "property_id": 2,
            "host_id": 1,
            "guest_id": 3,
            "last_message": "Is the parking free?",
            "last_message_time": "2025-08-10T14:23:15",
            "unread_count": 1,
            "created_at": "2025-08-10T10:15:30"
        },
        {
            "id": 2,
            "property_id": 5,
            "host_id": 2,
            "guest_id": 3,
            "last_message": "Thanks for the information!",
            "last_message_time": "2025-08-11T09:45:20",
            "unread_count": 0,
            "created_at": "2025-08-09T15:30:45"
        },
        {
            "id": 3,
            "property_id": 8,
            "host_id": 4,
            "guest_id": 3,
            "last_message": "What time is check-in?",
            "last_message_time": "2025-08-12T18:10:05",
            "unread_count": 2,
            "created_at": "2025-08-12T16:20:10"
        }
    ]

    # Find the conversation
    conversation = next((c for c in mock_conversations if c["id"] == conversation_id), None)

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CONVERSATION_NOT_FOUND
        )

    # Validate user is part of the conversation
    if user_id != conversation["host_id"] and user_id != conversation["guest_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this conversation"
        )

    # In a real implementation, we would mark all messages as read in the database
    # For mock purposes, we'll return a success message

    return {
        "conversation_id": conversation_id,
        "unread_count": 0,
        "message": "All messages marked as read successfully (mock implementation)"
    }
