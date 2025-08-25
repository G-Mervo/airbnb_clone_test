"""
FastAPI app for Vercel deployment with your real API routes
"""
import sys
import os
from pathlib import Path
import json

# Add src directory to Python path for Vercel
current_dir = Path(__file__).parent
src_path = current_dir / "src"
sys.path.insert(0, str(src_path))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

import logging
from src.api.routes import houses, rooms, bookings, auth, users, reviews, wishlists, messages, notifications, payments
from fastapi import APIRouter

# Configure logging
logger = logging.getLogger("api")

main_router = APIRouter()


@main_router.get("/")
async def root():
    return {
        "message": "Welcome to Airbnb API!",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "environment": "production"
    }


@main_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "airbnb-clone-api",
        "version": "1.0.0"
    }


app = FastAPI(
    title="Airbnb Clone API",
    version="1.0.0",
    description="A comprehensive Airbnb clone API with full functionality",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include main router
app.include_router(main_router)

# Include API routes
app.include_router(houses.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(wishlists.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(users.router, prefix="/api")

# CORS configuration for production
allowed_origins = [
    "https://airbnb-clone-vu-frontend.vercel.app",
    "https://kaizen-airbnb.vercel.app",
    "https://airbnb-frontend-omega.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
)

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
