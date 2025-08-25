#!/usr/bin/env python3
"""
API Routes Refactoring Progress Report
"""

import os
import re

def check_route_refactoring_status():
    """Check which routes are using service layer vs data manager"""

    routes_dir = "/Users/ert_macbook_99/projects/Airbnb/airbnb-main/apps/backend/src/api/routes"

    # List of all route files
    route_files = [
        "auth.py", "bookings.py", "calendar.py", "houses.py",
        "messages.py", "notifications.py", "payments.py",
        "reviews.py", "rooms.py", "wishlists.py"
    ]

    service_pattern = r'from services import|from services\.'
    data_manager_pattern = r'from utils\.data_manager import|\w+_manager\.load\('

    results = {
        "refactored": [],
        "partially_refactored": [],
        "not_refactored": []
    }

    for route_file in route_files:
        file_path = os.path.join(routes_dir, route_file)
        if not os.path.exists(file_path):
            continue

        try:
            with open(file_path, 'r') as f:
                content = f.read()

            has_service_import = bool(re.search(service_pattern, content))
            has_data_manager_calls = bool(re.search(data_manager_pattern, content))

            if has_service_import and not has_data_manager_calls:
                results["refactored"].append(route_file)
            elif has_service_import and has_data_manager_calls:
                results["partially_refactored"].append(route_file)
            else:
                results["not_refactored"].append(route_file)

        except Exception as e:
            print(f"Error checking {route_file}: {e}")

    return results

def print_report():
    """Print the refactoring status report"""
    results = check_route_refactoring_status()

    print("🚀 API ROUTES REFACTORING PROGRESS REPORT")
    print("=" * 60)

    print(f"\n✅ FULLY REFACTORED ({len(results['refactored'])} routes):")
    for route in results["refactored"]:
        print(f"   ✅ {route}")

    print(f"\n🔄 PARTIALLY REFACTORED ({len(results['partially_refactored'])} routes):")
    for route in results["partially_refactored"]:
        print(f"   🔄 {route} (has both service layer and data manager calls)")

    print(f"\n❌ NOT REFACTORED ({len(results['not_refactored'])} routes):")
    for route in results["not_refactored"]:
        print(f"   ❌ {route}")

    total_routes = len(results["refactored"]) + len(results["partially_refactored"]) + len(results["not_refactored"])
    completed_routes = len(results["refactored"])
    progress_percentage = (completed_routes / total_routes) * 100 if total_routes > 0 else 0

    print(f"\n📊 SUMMARY:")
    print(f"   Total Routes: {total_routes}")
    print(f"   Fully Refactored: {completed_routes}")
    print(f"   Progress: {progress_percentage:.1f}%")

    print(f"\n🎯 NEXT STEPS:")
    if results["partially_refactored"]:
        print("   1. Complete partial refactoring by removing data manager calls")
        for route in results["partially_refactored"]:
            print(f"      - {route}")

    if results["not_refactored"]:
        print("   2. Start refactoring remaining routes:")
        for route in results["not_refactored"]:
            print(f"      - {route}")

if __name__ == "__main__":
    print_report()
