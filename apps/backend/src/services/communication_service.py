"""
Communication service for handling messages and conversations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from .base_service import BaseService, ValidationError, NotFoundError
from utils.data_manager import communications_manager, users_manager, properties_manager


class CommunicationService(BaseService):
    """Service for communication operations including messages and conversations"""

    def __init__(self):
        super().__init__(communications_manager, "communication")
        self.users_manager = users_manager
        self.properties_manager = properties_manager

    def get_primary_file(self) -> str:
        return "conversations.json"

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate communication data

        Args:
            data: Communication data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            # Required fields for conversation
            if "participants" in validated_data:
                participants = validated_data["participants"]
                if not isinstance(participants, list) or len(participants) < 2:
                    raise ValidationError("Conversation must have at least 2 participants")

                # Validate all participants exist
                for participant_id in participants:
                    if not self.users_manager.find_by_id("users.json", participant_id):
                        raise ValidationError(f"User with ID {participant_id} not found")

        return validated_data

    def create_conversation(self, participant_ids: List[int], property_id: Optional[int]=None,
                          initial_message: Optional[str]=None) -> Dict[str, Any]:
        """
        Create a new conversation

        Args:
            participant_ids: List of user IDs
            property_id: Optional property ID for property-related conversations
            initial_message: Optional initial message

        Returns:
            Created conversation
        """
        if len(participant_ids) < 2:
            raise ValidationError("Conversation must have at least 2 participants")

        # Check if conversation already exists between these participants
        existing_conversation = self._find_existing_conversation(participant_ids)
        if existing_conversation:
            return existing_conversation

        conversation_data = {
            "participants": participant_ids,
            "property_id": property_id,
            "status": "active",
            "last_message_at": datetime.now().isoformat()
        }

        conversation = self.create(conversation_data)

        # Send initial message if provided
        if initial_message:
            self.send_message(conversation["id"], participant_ids[0], initial_message)

        return conversation

    def _find_existing_conversation(self, participant_ids: List[int]) -> Optional[Dict[str, Any]]:
        """Find existing conversation between participants"""
        try:
            conversations = self.data_manager.load(self.get_primary_file())

            for conversation in conversations:
                conv_participants = set(conversation.get("participants", []))
                if conv_participants == set(participant_ids):
                    return conversation

            return None
        except Exception:
            return None

    def send_message(self, conversation_id: int, sender_id: int, content: str,
                    message_type: str="text") -> Dict[str, Any]:
        """
        Send a message in a conversation

        Args:
            conversation_id: Conversation ID
            sender_id: Sender user ID
            content: Message content
            message_type: Type of message ('text', 'image', 'document')

        Returns:
            Created message
        """
        # Validate conversation exists
        conversation = self.get_by_id(conversation_id)

        # Validate sender is participant
        if sender_id not in conversation.get("participants", []):
            raise ValidationError("Sender must be a participant in the conversation")

        # Validate content
        if not content or len(content.strip()) == 0:
            raise ValidationError("Message content cannot be empty")

        if len(content) > 1000:
            raise ValidationError("Message content cannot exceed 1000 characters")

        # Create message
        message_data = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content.strip(),
            "message_type": message_type,
            "status": "sent",
            "timestamp": datetime.now().isoformat()
        }

        try:
            messages = self.data_manager.load("messages.json")
        except:
            messages = []

        # Generate message ID
        message_id = max([m.get("id", 0) for m in messages], default=0) + 1
        message_data["id"] = message_id
        message_data["created_at"] = datetime.now().isoformat()
        message_data["updated_at"] = datetime.now().isoformat()

        messages.append(message_data)
        self.data_manager.save("messages.json", messages)

        # Update conversation last message time
        self.update(conversation_id, {"last_message_at": datetime.now().isoformat()})

        self.logger.info(f"Message sent in conversation {conversation_id} by user {sender_id}")
        return message_data

    def get_user_conversations(self, user_id: int, skip: int=0, limit: int=20) -> List[Dict[str, Any]]:
        """
        Get conversations for a user

        Args:
            user_id: User ID
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of conversations with enriched data
        """
        try:
            conversations = self.data_manager.load(self.get_primary_file())

            # Filter conversations where user is a participant
            user_conversations = [
                c for c in conversations
                if user_id in c.get("participants", [])
            ]

            # Sort by last message time
            sorted_conversations = sorted(
                user_conversations,
                key=lambda x: x.get("last_message_at", ""),
                reverse=True
            )

            # Apply pagination
            end_idx = min(skip + limit, len(sorted_conversations))
            paginated_conversations = sorted_conversations[skip:end_idx]

            # Enrich with additional data
            enriched_conversations = []
            for conversation in paginated_conversations:
                enriched_conversation = self._enrich_conversation(conversation, user_id)
                enriched_conversations.append(enriched_conversation)

            return enriched_conversations

        except Exception as e:
            self.logger.error(f"Error getting user conversations: {e}")
            return []

    def get_conversation_messages(self, conversation_id: int, user_id: int,
                                skip: int=0, limit: int=50) -> List[Dict[str, Any]]:
        """
        Get messages from a conversation

        Args:
            conversation_id: Conversation ID
            user_id: Requesting user ID (for permission check)
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of messages with sender information
        """
        # Validate user can access conversation
        conversation = self.get_by_id(conversation_id)
        if user_id not in conversation.get("participants", []):
            raise ValidationError("User does not have access to this conversation")

        try:
            messages = self.data_manager.load("messages.json")

            # Filter messages for this conversation
            conversation_messages = [
                m for m in messages
                if m.get("conversation_id") == conversation_id
            ]

            # Sort by timestamp
            sorted_messages = sorted(
                conversation_messages,
                key=lambda x: x.get("timestamp", "")
            )

            # Apply pagination
            end_idx = min(skip + limit, len(sorted_messages))
            paginated_messages = sorted_messages[skip:end_idx]

            # Enrich with sender information
            enriched_messages = []
            for message in paginated_messages:
                enriched_message = self._enrich_message_with_sender(message)
                enriched_messages.append(enriched_message)

            return enriched_messages

        except Exception as e:
            self.logger.error(f"Error getting conversation messages: {e}")
            return []

    def mark_messages_as_read(self, conversation_id: int, user_id: int) -> bool:
        """
        Mark all messages in a conversation as read by a user

        Args:
            conversation_id: Conversation ID
            user_id: User ID

        Returns:
            True if successful
        """
        try:
            messages = self.data_manager.load("messages.json")

            updated = False
            for i, message in enumerate(messages):
                if (message.get("conversation_id") == conversation_id and
                    message.get("sender_id") != user_id):

                    # Mark as read
                    if "read_by" not in message:
                        message["read_by"] = []

                    if user_id not in message["read_by"]:
                        message["read_by"].append(user_id)
                        message["read_at"] = datetime.now().isoformat()
                        updated = True

            if updated:
                self.data_manager.save("messages.json", messages)
                self.logger.info(f"Messages marked as read in conversation {conversation_id} by user {user_id}")

            return True

        except Exception as e:
            self.logger.error(f"Error marking messages as read: {e}")
            return False

    def _enrich_conversation(self, conversation: Dict[str, Any], current_user_id: int) -> Dict[str, Any]:
        """Enrich conversation with additional data"""
        enriched_conversation = conversation.copy()

        try:
            # Get other participants (excluding current user)
            participants = conversation.get("participants", [])
            other_participants = [p for p in participants if p != current_user_id]

            # Get participant details
            participant_details = []
            for participant_id in other_participants:
                user = self.users_manager.find_by_id("users.json", participant_id)
                if user:
                    participant_details.append({
                        "id": user["id"],
                        "first_name": user["first_name"],
                        "last_name": user["last_name"],
                        "avatar": user.get("avatar")
                    })

            enriched_conversation["other_participants"] = participant_details

            # Get property details if applicable
            property_id = conversation.get("property_id")
            if property_id:
                property_data = self.properties_manager.find_by_id("rooms.json", property_id)
                if property_data:
                    enriched_conversation["property"] = {
                        "id": property_data["id"],
                        "title": property_data["title"],
                        "city": property_data["city"],
                        "image_url": property_data.get("image_url")
                    }

            # Get last message
            messages = self.data_manager.load("messages.json")
            conversation_messages = [
                m for m in messages
                if m.get("conversation_id") == conversation["id"]
            ]

            if conversation_messages:
                last_message = max(conversation_messages, key=lambda x: x.get("timestamp", ""))
                enriched_conversation["last_message"] = {
                    "content": last_message.get("content", ""),
                    "timestamp": last_message.get("timestamp", ""),
                    "sender_id": last_message.get("sender_id")
                }

            # Count unread messages
            unread_count = len([
                m for m in conversation_messages
                if (m.get("sender_id") != current_user_id and
                    current_user_id not in m.get("read_by", []))
            ])
            enriched_conversation["unread_count"] = unread_count

        except Exception as e:
            self.logger.error(f"Error enriching conversation: {e}")

        return enriched_conversation

    def _enrich_message_with_sender(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich message with sender information"""
        enriched_message = message.copy()

        try:
            sender_id = message.get("sender_id")
            if sender_id:
                sender = self.users_manager.find_by_id("users.json", sender_id)
                if sender:
                    enriched_message["sender"] = {
                        "id": sender["id"],
                        "first_name": sender["first_name"],
                        "last_name": sender["last_name"],
                        "avatar": sender.get("avatar")
                    }
        except Exception as e:
            self.logger.error(f"Error enriching message with sender: {e}")

        return enriched_message
