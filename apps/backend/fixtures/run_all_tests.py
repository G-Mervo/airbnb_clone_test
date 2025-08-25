"""
Comprehensive API test runner for all Airbnb endpoints
"""
import asyncio
import logging
import sys
from typing import Dict, Any
import importlib
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveAPITester:
    """Run all API tests for the Airbnb backend"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_modules = [
            ("Authentication API", "test_auth_api"),
            ("Property API", "test_property_api"),
            # Add more test modules as we create them
        ]

    async def run_all_api_tests(self) -> Dict[str, Dict[str, bool]]:
        """Run all API test modules"""
        logger.info("🚀 Starting Comprehensive Airbnb API Testing")
        logger.info("=" * 60)

        all_results = {}
        overall_success = True

        for module_name, module_file in self.test_modules:
            logger.info(f"\n🔍 Testing {module_name}")
            logger.info("-" * 40)

            try:
                # Import the test module dynamically
                if module_file == "test_auth_api":
                    from test_auth_api import APITester
                    async with APITester(self.base_url) as tester:
                        results = await tester.run_all_tests()
                        all_results[module_name] = results

                elif module_file == "test_property_api":
                    from test_property_api import PropertyAPITester
                    async with PropertyAPITester(self.base_url) as tester:
                        results = await tester.run_all_tests()
                        all_results[module_name] = results

                # Check if all tests in this module passed
                module_success = all(results.values()) if results else False
                if not module_success:
                    overall_success = False

            except Exception as e:
                logger.error(f"❌ Failed to run {module_name} tests: {str(e)}")
                all_results[module_name] = {"error": str(e)}
                overall_success = False

        # Print comprehensive summary
        await self.print_comprehensive_summary(all_results, overall_success)

        return all_results

    async def print_comprehensive_summary(self, all_results: Dict[str, Dict[str, bool]], overall_success: bool):
        """Print a comprehensive summary of all test results"""
        logger.info("\n" + "=" * 60)
        logger.info("📊 COMPREHENSIVE API TEST SUMMARY")
        logger.info("=" * 60)

        total_tests = 0
        total_passed = 0

        for module_name, results in all_results.items():
            if isinstance(results, dict) and "error" not in results:
                module_passed = sum(1 for success in results.values() if success)
                module_total = len(results)

                total_tests += module_total
                total_passed += module_passed

                status = "✅" if module_passed == module_total else "❌"
                logger.info(f"{status} {module_name}: {module_passed}/{module_total} tests passed")

                # Show individual test results
                for test_name, success in results.items():
                    test_status = "✅" if success else "❌"
                    logger.info(f"   {test_status} {test_name}")

            elif "error" in results:
                logger.error(f"❌ {module_name}: Module failed to run - {results['error']}")

        logger.info("-" * 60)
        logger.info(f"🔢 TOTAL: {total_passed}/{total_tests} tests passed")

        if overall_success:
            logger.info("🎉 ALL TESTS PASSED! Your API is working correctly!")
        else:
            logger.warning(f"⚠️ {total_tests - total_passed} tests failed. Please review the errors above.")

        logger.info("=" * 60)

    async def check_server_health(self) -> bool:
        """Check if the server is running and healthy"""
        import aiohttp

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        logger.info("✅ Server health check passed")
                        return True
                    else:
                        logger.warning(f"⚠️ Server responded with status {response.status}")
                        return False
        except Exception as e:
            logger.error(f"❌ Server health check failed: {str(e)}")
            logger.error("Make sure your FastAPI server is running on http://localhost:8000")
            return False

    async def run_with_health_check(self) -> bool:
        """Run tests with initial health check"""
        logger.info("🏥 Performing server health check...")

        if not await self.check_server_health():
            logger.error("❌ Server is not responding. Please start your FastAPI server first.")
            logger.info("💡 Try running: uvicorn main:app --reload")
            return False

        # Run all tests
        results = await self.run_all_api_tests()

        # Return True if all tests passed
        return all(
            all(test_results.values())
            for test_results in results.values()
            if isinstance(test_results, dict) and "error" not in test_results
        )


async def main():
    """Main function to run comprehensive API tests"""
    import argparse

    parser = argparse.ArgumentParser(description="Comprehensive Airbnb API Tester")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the API server (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--skip-health-check",
        action="store_true",
        help="Skip the initial server health check"
    )

    args = parser.parse_args()

    tester = ComprehensiveAPITester(args.url)

    if args.skip_health_check:
        results = await tester.run_all_api_tests()
        success = all(
            all(test_results.values())
            for test_results in results.values()
            if isinstance(test_results, dict) and "error" not in test_results
        )
    else:
        success = await tester.run_with_health_check()

    return 0 if success else 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("\n⚠️ Testing interrupted by user")
        sys.exit(130)
