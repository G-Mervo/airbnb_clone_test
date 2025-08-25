from fastapi import APIRouter, FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

import sys
from pathlib import Path

# Add the src directory to the Python path
src_path = Path(__file__).parent.parent
sys.path.insert(0, str(src_path))

# Import settings and routes
from config.settings import settings
from api.routes import houses, rooms, bookings, auth, users, reviews, wishlists, messages, notifications, payments

# Configure logging
logger = logging.getLogger("api")

main_router = APIRouter()


@main_router.get("/")
@main_router.head("/")
async def root():
    return {
        "message": "Welcome to Airbnb Clone API!",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "environment": settings.environment
    }


@main_router.get("/health")
@main_router.head("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "airbnb-clone-api",
        "version": settings.app_version,
        "environment": settings.environment
    }


def create_app():
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="A comprehensive Airbnb clone API with full functionality",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=settings.debug
    )

    # Log CORS configuration for debugging
    logger.info(f"CORS allowed origins: {settings.allowed_origins}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")

    # Add CORS middleware using settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        allow_headers=["*"],
    )

    # Include main router
    app.include_router(main_router)

    # Include API routes
    app.include_router(houses.router, prefix="/api")  # Houses API - Physical properties
    app.include_router(rooms.router, prefix="/api")  # Rooms API - Bookable units
    app.include_router(bookings.router, prefix="/api")  # Bookings API - Reservation management
    app.include_router(auth.router, prefix="/api")  # Authentication API - User login/register
    app.include_router(payments.router, prefix="/api")  # Payments API - Payment processing
    app.include_router(reviews.router, prefix="/api")  # Reviews API - Property reviews
    app.include_router(wishlists.router, prefix="/api")  # Wishlists API - User favorites
    app.include_router(messages.router, prefix="/api")  # Messages API - User communication
    app.include_router(notifications.router, prefix="/api")  # Notifications API - User alerts
    app.include_router(users.router, prefix="/api")  # Users API - User management

    return app
