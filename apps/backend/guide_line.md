# Airbnb Backend Data Structure

## Overview

The backend uses a domain-driven JSON data organization approach for mock data management. All data files are organized by business domain under the `src/data/` directory.

## Data Organization

### Directory Structure

```
src/data/
├── bookings/           # Booking-related data
│   └── bookings.json
├── communications/     # Messages and conversations
│   ├── conversations.json
│   └── messages.json
├── payments/          # Payment transactions
│   └── payments.json
├── properties/        # Property listings and availability
│   ├── properties.json
│   └── calendar_availability.json
├── reviews/           # Property reviews and ratings
│   ├── property_reviews.json
│   ├── reviews.json
│   ├── property_reviews_stats.json
│   └── property_reviews.backup.json
└── users/             # User accounts and related data
    ├── users.json
    ├── notifications.json
    └── wishlists.json
```

## Data Managers

### Domain-Specific Data Managers

The application uses specialized data managers for each domain:

```python
from utils.data_manager import (
    reviews_manager,        # For reviews domain
    users_manager,          # For users domain
    properties_manager,     # For properties domain
    bookings_manager,       # For bookings domain
    communications_manager, # For communications domain
    payments_manager        # For payments domain
)
```

### Usage Examples

#### Loading Domain Data

```python
# Load reviews data
reviews = reviews_manager.load("property_reviews.json")

# Load user data
users = users_manager.load("users.json")

# Load property data
properties = properties_manager.load("properties.json")
```

#### CRUD Operations

```python
# Create a new booking
new_booking = bookings_manager.create("bookings.json", booking_data)

# Update a user
updated_user = users_manager.update("users.json", user_id, updates)

# Find property by ID
property_data = properties_manager.find_by_id("properties.json", property_id)

# Delete a review
deleted = reviews_manager.delete("property_reviews.json", review_id)
```

## API Route Integration

Each API route imports only the data managers it needs:

### Reviews Routes

```python
from utils.data_manager import reviews_manager, users_manager
```

### Bookings Routes

```python
from utils.data_manager import bookings_manager, properties_manager
```

### User/Auth Routes

```python
from utils.data_manager import users_manager
```

### Property Routes

```python
from utils.data_manager import properties_manager, users_manager
```

### Communications Routes

```python
from utils.data_manager import communications_manager, users_manager, properties_manager
```

## Benefits

### 1. **Domain Separation**

- Clear separation of concerns
- Each domain has its own data space
- Easier to maintain and understand

### 2. **Type Safety**

- Domain-specific managers ensure correct data access
- Reduces cross-domain data pollution
- Better error handling

### 3. **Performance**

- Only load data needed for specific operations
- Reduced memory footprint
- Faster file I/O operations

### 4. **Scalability**

- Easy to add new domains
- Simple to extend existing domains
- Clear migration path to databases

### 5. **Testing**

- Isolated domain testing
- Mock specific data managers
- Clear test data organization

## File Naming Conventions

- Use descriptive, domain-specific names
- Follow snake_case convention
- Include domain context in file names
- Keep backup files with `.backup.json` extension

## Migration Notes

### From Previous Structure

The data has been migrated from:

- `src/data/mock/` → `src/data/{domain}/`
- Generic `data_manager` → Domain-specific managers
- All API routes updated to use appropriate managers

### Backward Compatibility

The `data_manager` global instance is still available for legacy code, but all new development should use domain-specific managers.

## Best Practices

1. **Use Domain Managers**: Always use the appropriate domain manager
2. **Consistent Naming**: Follow established file naming patterns
3. **Error Handling**: Leverage built-in error handling and logging
4. **Documentation**: Document any new data structures or domains
5. **Testing**: Test data operations with appropriate domain managers

## Adding New Domains

To add a new domain:

1. Create directory under `src/data/{new_domain}/`
2. Add data manager in `utils/data_manager.py`:
   ```python
   new_domain_manager = DataManager(domain="new_domain")
   ```
3. Update API routes to import and use the new manager
4. Update this documentation

## Data Validation

Each domain should maintain consistent data schemas. Consider adding JSON schema validation for production environments.

## Future Considerations

- Database migration paths
- Data validation schemas
- API versioning for data format changes
- Performance monitoring and optimization

#### latest requirement

All my routes is very simple and not same with best pratice.

Help me refactor and improve all api

per on domain, i think should create new service into services folder and handle it

then create new script python into fixtures to verify all my apis

how do you think?
