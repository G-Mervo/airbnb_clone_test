#!/usr/bin/env python3
"""
Test Runner - Orchestrates all test suites
"""

import subprocess
import sys
import os
import argparse
from datetime import datetime

def run_command(command, description):
    """Run a command and capture output"""
    print(f"\n{'='*60}")
    print(f"🏃 Running: {description}")
    print(f"Command: {command}")
    print('='*60)

    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )

        if result.stdout:
            print(result.stdout)

        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
        else:
            print(f"❌ {description} failed with return code {result.returncode}")

        return result.returncode == 0

    except Exception as e:
        print(f"❌ Error running {description}: {e}")
        return False

def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description='Run Airbnb API test suites')
    parser.add_argument('--services-only', action='store_true',
                       help='Run only service layer tests (no API server required)')
    parser.add_argument('--api-only', action='store_true',
                       help='Run only API tests (requires running server)')
    parser.add_argument('--performance', action='store_true',
                       help='Include performance tests')
    parser.add_argument('--server-url', default='http://localhost:8000',
                       help='API server URL for tests (default: http://localhost:8000)')

    args = parser.parse_args()

    print("🧪 AIRBNB API TEST SUITE RUNNER")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = []

    # Always run service tests first (they don't require server)
    if not args.api_only:
        print("\n🔧 PHASE 1: Service Layer Tests")
        success = run_command(
            "python test_services.py",
            "Service Layer Unit Tests"
        )
        results.append(("Service Tests", success))

    # Run API tests if requested and not services-only
    if not args.services_only:
        print("\n🌐 PHASE 2: API Integration Tests")

        # Check if server is running
        print(f"\n🔍 Checking if API server is running at {args.server_url}...")
        server_check = run_command(
            f"curl -s -o /dev/null -w '%{{http_code}}' {args.server_url}",
            f"Server Health Check ({args.server_url})"
        )

        if server_check:
            print("✅ Server is responding")

            # Run comprehensive API tests
            success = run_command(
                "python test_api_comprehensive.py",
                "Comprehensive API Tests"
            )
            results.append(("API Tests", success))

            # Run performance tests if requested
            if args.performance:
                print("\n⚡ PHASE 3: Performance Tests")
                success = run_command(
                    "python test_performance.py",
                    "API Performance Tests"
                )
                results.append(("Performance Tests", success))
        else:
            print("❌ Server is not responding. Please start the API server first.")
            print("   Try: cd ../src && python -m uvicorn api.main:app --reload")
            results.append(("API Tests", False))

    # Generate final summary
    print("\n" + "="*60)
    print("📋 FINAL TEST SUMMARY")
    print("="*60)

    total_suites = len(results)
    passed_suites = len([r for r in results if r[1]])

    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")

    print(f"\nSuite Summary: {passed_suites}/{total_suites} passed")

    if passed_suites == total_suites:
        print("🎉 All test suites passed!")
        exit_code = 0
    else:
        print("⚠️ Some test suites failed")
        exit_code = 1

    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # Instructions for failed tests
    if exit_code != 0:
        print("\n💡 TROUBLESHOOTING TIPS:")
        print("- For service tests: Check data files exist in src/data/")
        print("- For API tests: Ensure server is running with 'uvicorn api.main:app --reload'")
        print("- Check file paths and import statements")
        print("- Review individual test outputs above for specific errors")

    sys.exit(exit_code)

if __name__ == "__main__":
    main()
