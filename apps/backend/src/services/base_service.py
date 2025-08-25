"""
Base service class providing common functionality for all domain services
"""
import logging
from typing import List, Dict, Any, Optional, Type, TypeVar
from abc import ABC, abstractmethod
from datetime import datetime

from utils.data_manager import DataManager

logger = logging.getLogger(__name__)

T = TypeVar('T')


class ServiceError(Exception):
    """Base exception for service layer errors"""
    pass


class ValidationError(ServiceError):
    """Raised when data validation fails"""
    pass


class NotFoundError(ServiceError):
    """Raised when requested resource is not found"""
    pass


class ConflictError(ServiceError):
    """Raised when there's a conflict with existing data"""
    pass


class BaseService(ABC):
    """
    Abstract base service providing common CRUD operations and utilities
    """

    def __init__(self, data_manager: DataManager, domain_name: str):
        """
        Initialize service with data manager and domain name

        Args:
            data_manager: Domain-specific data manager
            domain_name: Name of the domain (e.g., 'bookings', 'users')
        """
        self.data_manager = data_manager
        self.domain_name = domain_name
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")

    @abstractmethod
    def get_primary_file(self) -> str:
        """Return the primary JSON file for this domain"""
        pass

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate data before operations. Override in subclasses for domain-specific validation.

        Args:
            data: Data to validate
            operation: Type of operation ('create', 'update')

        Returns:
            Validated and possibly sanitized data

        Raises:
            ValidationError: If validation fails
        """
        if not data:
            raise ValidationError("Data cannot be empty")
        return data

    def get_all(self, skip: int=0, limit: int=100, filters: Optional[Dict[str, Any]]=None) -> List[Dict[str, Any]]:
        """
        Get all items with optional filtering and pagination

        Args:
            skip: Number of items to skip
            limit: Maximum number of items to return
            filters: Optional filters to apply

        Returns:
            List of items
        """
        try:
            if filters:
                return self.data_manager.filter_data(self.get_primary_file(), filters, skip, limit)
            else:
                data = self.data_manager.load(self.get_primary_file())
                end_idx = min(skip + limit, len(data))
                return data[skip:end_idx]
        except Exception as e:
            self.logger.error(f"Error getting all {self.domain_name}: {e}")
            raise ServiceError(f"Failed to retrieve {self.domain_name}")

    def get_by_id(self, item_id: int) -> Dict[str, Any]:
        """
        Get item by ID

        Args:
            item_id: ID of the item

        Returns:
            Item data

        Raises:
            NotFoundError: If item not found
        """
        try:
            item = self.data_manager.find_by_id(self.get_primary_file(), item_id)
            if not item:
                raise NotFoundError(f"{self.domain_name.capitalize()} with ID {item_id} not found")
            return item
        except NotFoundError:
            raise
        except Exception as e:
            self.logger.error(f"Error getting {self.domain_name} by ID {item_id}: {e}")
            raise ServiceError(f"Failed to retrieve {self.domain_name}")

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create new item

        Args:
            data: Item data

        Returns:
            Created item with ID and timestamps

        Raises:
            ValidationError: If data is invalid
        """
        try:
            # Validate data
            validated_data = self.validate_data(data, "create")

            # Create item
            created_item = self.data_manager.create(self.get_primary_file(), validated_data)

            self.logger.info(f"Created new {self.domain_name} with ID {created_item['id']}")
            return created_item

        except ValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Error creating {self.domain_name}: {e}")
            raise ServiceError(f"Failed to create {self.domain_name}")

    def update(self, item_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update existing item

        Args:
            item_id: ID of item to update
            data: Updated data

        Returns:
            Updated item

        Raises:
            NotFoundError: If item not found
            ValidationError: If data is invalid
        """
        try:
            # Check if item exists
            self.get_by_id(item_id)

            # Validate update data
            validated_data = self.validate_data(data, "update")

            # Update item
            updated_item = self.data_manager.update(self.get_primary_file(), item_id, validated_data)

            if not updated_item:
                raise NotFoundError(f"{self.domain_name.capitalize()} with ID {item_id} not found")

            self.logger.info(f"Updated {self.domain_name} with ID {item_id}")
            return updated_item

        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            self.logger.error(f"Error updating {self.domain_name} {item_id}: {e}")
            raise ServiceError(f"Failed to update {self.domain_name}")

    def delete(self, item_id: int) -> bool:
        """
        Delete item by ID

        Args:
            item_id: ID of item to delete

        Returns:
            True if deleted successfully

        Raises:
            NotFoundError: If item not found
        """
        try:
            # Check if item exists
            self.get_by_id(item_id)

            # Delete item
            deleted = self.data_manager.delete(self.get_primary_file(), item_id)

            if not deleted:
                raise NotFoundError(f"{self.domain_name.capitalize()} with ID {item_id} not found")

            self.logger.info(f"Deleted {self.domain_name} with ID {item_id}")
            return deleted

        except NotFoundError:
            raise
        except Exception as e:
            self.logger.error(f"Error deleting {self.domain_name} {item_id}: {e}")
            raise ServiceError(f"Failed to delete {self.domain_name}")

    def find_by_field(self, field: str, value: Any) -> List[Dict[str, Any]]:
        """
        Find items by field value

        Args:
            field: Field name to search
            value: Value to match

        Returns:
            List of matching items
        """
        try:
            return self.data_manager.find_by_field(self.get_primary_file(), field, value)
        except Exception as e:
            self.logger.error(f"Error finding {self.domain_name} by {field}={value}: {e}")
            raise ServiceError(f"Failed to search {self.domain_name}")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics for this domain

        Returns:
            Statistics dictionary
        """
        try:
            return self.data_manager.get_stats(self.get_primary_file())
        except Exception as e:
            self.logger.error(f"Error getting {self.domain_name} stats: {e}")
            raise ServiceError(f"Failed to get {self.domain_name} statistics")
