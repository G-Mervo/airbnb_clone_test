"""
Data Manager Utility for JSON-based Mock Data Operations
Provides comprehensive CRUD operations for managing JSON data files
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataManager:
    """
    Comprehensive data manager for JSON-based mock data operations
    Supports CRUD operations with proper error handling and logging
    """

    def __init__(self, base_path: Optional[str] = None, domain: Optional[str] = None):
        """
        Initialize DataManager with base path for data files

        Args:
            base_path: Custom base path for data files
            domain: Domain folder name (e.g., 'reviews', 'users', 'properties')
        """
        if base_path:
            self.base_path = Path(base_path)
        elif domain:
            # Use domain-specific directory under data folder
            self.base_path = Path(__file__).parent.parent / "data" / domain
        else:
            # Default to data directory root
            self.base_path = Path(__file__).parent.parent / "data"

        # Ensure data directory exists
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"DataManager initialized with base path: {self.base_path}")

    def _get_file_path(self, file_name: str) -> Path:
        """Get full file path for a given file name"""
        if not file_name.endswith('.json'):
            file_name += '.json'
        return self.base_path / file_name

    def load(self, file_name: str) -> List[Dict[str, Any]]:
        """
        Load data from JSON file

        Args:
            file_name: Name of the JSON file (with or without .json extension)

        Returns:
            List of dictionaries containing the data

        Raises:
            FileNotFoundError: If file doesn't exist
            json.JSONDecodeError: If file contains invalid JSON
        """
        file_path = self._get_file_path(file_name)

        try:
            if not file_path.exists():
                logger.warning(f"File not found: {file_path}")
                return []

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Successfully loaded {len(data) if isinstance(data, list) else 1} items from {file_name}")
                return data if isinstance(data, list) else [data]

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {file_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading {file_name}: {e}")
            raise

    def save(self, file_name: str, data: List[Dict[str, Any]]) -> bool:
        """
        Save data to JSON file

        Args:
            file_name: Name of the JSON file
            data: List of dictionaries to save

        Returns:
            True if successful, False otherwise
        """
        file_path = self._get_file_path(file_name)

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            logger.info(f"Successfully saved {len(data)} items to {file_name}")
            return True

        except Exception as e:
            logger.error(f"Error saving to {file_name}: {e}")
            return False

    def find_by_id(self, file_name: str, item_id: Union[int, str]) -> Optional[Dict[str, Any]]:
        """
        Find an item by ID

        Args:
            file_name: Name of the JSON file
            item_id: ID to search for

        Returns:
            Dictionary containing the item, or None if not found
        """
        data = self.load(file_name)

        for item in data:
            if str(item.get('id')) == str(item_id):
                logger.debug(f"Found item with ID {item_id} in {file_name}")
                return item

        logger.debug(f"Item with ID {item_id} not found in {file_name}")
        return None

    def find_by_field(self, file_name: str, field: str, value: Any) -> List[Dict[str, Any]]:
        """
        Find items by a specific field value

        Args:
            file_name: Name of the JSON file
            field: Field name to search
            value: Value to match

        Returns:
            List of matching items
        """
        data = self.load(file_name)
        matches = [item for item in data if item.get(field) == value]

        logger.debug(f"Found {len(matches)} items with {field}={value} in {file_name}")
        return matches

    def create(self, file_name: str, new_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new item in the data file

        Args:
            file_name: Name of the JSON file
            new_item: Dictionary containing the new item data

        Returns:
            The created item with generated ID and timestamps
        """
        data = self.load(file_name)

        # Generate new ID
        if data:
            max_id = max(int(item.get('id', 0)) for item in data)
            new_id = max_id + 1
        else:
            new_id = 1

        # Add metadata
        timestamp = datetime.now().isoformat()
        created_item = {
            'id': new_id,
            **new_item,
            'created_at': timestamp,
            'updated_at': timestamp
        }

        data.append(created_item)

        if self.save(file_name, data):
            logger.info(f"Created new item with ID {new_id} in {file_name}")
            return created_item
        else:
            raise Exception(f"Failed to save new item to {file_name}")

    def update(self, file_name: str, item_id: Union[int, str], updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing item

        Args:
            file_name: Name of the JSON file
            item_id: ID of the item to update
            updates: Dictionary containing fields to update

        Returns:
            Updated item, or None if not found
        """
        data = self.load(file_name)

        for i, item in enumerate(data):
            if str(item.get('id')) == str(item_id):
                # Update fields
                data[i].update(updates)
                data[i]['updated_at'] = datetime.now().isoformat()

                if self.save(file_name, data):
                    logger.info(f"Updated item with ID {item_id} in {file_name}")
                    return data[i]
                else:
                    raise Exception(f"Failed to save updates to {file_name}")

        logger.warning(f"Item with ID {item_id} not found in {file_name}")
        return None

    def delete(self, file_name: str, item_id: Union[int, str]) -> bool:
        """
        Delete an item by ID

        Args:
            file_name: Name of the JSON file
            item_id: ID of the item to delete

        Returns:
            True if deleted, False if not found
        """
        data = self.load(file_name)
        original_length = len(data)

        data = [item for item in data if str(item.get('id')) != str(item_id)]

        if len(data) < original_length:
            if self.save(file_name, data):
                logger.info(f"Deleted item with ID {item_id} from {file_name}")
                return True
            else:
                raise Exception(f"Failed to save deletion to {file_name}")
        else:
            logger.warning(f"Item with ID {item_id} not found in {file_name}")
            return False

    def filter_data(self, file_name: str, filters: Dict[str, Any],
                   skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Filter data with pagination

        Args:
            file_name: Name of the JSON file
            filters: Dictionary of field:value pairs to filter by
            skip: Number of items to skip (for pagination)
            limit: Maximum number of items to return

        Returns:
            Filtered and paginated list of items
        """
        data = self.load(file_name)

        # Apply filters
        filtered_data = data
        for field, value in filters.items():
            if value is not None:
                filtered_data = [item for item in filtered_data if item.get(field) == value]

        # Apply pagination
        total = len(filtered_data)
        end_idx = min(skip + limit, total)
        result = filtered_data[skip:end_idx]

        logger.debug(f"Filtered {total} items, returning {len(result)} items (skip={skip}, limit={limit})")
        return result

    def get_stats(self, file_name: str) -> Dict[str, Any]:
        """
        Get statistics about a data file

        Args:
            file_name: Name of the JSON file

        Returns:
            Dictionary containing file statistics
        """
        file_path = self._get_file_path(file_name)

        if not file_path.exists():
            return {"exists": False}

        data = self.load(file_name)
        file_stat = file_path.stat()

        return {
            "exists": True,
            "total_items": len(data),
            "file_size_bytes": file_stat.st_size,
            "last_modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
            "file_path": str(file_path)
        }


# Global instance for easy import
data_manager = DataManager()

# Domain-specific data managers for organized data access
reviews_manager = DataManager(domain="reviews")
users_manager = DataManager(domain="users")
properties_manager = DataManager(domain="properties")
bookings_manager = DataManager(domain="bookings")
communications_manager = DataManager(domain="communications")
payments_manager = DataManager(domain="payments")


# Convenience functions for backward compatibility
def load_mock_data(file_name: str) -> List[Dict[str, Any]]:
    """Legacy function for backward compatibility"""
    return data_manager.load(file_name)


def find_item_by_id(file_name: str, item_id: Union[int, str]) -> Optional[Dict[str, Any]]:
    """Legacy function for backward compatibility"""
    return data_manager.find_by_id(file_name, item_id)
