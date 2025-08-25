"""
User service for handling user-related operations
"""
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from .base_service import BaseService, ValidationError, NotFoundError, ConflictError
from utils.data_manager import users_manager

class UserService(BaseService):
    def get_wishlists(self, user_id: int = None, include_properties: bool = False, skip: int = 0, limit: int = 10) -> list:
        """
        Get all wishlists, optionally filtered by user_id, paginated.
        """
        wishlists = self.data_manager.load("wishlists.json")
        if user_id is not None:
            wishlists = [w for w in wishlists if w.get("user_id") == user_id]
        # Sort by created_at descending if available
        wishlists = sorted(wishlists, key=lambda x: x.get("created_at", ""), reverse=True)
        result = wishlists[skip:skip+limit]
        # Optionally enrich with property details (mock, as property_service is not imported here)
        return result
    """Service for user operations including authentication and profile management"""

    def __init__(self):
        super().__init__(users_manager, "user")

    def get_primary_file(self) -> str:
        return "users.json"

    def validate_data(self, data: Dict[str, Any], operation: str = "create") -> Dict[str, Any]:
        """
        Validate user data

        Args:
            data: User data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data

        Raises:
            ValidationError: If validation fails
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            # Required fields for creation
            required_fields = ["email", "password", "first_name", "last_name"]
            for field in required_fields:
                if field not in validated_data or not validated_data[field]:
                    raise ValidationError(f"Field '{field}' is required")

            # Email validation
            email = validated_data["email"]
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                raise ValidationError("Invalid email format")

            # Check email uniqueness
            existing_users = self.data_manager.find_by_field(self.get_primary_file(), "email", email)
            if existing_users:
                raise ConflictError("Email already registered")

            # Password validation
            password = validated_data["password"]
            if len(password) < 8:
                raise ValidationError("Password must be at least 8 characters long")

        # Sanitize data
        if "email" in validated_data:
            validated_data["email"] = validated_data["email"].lower().strip()

        if "first_name" in validated_data:
            validated_data["first_name"] = validated_data["first_name"].strip()

        if "last_name" in validated_data:
            validated_data["last_name"] = validated_data["last_name"].strip()

        return validated_data

    def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with email and password

        Args:
            email: User email
            password: User password

        Returns:
            User data if authentication successful, None otherwise
        """
        try:
            users = self.data_manager.find_by_field(self.get_primary_file(), "email", email.lower())
            if not users:
                return None

            user = users[0]
            # In production, use proper password hashing
            if user.get("password") == password:
                # Remove password from response
                user_data = user.copy()
                user_data.pop("password", None)
                return user_data

            return None
        except Exception as e:
            self.logger.error(f"Error during authentication for {email}: {e}")
            return None

    def get_user_profile(self, user_id: int) -> Dict[str, Any]:
        """
        Get user profile without sensitive information

        Args:
            user_id: User ID

        Returns:
            User profile data
        """
        user = self.get_by_id(user_id)
        # Remove sensitive information
        profile = user.copy()
        profile.pop("password", None)
        return profile

    def update_profile(self, user_id: int, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user profile

        Args:
            user_id: User ID
            profile_data: Profile data to update

        Returns:
            Updated user profile
        """
        # Don't allow password updates through this method
        profile_data.pop("password", None)
        profile_data.pop("email", None)  # Email changes need special handling

        updated_user = self.update(user_id, profile_data)
        # Remove password from response
        updated_user.pop("password", None)
        return updated_user

    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        """
        Change user password

        Args:
            user_id: User ID
            old_password: Current password
            new_password: New password

        Returns:
            True if password changed successfully

        Raises:
            ValidationError: If old password is incorrect or new password is invalid
        """
        user = self.get_by_id(user_id)

        # Verify old password
        if user.get("password") != old_password:
            raise ValidationError("Current password is incorrect")

        # Validate new password
        if len(new_password) < 8:
            raise ValidationError("New password must be at least 8 characters long")

        # Update password
        self.update(user_id, {"password": new_password})
        self.logger.info(f"Password changed for user {user_id}")
        return True

    def get_user_notifications(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get notifications for a user

        Args:
            user_id: User ID

        Returns:
            List of user notifications
        """
        try:
            notifications = self.data_manager.load("notifications.json")
            user_notifications = [n for n in notifications if n.get("user_id") == user_id]
            # Sort by created_at descending
            return sorted(user_notifications, key=lambda x: x.get("created_at", ""), reverse=True)
        except Exception as e:
            self.logger.error(f"Error getting notifications for user {user_id}: {e}")
            return []

    def get_user_wishlists(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get wishlists for a user

        Args:
            user_id: User ID

        Returns:
            List of user wishlists
        """
        try:
            wishlists = self.data_manager.load("wishlists.json")
            user_wishlists = [w for w in wishlists if w.get("user_id") == user_id]
            return user_wishlists
        except Exception as e:
            self.logger.error(f"Error getting wishlists for user {user_id}: {e}")
            return []

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user account

        Args:
            user_data: User registration data

        Returns:
            Created user data (without password)
        """
        created_user = self.create(user_data)
        # Remove password from response
        created_user.pop("password", None)
        return created_user

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by email

        Args:
            email: User email

        Returns:
            User data if found, None otherwise
        """
        users = self.data_manager.find_by_field(self.get_primary_file(), "email", email.lower())

        return users[0] if users else None
