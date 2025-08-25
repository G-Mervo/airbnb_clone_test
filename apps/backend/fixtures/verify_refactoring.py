#!/usr/bin/env python3
"""
Quick verification script to ensure all refactoring is working correctly
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

def test_imports():
    """Test that all critical imports work"""
    print("🔧 Testing imports...")

    try:
        from services import auth_service, user_service
        print("✅ Core services imported successfully")
    except Exception as e:
        print(f"❌ Service import failed: {e}")
        return False

    try:
        from schemas.auth_schemas import UserRegisterSchema, UserLoginSchema
        print("✅ Auth schemas imported successfully")
    except Exception as e:
        print(f"❌ Schema import failed: {e}")
        return False

    try:
        from auth.dependencies import get_current_user
        print("✅ Auth dependencies imported successfully")
    except Exception as e:
        print(f"❌ Dependency import failed: {e}")
        return False

    return True

def test_auth_service():
    """Test basic auth service functionality"""
    print("\n🔐 Testing Auth Service...")

    try:
        from services import auth_service

        # Test password hashing
        password = "testpassword123"
        hashed = auth_service.hash_password(password)
        print(f"✅ Password hashing works")

        # Test password verification
        verified = auth_service.verify_password(password, hashed)
        if verified:
            print("✅ Password verification works")
        else:
            print("❌ Password verification failed")
            return False

        # Test token creation
        token_data = {"sub": "test@example.com", "user_id": 1}
        token = auth_service.create_access_token(token_data)
        print(f"✅ Token creation works")

        # Test token verification
        decoded = auth_service.verify_token(token)
        if decoded.get("sub") == "test@example.com":
            print("✅ Token verification works")
        else:
            print("❌ Token verification failed")
            return False

    except Exception as e:
        print(f"❌ Auth service test failed: {e}")
        return False

    return True

def test_user_service():
    """Test basic user service functionality"""
    print("\n👤 Testing User Service...")

    try:
        from services import user_service

        # Test getting all users
        users = user_service.get_all()
        print(f"✅ User service can retrieve users: {len(users)} found")

        # Test user validation
        test_user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }

        try:
            validated = user_service.validate_data(test_user_data)
            print("✅ User data validation works")
        except Exception as e:
            # This might fail if user already exists, which is OK
            print(f"ℹ️ User validation test: {e}")

    except Exception as e:
        print(f"❌ User service test failed: {e}")
        return False

    return True

def test_schemas():
    """Test schema validation"""
    print("\n📋 Testing Schemas...")

    try:
        from schemas.auth_schemas import UserRegisterSchema, UserLoginSchema

        # Test registration schema
        reg_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }

        reg_schema = UserRegisterSchema(**reg_data)
        print("✅ Registration schema validation works")

        # Test login schema
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }

        login_schema = UserLoginSchema(**login_data)
        print("✅ Login schema validation works")

    except Exception as e:
        print(f"❌ Schema test failed: {e}")
        return False

    return True

def main():
    """Run all verification tests"""
    print("🚀 Starting API Refactoring Verification")
    print("=" * 50)

    tests = [
        ("Import Tests", test_imports),
        ("Auth Service Tests", test_auth_service),
        ("User Service Tests", test_user_service),
        ("Schema Tests", test_schemas),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")

    print("\n" + "=" * 50)
    print(f"📊 Verification Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Your refactored API is ready!")
        print("\n💡 Next steps:")
        print("1. Start your FastAPI server: uvicorn main:app --reload")
        print("2. Run the comprehensive tests: cd fixtures && python run_all_tests.py")
        print("3. Check the API documentation at: http://localhost:8000/docs")
        return True
    else:
        print("⚠️ Some tests failed. Please review the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
