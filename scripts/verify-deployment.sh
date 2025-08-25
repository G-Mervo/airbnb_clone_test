#!/bin/bash

# Deployment Verification Script
# This script tests the deployed applications

echo "🚀 Testing Airbnb Clone Deployment"
echo "=================================="

# Backend URLs
BACKEND_URL="https://airbnb-backend-one.vercel.app"
FRONTEND_URL="https://airbnb-frontend-omega.vercel.app"

echo ""
echo "🔧 Testing Backend..."

# Test health endpoint
echo "➤ Testing health endpoint..."
health_response=$(curl -s "$BACKEND_URL/health")
if [[ $health_response == *"healthy"* ]]; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed"
  echo "   Response: $health_response"
fi

# Test root endpoint
echo "➤ Testing root endpoint..."
root_response=$(curl -s "$BACKEND_URL/")
if [[ $root_response == *"Welcome"* ]]; then
  echo "   ✅ Root endpoint working"
else
  echo "   ❌ Root endpoint failed"
fi

# Test API endpoint
echo "➤ Testing API endpoint..."
api_response=$(curl -s "$BACKEND_URL/api/rooms")
if [[ $api_response == *"rooms"* ]]; then
  echo "   ✅ API endpoint working"
else
  echo "   ❌ API endpoint failed"
fi

# Test CORS
echo "➤ Testing CORS..."
cors_response=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -X OPTIONS "$BACKEND_URL/health")
if [[ $cors_response == "OK" ]]; then
  echo "   ✅ CORS working"
else
  echo "   ❌ CORS failed"
  echo "   Response: $cors_response"
fi

echo ""
echo "🌐 Testing Frontend..."

# Test frontend accessibility
echo "➤ Testing frontend accessibility..."
frontend_response=$(curl -s -I "$FRONTEND_URL" | head -n 1)
if [[ $frontend_response == *"200"* ]]; then
  echo "   ✅ Frontend accessible"
else
  echo "   ❌ Frontend not accessible"
  echo "   Response: $frontend_response"
fi

echo ""
echo "📋 Summary"
echo "=========="
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "API Docs:     $BACKEND_URL/docs"
echo ""
echo "🎉 Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL in your browser"
echo "2. Check API documentation at $BACKEND_URL/docs"
echo "3. Test the application features"
