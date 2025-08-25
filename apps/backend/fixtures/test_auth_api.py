"""
API verification script for testing all authentication endpoints
"""
import asyncio
import aiohttp
import json
from typing import Dict, Any, List
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APITester:
    """Class to test all authentication API endpoints"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.auth_token = None
        self.test_user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "+1234567890"
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def get_headers(self, include_auth: bool = False) -> Dict[str, str]:
        """Get headers for API requests"""
        headers = {"Content-Type": "application/json"}
        if include_auth and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    async def make_request(
        self,
        method: str,
        endpoint: str,
        data: Dict[str, Any] = None,
        include_auth: bool = False
    ) -> Dict[str, Any]:
        """Make an HTTP request to the API"""
        url = f"{self.base_url}{endpoint}"
        headers = self.get_headers(include_auth)

        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers) as response:
                    result = await response.json()
                    return {"status": response.status, "data": result}
            elif method.upper() == "POST":
                async with self.session.post(url, headers=headers, json=data) as response:
                    result = await response.json()
                    return {"status": response.status, "data": result}
            elif method.upper() == "PUT":
                async with self.session.put(url, headers=headers, json=data) as response:
                    result = await response.json()
                    return {"status": response.status, "data": result}
        except Exception as e:
            logger.error(f"Request failed for {method} {endpoint}: {str(e)}")
            return {"status": 0, "error": str(e)}

    async def test_user_registration(self) -> bool:
        """Test user registration endpoint"""
        logger.info("Testing user registration...")

        result = await self.make_request("POST", "/auth/register", self.test_user_data)

        if result["status"] == 201:
            logger.info("✅ User registration successful")
            return True
        elif result["status"] == 409:
            logger.info("ℹ️ User already exists (expected for repeat tests)")
            return True
        else:
            logger.error(f"❌ User registration failed: {result}")
            return False

    async def test_user_login_form(self) -> bool:
        """Test user login with form data"""
        logger.info("Testing user login with form data...")

        # Prepare form data
        form_data = aiohttp.FormData()
        form_data.add_field('username', self.test_user_data['email'])
        form_data.add_field('password', self.test_user_data['password'])

        url = f"{self.base_url}/auth/login"

        try:
            async with self.session.post(url, data=form_data) as response:
                result = await response.json()

                if response.status == 200 and "access_token" in result:
                    self.auth_token = result["access_token"]
                    logger.info("✅ Form login successful")
                    return True
                else:
                    logger.error(f"❌ Form login failed: {result}")
                    return False
        except Exception as e:
            logger.error(f"❌ Form login request failed: {str(e)}")
            return False

    async def test_user_login_json(self) -> bool:
        """Test user login with JSON payload"""
        logger.info("Testing user login with JSON...")

        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }

        result = await self.make_request("POST", "/auth/login/json", login_data)

        if result["status"] == 200 and "access_token" in result.get("data", {}):
            self.auth_token = result["data"]["access_token"]
            logger.info("✅ JSON login successful")
            return True
        else:
            logger.error(f"❌ JSON login failed: {result}")
            return False

    async def test_get_current_user(self) -> bool:
        """Test getting current user profile"""
        logger.info("Testing get current user profile...")

        if not self.auth_token:
            logger.error("❌ No auth token available")
            return False

        result = await self.make_request("GET", "/auth/me", include_auth=True)

        if result["status"] == 200:
            logger.info("✅ Get current user successful")
            logger.info(f"User profile: {json.dumps(result['data'], indent=2)}")
            return True
        else:
            logger.error(f"❌ Get current user failed: {result}")
            return False

    async def test_update_user_profile(self) -> bool:
        """Test updating user profile"""
        logger.info("Testing update user profile...")

        if not self.auth_token:
            logger.error("❌ No auth token available")
            return False

        update_data = {
            "bio": f"Updated bio at {datetime.now().isoformat()}",
            "location": "Test City, TC"
        }

        result = await self.make_request("PUT", "/auth/me", update_data, include_auth=True)

        if result["status"] == 200:
            logger.info("✅ Update user profile successful")
            return True
        else:
            logger.error(f"❌ Update user profile failed: {result}")
            return False

    async def test_get_all_users(self) -> bool:
        """Test getting all users"""
        logger.info("Testing get all users...")

        result = await self.make_request("GET", "/auth/users?skip=0&limit=5")

        if result["status"] == 200:
            users = result.get("data", [])
            logger.info(f"✅ Get all users successful - Found {len(users)} users")
            return True
        else:
            logger.error(f"❌ Get all users failed: {result}")
            return False

    async def test_get_user_by_id(self) -> bool:
        """Test getting user by ID"""
        logger.info("Testing get user by ID...")

        # First get all users to find a valid ID
        result = await self.make_request("GET", "/auth/users?limit=1")

        if result["status"] == 200 and result.get("data"):
            user_id = result["data"][0]["id"]

            # Now get the specific user
            user_result = await self.make_request("GET", f"/auth/users/{user_id}")

            if user_result["status"] == 200:
                logger.info("✅ Get user by ID successful")
                return True
            else:
                logger.error(f"❌ Get user by ID failed: {user_result}")
                return False
        else:
            logger.error("❌ Could not find a user ID to test with")
            return False

    async def test_token_refresh(self) -> bool:
        """Test token refresh"""
        logger.info("Testing token refresh...")

        if not self.auth_token:
            logger.error("❌ No auth token available")
            return False

        result = await self.make_request("POST", "/auth/refresh", include_auth=True)

        if result["status"] == 200 and "access_token" in result.get("data", {}):
            logger.info("✅ Token refresh successful")
            return True
        else:
            logger.error(f"❌ Token refresh failed: {result}")
            return False

    async def test_logout(self) -> bool:
        """Test user logout"""
        logger.info("Testing user logout...")

        if not self.auth_token:
            logger.error("❌ No auth token available")
            return False

        result = await self.make_request("POST", "/auth/logout", include_auth=True)

        if result["status"] == 200:
            logger.info("✅ Logout successful")
            return True
        else:
            logger.error(f"❌ Logout failed: {result}")
            return False

    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all authentication tests"""
        logger.info("🚀 Starting comprehensive API testing...")

        tests = [
            ("User Registration", self.test_user_registration),
            ("User Login (Form)", self.test_user_login_form),
            ("User Login (JSON)", self.test_user_login_json),
            ("Get Current User", self.test_get_current_user),
            ("Update User Profile", self.test_update_user_profile),
            ("Get All Users", self.test_get_all_users),
            ("Get User by ID", self.test_get_user_by_id),
            ("Token Refresh", self.test_token_refresh),
            ("User Logout", self.test_logout),
        ]

        results = {}

        for test_name, test_func in tests:
            logger.info(f"\n📋 Running: {test_name}")
            try:
                success = await test_func()
                results[test_name] = success
            except Exception as e:
                logger.error(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False

        # Print summary
        logger.info("\n📊 Test Results Summary:")
        logger.info("=" * 50)

        passed = 0
        total = len(results)

        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"{test_name}: {status}")
            if success:
                passed += 1

        logger.info("=" * 50)
        logger.info(f"Tests Passed: {passed}/{total}")

        if passed == total:
            logger.info("🎉 All tests passed!")
        else:
            logger.warning(f"⚠️ {total - passed} tests failed")

        return results


async def main():
    """Main function to run the API tests"""
    logger.info("Starting Airbnb Authentication API Testing")

    async with APITester("http://localhost:8000") as tester:
        results = await tester.run_all_tests()

        # Return exit code based on results
        all_passed = all(results.values())
        return 0 if all_passed else 1


if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
