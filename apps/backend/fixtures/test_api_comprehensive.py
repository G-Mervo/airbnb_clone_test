#!/usr/bin/env python3
"""
Comprehensive API Test Suite
Verifies all API endpoints with realistic test scenarios
"""

import asyncio
import httpx
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class APITestSuite:
    """Comprehensive test suite for all API endpoints"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=base_url)
        self.test_results = []
        self.created_resources = {}  # Track created resources for cleanup

    async def run_all_tests(self):
        """Run all test categories"""
        logger.info("🚀 Starting comprehensive API test suite")

        try:
            # Test basic health check first
            await self.test_health_check()

            # Test all endpoints
            await self.test_user_endpoints()
            await self.test_property_endpoints()
            await self.test_booking_endpoints()
            await self.test_review_endpoints()
            await self.test_payment_endpoints()
            await self.test_communication_endpoints()

            # Generate report
            self.generate_report()

        except Exception as e:
            logger.error(f"Test suite failed: {e}")
        finally:
            await self.client.aclose()

    async def test_health_check(self):
        """Test basic API health"""
        logger.info("🔍 Testing API health check")

        try:
            response = await self.client.get("/")
            self.record_test("Health Check", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("Health Check", False, f"Error: {e}")

    async def test_user_endpoints(self):
        """Test user-related endpoints"""
        logger.info("👥 Testing user endpoints")

        # Test get users
        try:
            response = await self.client.get("/auth/users")
            self.record_test("GET /auth/users", response.status_code == 200,
                           f"Status: {response.status_code}, Count: {len(response.json()) if response.status_code == 200 else 'N/A'}")
        except Exception as e:
            self.record_test("GET /auth/users", False, f"Error: {e}")

        # Test get specific user
        try:
            response = await self.client.get("/auth/users/1")
            self.record_test("GET /auth/users/1", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /auth/users/1", False, f"Error: {e}")

        # Test user authentication
        try:
            auth_data = {
                "email": "john.doe@example.com",
                "password": "password123"
            }
            response = await self.client.post("/auth/login", json=auth_data)
            self.record_test("POST /auth/login", response.status_code in [200, 401],
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("POST /auth/login", False, f"Error: {e}")

    async def test_property_endpoints(self):
        """Test property-related endpoints"""
        logger.info("🏠 Testing property endpoints")

        # Test get properties
        try:
            response = await self.client.get("/properties")
            self.record_test("GET /properties", response.status_code == 200,
                           f"Status: {response.status_code}, Count: {len(response.json()) if response.status_code == 200 else 'N/A'}")
        except Exception as e:
            self.record_test("GET /properties", False, f"Error: {e}")

        # Test property search with filters
        try:
            params = {"city": "Los Angeles", "min_price": 100, "max_price": 500}
            response = await self.client.get("/properties/search", params=params)
            self.record_test("GET /properties/search (filtered)", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /properties/search (filtered)", False, f"Error: {e}")

        # Test get specific property
        try:
            response = await self.client.get("/properties/1")
            self.record_test("GET /properties/1", response.status_code == 200,
                           f"Status: {response.status_code}")

            if response.status_code == 200:
                property_data = response.json()
                self.record_test("Property data enrichment",
                               "review_stats" in property_data,
                               f"Has review stats: {'review_stats' in property_data}")
        except Exception as e:
            self.record_test("GET /properties/1", False, f"Error: {e}")

        # Test similar properties
        try:
            response = await self.client.get("/properties/1/similar")
            self.record_test("GET /properties/1/similar", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /properties/1/similar", False, f"Error: {e}")

    async def test_booking_endpoints(self):
        """Test booking-related endpoints"""
        logger.info("📅 Testing booking endpoints")

        # Test get bookings
        try:
            response = await self.client.get("/bookings")
            self.record_test("GET /bookings", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /bookings", False, f"Error: {e}")

        # Test get user bookings
        try:
            response = await self.client.get("/bookings/my-bookings")
            self.record_test("GET /bookings/my-bookings", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /bookings/my-bookings", False, f"Error: {e}")

        # Test booking price calculation
        try:
            booking_data = {
                "property_id": 1,
                "check_in": (date.today() + timedelta(days=30)).isoformat(),
                "check_out": (date.today() + timedelta(days=33)).isoformat(),
                "guests": 2
            }
            response = await self.client.post("/bookings/calculate-price", json=booking_data)
            self.record_test("POST /bookings/calculate-price", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("POST /bookings/calculate-price", False, f"Error: {e}")

        # Test create booking
        try:
            booking_data = {
                "property_id": 1,
                "guest_id": 3,
                "check_in": (date.today() + timedelta(days=45)).isoformat() + "T15:00:00Z",
                "check_out": (date.today() + timedelta(days=48)).isoformat() + "T11:00:00Z",
                "guests": 2
            }
            response = await self.client.post("/bookings", json=booking_data)

            if response.status_code == 201:
                booking = response.json()
                self.created_resources["booking"] = booking["id"]
                self.record_test("POST /bookings", True,
                               f"Status: {response.status_code}, Booking ID: {booking['id']}")
            else:
                self.record_test("POST /bookings", False,
                               f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.record_test("POST /bookings", False, f"Error: {e}")

        # Test get specific booking
        if "booking" in self.created_resources:
            try:
                booking_id = self.created_resources["booking"]
                response = await self.client.get(f"/bookings/{booking_id}")
                self.record_test(f"GET /bookings/{booking_id}", response.status_code == 200,
                               f"Status: {response.status_code}")
            except Exception as e:
                self.record_test(f"GET /bookings/{booking_id}", False, f"Error: {e}")

    async def test_review_endpoints(self):
        """Test review-related endpoints"""
        logger.info("⭐ Testing review endpoints")

        # Test get property reviews
        try:
            response = await self.client.get("/reviews/property/1")
            self.record_test("GET /reviews/property/1", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /reviews/property/1", False, f"Error: {e}")

        # Test get property review statistics
        try:
            response = await self.client.get("/reviews/property/1/stats")
            self.record_test("GET /reviews/property/1/stats", response.status_code == 200,
                           f"Status: {response.status_code}")

            if response.status_code == 200:
                stats = response.json()
                self.record_test("Review stats completeness",
                               all(key in stats for key in ["total_reviews", "average_rating", "rating_distribution"]),
                               f"Has required fields: {list(stats.keys())}")
        except Exception as e:
            self.record_test("GET /reviews/property/1/stats", False, f"Error: {e}")

        # Test get user reviews
        try:
            response = await self.client.get("/reviews/user/1")
            self.record_test("GET /reviews/user/1", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /reviews/user/1", False, f"Error: {e}")

        # Test create review (if we have a booking)
        if "booking" in self.created_resources:
            try:
                review_data = {
                    "property_id": 1,
                    "guest_id": 3,
                    "booking_id": self.created_resources["booking"],
                    "overall_rating": 5,
                    "cleanliness_rating": 5,
                    "accuracy_rating": 4,
                    "communication_rating": 5,
                    "location_rating": 5,
                    "check_in_rating": 4,
                    "value_rating": 4,
                    "comment": "Great place to stay! Very clean and exactly as described."
                }
                response = await self.client.post("/reviews", json=review_data)

                if response.status_code == 201:
                    review = response.json()
                    self.created_resources["review"] = review["id"]
                    self.record_test("POST /reviews", True,
                                   f"Status: {response.status_code}, Review ID: {review['id']}")
                else:
                    self.record_test("POST /reviews", False,
                                   f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.record_test("POST /reviews", False, f"Error: {e}")

    async def test_payment_endpoints(self):
        """Test payment-related endpoints"""
        logger.info("💳 Testing payment endpoints")

        # Test get payments (if we have a booking)
        if "booking" in self.created_resources:
            try:
                response = await self.client.get("/payments")
                self.record_test("GET /payments", response.status_code == 200,
                               f"Status: {response.status_code}")
            except Exception as e:
                self.record_test("GET /payments", False, f"Error: {e}")

            # Test process payment
            try:
                payment_data = {
                    "booking_id": self.created_resources["booking"],
                    "amount": 500.00,
                    "payment_method": "credit_card",
                    "currency": "USD"
                }
                response = await self.client.post("/payments/process", json=payment_data)

                if response.status_code == 201:
                    payment = response.json()
                    self.created_resources["payment"] = payment["id"]
                    self.record_test("POST /payments/process", True,
                                   f"Status: {response.status_code}, Payment ID: {payment['id']}")
                else:
                    self.record_test("POST /payments/process", False,
                                   f"Status: {response.status_code}")
            except Exception as e:
                self.record_test("POST /payments/process", False, f"Error: {e}")

    async def test_communication_endpoints(self):
        """Test communication-related endpoints"""
        logger.info("💬 Testing communication endpoints")

        # Test get conversations
        try:
            response = await self.client.get("/messages/conversations")
            self.record_test("GET /messages/conversations", response.status_code == 200,
                           f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("GET /messages/conversations", False, f"Error: {e}")

        # Test create conversation
        try:
            conversation_data = {
                "participant_ids": [1, 3],
                "property_id": 1,
                "initial_message": "Hi! I'm interested in booking your property."
            }
            response = await self.client.post("/messages/conversations", json=conversation_data)

            if response.status_code == 201:
                conversation = response.json()
                self.created_resources["conversation"] = conversation["id"]
                self.record_test("POST /messages/conversations", True,
                               f"Status: {response.status_code}, Conversation ID: {conversation['id']}")
            else:
                self.record_test("POST /messages/conversations", False,
                               f"Status: {response.status_code}")
        except Exception as e:
            self.record_test("POST /messages/conversations", False, f"Error: {e}")

        # Test send message (if we have a conversation)
        if "conversation" in self.created_resources:
            try:
                message_data = {
                    "content": "When would be the best time to check in?",
                    "sender_id": 1
                }
                conversation_id = self.created_resources["conversation"]
                response = await self.client.post(f"/messages/conversations/{conversation_id}/messages",
                                                json=message_data)
                self.record_test(f"POST /messages/conversations/{conversation_id}/messages",
                               response.status_code == 201,
                               f"Status: {response.status_code}")
            except Exception as e:
                self.record_test("POST message", False, f"Error: {e}")

    def record_test(self, test_name: str, success: bool, details: str = ""):
        """Record test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)

        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {details}")

    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests

        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "created_resources": self.created_resources,
            "test_results": self.test_results
        }

        # Save report to file
        report_file = f"api_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        # Print summary
        print("\n" + "="*60)
        print("🧪 API TEST SUITE SUMMARY")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Report saved to: {report_file}")

        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")

        if self.created_resources:
            print(f"\n📝 Created Resources: {self.created_resources}")

        print("="*60)

async def main():
    """Main test runner"""
    test_suite = APITestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
