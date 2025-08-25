#!/usr/bin/env python3
"""
API Performance Test
Simple load testing for API endpoints
"""

import asyncio
import httpx
import time
import statistics
from datetime import datetime
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

class APIPerformanceTest:
    """Simple performance testing for API endpoints"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = {}

    async def test_endpoint_performance(self, endpoint: str, method: str = "GET",
                                      data: dict = None, requests: int = 10):
        """Test performance of a specific endpoint"""
        print(f"🚀 Testing {method} {endpoint} ({requests} requests)...")

        response_times = []
        successful_requests = 0
        failed_requests = 0

        async with httpx.AsyncClient(base_url=self.base_url) as client:
            for i in range(requests):
                start_time = time.time()

                try:
                    if method == "GET":
                        response = await client.get(endpoint)
                    elif method == "POST":
                        response = await client.post(endpoint, json=data)
                    else:
                        continue

                    end_time = time.time()
                    response_time = (end_time - start_time) * 1000  # Convert to milliseconds

                    if response.status_code < 400:
                        successful_requests += 1
                        response_times.append(response_time)
                    else:
                        failed_requests += 1
                        print(f"  Request {i+1} failed with status {response.status_code}")

                except Exception as e:
                    failed_requests += 1
                    print(f"  Request {i+1} failed with error: {e}")

                # Small delay between requests
                await asyncio.sleep(0.1)

        if response_times:
            avg_response_time = statistics.mean(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
            median_response_time = statistics.median(response_times)

            self.results[f"{method} {endpoint}"] = {
                "requests": requests,
                "successful": successful_requests,
                "failed": failed_requests,
                "success_rate": (successful_requests / requests) * 100,
                "avg_response_time": round(avg_response_time, 2),
                "min_response_time": round(min_response_time, 2),
                "max_response_time": round(max_response_time, 2),
                "median_response_time": round(median_response_time, 2)
            }

            print(f"  ✅ Success Rate: {successful_requests}/{requests} ({(successful_requests/requests)*100:.1f}%)")
            print(f"  ⏱️ Response Times: avg={avg_response_time:.1f}ms, min={min_response_time:.1f}ms, max={max_response_time:.1f}ms")
        else:
            print(f"  ❌ All requests failed")

        print()

    async def run_performance_tests(self):
        """Run performance tests on key endpoints"""
        print("🎯 STARTING API PERFORMANCE TESTS")
        print("=" * 50)

        # Test various endpoints
        endpoints_to_test = [
            ("/", "GET"),
            ("/properties", "GET"),
            ("/properties/1", "GET"),
            ("/bookings", "GET"),
            ("/reviews/property/1", "GET"),
            ("/reviews/property/1/stats", "GET"),
            ("/auth/users", "GET"),
        ]

        for endpoint, method in endpoints_to_test:
            await self.test_endpoint_performance(endpoint, method, requests=20)

        # Test POST endpoints with sample data
        await self.test_endpoint_performance(
            "/bookings/calculate-price",
            "POST",
            {
                "property_id": 1,
                "check_in": "2024-12-01T15:00:00Z",
                "check_out": "2024-12-04T11:00:00Z",
                "guests": 2
            },
            requests=10
        )

        self.generate_performance_report()

    def generate_performance_report(self):
        """Generate performance test report"""
        print("=" * 50)
        print("📊 PERFORMANCE TEST RESULTS")
        print("=" * 50)

        for endpoint, metrics in self.results.items():
            print(f"\n🔗 {endpoint}")
            print(f"   Success Rate: {metrics['success_rate']:.1f}%")
            print(f"   Avg Response: {metrics['avg_response_time']}ms")
            print(f"   Response Range: {metrics['min_response_time']}-{metrics['max_response_time']}ms")

        # Overall statistics
        if self.results:
            all_success_rates = [r['success_rate'] for r in self.results.values()]
            all_avg_times = [r['avg_response_time'] for r in self.results.values()]

            overall_success_rate = statistics.mean(all_success_rates)
            overall_avg_response = statistics.mean(all_avg_times)

            print(f"\n🎯 OVERALL PERFORMANCE")
            print(f"   Average Success Rate: {overall_success_rate:.1f}%")
            print(f"   Average Response Time: {overall_avg_response:.1f}ms")

            if overall_success_rate >= 95 and overall_avg_response <= 500:
                print("   🎉 Excellent performance!")
            elif overall_success_rate >= 90 and overall_avg_response <= 1000:
                print("   ✅ Good performance")
            elif overall_success_rate >= 80:
                print("   ⚠️ Acceptable performance with room for improvement")
            else:
                print("   ❌ Performance needs attention")

        print("=" * 50)

async def main():
    """Main performance test runner"""
    performance_test = APIPerformanceTest()
    await performance_test.run_performance_tests()

if __name__ == "__main__":
    asyncio.run(main())
