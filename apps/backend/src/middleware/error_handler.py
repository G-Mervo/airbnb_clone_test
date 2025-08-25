"""
Middleware module for centralized error handling and response formatting
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import time
import traceback
from typing import Callable
from config.settings import settings

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("middleware")

class ErrorHandlerMiddleware:
    """
    Middleware for centralized error handling with structured responses
    and detailed logging
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_error_handling(message):
            if message["type"] == "http.response.start" and message["status"] >= 400:
                # Log the error response
                logger.error(f"Error response: {message['status']}")
            await send(message)

        try:
            await self.app(scope, receive, send_with_error_handling)
        except Exception as exc:
            # Log the exception
            logger.exception(f"Unhandled exception: {exc}")

            # Convert to HTTP response
            response = JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error",
                    "code": "internal_error",
                    "status": 500,
                    "request_id": scope.get("request_id", "unknown"),
                }
            )

            # Send the response
            await response(scope, receive, send)


async def request_handler(request: Request, call_next: Callable):
    """
    Middleware for request logging, timing, and error handling
    """
    # Generate a unique request ID
    request_id = str(time.time())
    request.state.request_id = request_id

    # Log the request
    logger.info(f"Request {request_id}: {request.method} {request.url.path}")

    # Time the request
    start_time = time.time()

    try:
        # Process the request
        response = await call_next(request)

        # Add custom headers
        response.headers["X-Request-ID"] = request_id
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        # Log the response
        logger.info(f"Response {request_id}: {response.status_code} (took {process_time:.4f}s)")

        return response

    except Exception as exc:
        # Log the exception
        logger.exception(f"Unhandled exception in request {request_id}: {exc}")
        traceback.print_exc()

        # Return error response
        error_content = {
            "detail": "Internal server error",
            "code": "internal_error",
            "status": 500,
            "request_id": request_id,
        }

        if settings.debug:
            error_content["exception"] = str(exc)
            error_content["traceback"] = traceback.format_exc()

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_content
        )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler for request validation errors with detailed information
    """
    # Log the validation error
    logger.warning(f"Validation error: {exc}")

    # Format the error details
    error_details = []
    for error in exc.errors():
        error_details.append({
            "location": error["loc"],
            "message": error["msg"],
            "type": error["type"]
        })

    # Return structured response
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "code": "validation_error",
            "status": 422,
            "errors": error_details,
            "request_id": getattr(request.state, "request_id", "unknown"),
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handler for HTTP exceptions with structured response
    """
    # Log the HTTP error
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")

    # Return structured response
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": f"http_{exc.status_code}",
            "status": exc.status_code,
            "request_id": getattr(request.state, "request_id", "unknown"),
        }
    )
