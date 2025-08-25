# API Testing Fixtures

This directory contains comprehensive API testing scripts for the Airbnb backend application.

## Overview

The testing framework provides automated verification of all API endpoints, ensuring they work correctly and follow best practices.

## Test Scripts

### 1. Authentication API Tests (`test_auth_api.py`)

Tests all authentication-related endpoints:

- User registration
- User login (form and JSON)
- Profile management
- Token refresh
- User logout
- Public user endpoints

### 2. Property API Tests (`test_property_api.py`)

Tests all property/house-related endpoints:

- Get all houses
- Search houses
- Get house details
- House photos
- Availability checking
- Similar properties
- CRUD operations (create/update)

### 3. Comprehensive Test Runner (`run_all_tests.py`)

Runs all test modules and provides a comprehensive summary.

## Usage

### Prerequisites

1. Make sure your FastAPI server is running:

   ```bash
   cd /path/to/backend
   uvicorn main:app --reload
   ```

2. Install required dependencies:
   ```bash
   pip install aiohttp
   ```

### Running Individual Tests

```bash
# Test authentication APIs
python test_auth_api.py

# Test property APIs
python test_property_api.py
```

### Running All Tests

```bash
# Run comprehensive test suite
python run_all_tests.py

# Run with custom server URL
python run_all_tests.py --url http://localhost:8001

# Skip health check
python run_all_tests.py --skip-health-check
```

## Test Output

The tests provide detailed output including:

- ✅ Success indicators for passing tests
- ❌ Error indicators for failing tests
- 📊 Summary statistics
- 🎉 Overall success/failure status

## Example Output

```
🚀 Starting comprehensive API testing...

📋 Running: User Registration
✅ User registration successful

📋 Running: User Login (Form)
✅ Form login successful

📊 Test Results Summary:
==================================================
User Registration: ✅ PASS
User Login (Form): ✅ PASS
User Login (JSON): ✅ PASS
Get Current User: ✅ PASS
...
==================================================
Tests Passed: 9/9
🎉 All tests passed!
```

## Configuration

### Test Data

The tests use predefined test data that can be modified in each test file:

- Default test user: `test@example.com` / `testpassword123`
- Test property data with realistic values

### Server Configuration

- Default server URL: `http://localhost:8000`
- Configurable via command line arguments
- Automatic health check before running tests

## Adding New Tests

To add tests for new API endpoints:

1. Create a new test file (e.g., `test_booking_api.py`)
2. Follow the existing pattern with a test class
3. Add the new test module to `run_all_tests.py`

### Test Class Template

```python
class NewAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.auth_token = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def test_endpoint(self) -> bool:
        # Your test logic here
        pass

    async def run_all_tests(self) -> Dict[str, bool]:
        # Run all tests and return results
        pass
```

## Troubleshooting

### Common Issues

1. **Server not running**: Ensure FastAPI server is started
2. **Authentication failures**: Check if test user exists or create it
3. **Network errors**: Verify server URL and network connectivity

### Debug Mode

Add more detailed logging by modifying the logging level:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Integration with CI/CD

These tests can be integrated into CI/CD pipelines:

```bash
# Exit code 0 for success, 1 for failure
python run_all_tests.py
echo $?  # Check exit code
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Tests should not leave permanent data
3. **Error Handling**: Graceful handling of expected failures
4. **Logging**: Clear, actionable error messages
5. **Performance**: Tests should complete quickly

## Contributing

When adding new API endpoints:

1. Add corresponding tests
2. Update this README
3. Ensure tests pass before committing
4. Follow the existing code style and patterns
