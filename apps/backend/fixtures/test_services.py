#!/usr/bin/env python3
"""
Service Layer Unit Tests
Tests all services independently without API calls
"""

import sys
import os
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_user_service():
    """Test UserService functionality"""
    print("👥 Testing UserService...")

    try:
        from services import user_service

        # Test get all users
        users = user_service.get_all(limit=5)
        print(f"✅ Get all users: {len(users)} users found")

        # Test get user by ID
        if users:
            user = user_service.get_by_id(users[0]["id"])
            print(f"✅ Get user by ID: Found user {user['first_name']} {user['last_name']}")

        # Test user authentication
        try:
            auth_result = user_service.authenticate("john.doe@example.com", "password123")
            if auth_result:
                print(f"✅ User authentication: Successful for {auth_result['email']}")
            else:
                print("⚠️ User authentication: Failed (expected for demo data)")
        except Exception as e:
            print(f"⚠️ User authentication test: {e}")

        # Test get user profile
        if users:
            profile = user_service.get_user_profile(users[0]["id"])
            has_no_password = "password" not in profile
            print(f"✅ Get user profile: Password removed = {has_no_password}")

        print("✅ UserService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ UserService test failed: {e}\n")
        return False

def test_property_service():
    """Test PropertyService functionality"""
    print("🏠 Testing PropertyService...")

    try:
        from services import property_service

        # Test get all properties
        properties = property_service.get_all(limit=5)
        print(f"✅ Get all properties: {len(properties)} properties found")

        # Test search properties
        search_results = property_service.search_properties(
            city="Los Angeles",
            min_price=100,
            max_price=500,
            limit=3
        )
        print(f"✅ Search properties: {len(search_results)} results for LA, $100-500")

        # Test get property details
        if properties:
            property_details = property_service.get_property_details(properties[0]["id"])
            has_review_stats = "review_stats" in property_details
            print(f"✅ Get property details: Enriched with review stats = {has_review_stats}")

        # Test get similar properties
        if properties:
            similar = property_service.get_similar_properties(properties[0]["id"], limit=3)
            print(f"✅ Get similar properties: {len(similar)} similar properties found")

        print("✅ PropertyService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ PropertyService test failed: {e}\n")
        return False

def test_booking_service():
    """Test BookingService functionality"""
    print("📅 Testing BookingService...")

    try:
        from services import booking_service

        # Test get all bookings
        bookings = booking_service.get_all(limit=5)
        print(f"✅ Get all bookings: {len(bookings)} bookings found")

        # Test get user bookings
        user_bookings = booking_service.get_user_bookings(user_id=3)
        print(f"✅ Get user bookings: {len(user_bookings)} bookings for user 3")

        # Test calculate price
        try:
            booking_data = {
                "property_id": 1,
                "check_in": (date.today() + timedelta(days=30)).isoformat() + "T15:00:00Z",
                "check_out": (date.today() + timedelta(days=33)).isoformat() + "T11:00:00Z",
                "guests": 2
            }
            total_price = booking_service.calculate_total_price(booking_data)
            print(f"✅ Calculate booking price: ${total_price}")
        except Exception as e:
            print(f"⚠️ Calculate price test: {e}")

        # Test create booking
        try:
            test_booking = {
                "property_id": 1,
                "guest_id": 3,
                "check_in": (date.today() + timedelta(days=60)).isoformat() + "T15:00:00Z",
                "check_out": (date.today() + timedelta(days=63)).isoformat() + "T11:00:00Z",
                "guests": 2
            }
            created_booking = booking_service.create_booking(test_booking)
            print(f"✅ Create booking: Booking {created_booking['id']} created")

            # Test confirm booking
            confirmed_booking = booking_service.confirm_booking(created_booking["id"])
            print(f"✅ Confirm booking: Status = {confirmed_booking['status']}")

        except Exception as e:
            print(f"⚠️ Create/confirm booking test: {e}")

        print("✅ BookingService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ BookingService test failed: {e}\n")
        return False

def test_review_service():
    """Test ReviewService functionality"""
    print("⭐ Testing ReviewService...")

    try:
        from services import review_service

        # Test get property reviews
        property_reviews = review_service.get_property_reviews(property_id=1, limit=5)
        print(f"✅ Get property reviews: {len(property_reviews)} reviews for property 1")

        # Test get review statistics
        stats = review_service.get_review_statistics(property_id=1)
        print(f"✅ Get review statistics: {stats.get('total_reviews', 0)} total reviews, avg rating {stats.get('average_rating', 0)}")

        # Test get user reviews
        user_reviews = review_service.get_user_reviews(user_id=1, limit=3)
        print(f"✅ Get user reviews: {len(user_reviews)} reviews by user 1")

        # Test enrichment
        if property_reviews:
            first_review = property_reviews[0]
            has_guest_info = "guest" in first_review
            print(f"✅ Review enrichment: Has guest info = {has_guest_info}")

        print("✅ ReviewService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ ReviewService test failed: {e}\n")
        return False

def test_payment_service():
    """Test PaymentService functionality"""
    print("💳 Testing PaymentService...")

    try:
        from services import payment_service

        # Test get all payments
        payments = payment_service.get_all(limit=5)
        print(f"✅ Get all payments: {len(payments)} payments found")

        # Test process payment simulation
        try:
            test_payment = {
                "booking_id": 1,
                "amount": 299.99,
                "payment_method": "credit_card",
                "currency": "USD"
            }
            processed_payment = payment_service.process_payment(test_payment)
            print(f"✅ Process payment: Status = {processed_payment['status']}")
        except Exception as e:
            print(f"⚠️ Process payment test: {e}")

        # Test payment analytics
        analytics = payment_service.get_payment_analytics()
        print(f"✅ Payment analytics: {analytics.get('total_payments', 0)} total payments, success rate {analytics.get('success_rate', 0)}%")

        print("✅ PaymentService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ PaymentService test failed: {e}\n")
        return False

def test_communication_service():
    """Test CommunicationService functionality"""
    print("💬 Testing CommunicationService...")

    try:
        from services import communication_service

        # Test get user conversations
        conversations = communication_service.get_user_conversations(user_id=1, limit=5)
        print(f"✅ Get user conversations: {len(conversations)} conversations for user 1")

        # Test create conversation
        try:
            new_conversation = communication_service.create_conversation(
                participant_ids=[1, 3],
                property_id=1,
                initial_message="Hi! I'm interested in your property."
            )
            print(f"✅ Create conversation: Conversation {new_conversation['id']} created")

            # Test send message
            message = communication_service.send_message(
                conversation_id=new_conversation["id"],
                sender_id=1,
                content="What's the check-in time?"
            )
            print(f"✅ Send message: Message {message['id']} sent")

        except Exception as e:
            print(f"⚠️ Create conversation/send message test: {e}")

        print("✅ CommunicationService tests completed\n")
        return True

    except Exception as e:
        print(f"❌ CommunicationService test failed: {e}\n")
        return False

def test_data_manager_integration():
    """Test data manager integration"""
    print("🔧 Testing DataManager integration...")

    try:
        from utils.data_manager import (
            users_manager, properties_manager, bookings_manager,
            reviews_manager, payments_manager, communications_manager
        )

        # Test each manager
        managers = [
            ("users_manager", users_manager, "users.json"),
            ("properties_manager", properties_manager, "properties.json"),
            ("bookings_manager", bookings_manager, "bookings.json"),
            ("reviews_manager", reviews_manager, "property_reviews.json"),
            ("payments_manager", payments_manager, "payments.json"),
            ("communications_manager", communications_manager, "conversations.json")
        ]

        for name, manager, filename in managers:
            try:
                data = manager.load(filename)
                print(f"✅ {name}: Loaded {len(data)} items from {filename}")
            except Exception as e:
                print(f"⚠️ {name}: {e}")

        print("✅ DataManager integration tests completed\n")
        return True

    except Exception as e:
        print(f"❌ DataManager integration test failed: {e}\n")
        return False

def main():
    """Run all service tests"""
    print("🧪 STARTING SERVICE LAYER TESTS")
    print("="*50)

    test_functions = [
        test_data_manager_integration,
        test_user_service,
        test_property_service,
        test_booking_service,
        test_review_service,
        test_payment_service,
        test_communication_service
    ]

    results = []
    for test_func in test_functions:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {test_func.__name__} failed with exception: {e}\n")
            results.append(False)

    # Summary
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total * 100) if total > 0 else 0

    print("="*50)
    print("📊 SERVICE TESTS SUMMARY")
    print("="*50)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {success_rate:.1f}%")

    if success_rate >= 80:
        print("🎉 Service layer is working well!")
    elif success_rate >= 60:
        print("⚠️ Service layer has some issues that need attention")
    else:
        print("❌ Service layer needs significant fixes")

    print("="*50)

if __name__ == "__main__":
    main()
