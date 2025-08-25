"""
Rate limiting middleware for FastAPI
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Dict, Tuple, Optional, Callable
import logging
from config.settings import settings

logger = logging.getLogger("middleware")

# Simple in-memory rate limiter using token bucket algorithm
# In production, use Redis for distributed rate limiting
class InMemoryRateLimiter:
    """Simple in-memory rate limiter using token bucket algorithm"""

    def __init__(self, rate_limit: int = 60, burst_limit: int = 100):
        """
        Initialize rate limiter

        Args:
            rate_limit: Number of requests allowed per minute
            burst_limit: Maximum burst size
        """
        self.rate_limit = rate_limit
        self.burst_limit = burst_limit
        self.tokens: Dict[str, Tuple[float, float]] = {}  # {key: (tokens, last_refill)}
        self.lock = asyncio.Lock()

        # Use settings if available
        if hasattr(settings, 'rate_limit_per_minute'):
            self.rate_limit = settings.rate_limit_per_minute
        if hasattr(settings, 'rate_limit_burst'):
            self.burst_limit = settings.rate_limit_burst

    async def get_tokens(self, key: str) -> Tuple[float, bool]:
        """
        Get number of tokens available for a key

        Args:
            key: Rate limiting key (e.g., IP address or user ID)

        Returns:
            Tuple of (tokens_left, is_allowed)
        """
        async with self.lock:
            now = time.time()
            tokens, last_refill = self.tokens.get(key, (self.burst_limit, now))

            # Calculate token refill
            time_passed = now - last_refill
            refill_amount = time_passed * (self.rate_limit / 60.0)
            tokens = min(self.burst_limit, tokens + refill_amount)

            # Check if request is allowed
            is_allowed = tokens >= 1.0

            # Consume token if allowed
            if is_allowed:
                tokens -= 1.0

            # Update state
            self.tokens[key] = (tokens, now)

            # Cleanup expired entries (every 100 requests)
            if len(self.tokens) > 100 and now % 100 < 1:
                self._cleanup(now)

            return (tokens, is_allowed)

    def _cleanup(self, now: float) -> None:
        """Remove expired entries (not accessed in the last hour)"""
        expiry_time = now - 3600  # 1 hour
        for key, (_, last_refill) in list(self.tokens.items()):
            if last_refill < expiry_time:
                del self.tokens[key]


# Initialize rate limiter
rate_limiter = InMemoryRateLimiter()


async def rate_limit_middleware(request: Request, call_next: Callable):
    """
    Middleware for rate limiting requests

    Args:
        request: FastAPI request object
        call_next: Next middleware in chain

    Returns:
        Response with rate limit headers
    """
    # Get client identifier (IP address or user ID if authenticated)
    client_ip = request.client.host if request.client else "unknown"

    # Get user ID if authenticated - safely check without raising error
    user_id = None
    try:
        if hasattr(request, "state") and hasattr(request.state, "user") and request.state.user:
            user_id = getattr(request.state.user, "id", None)
    except Exception:
        # If any error occurs, just use IP-based rate limiting
        pass

    # Use user_id if available, otherwise use IP
    rate_limit_key = f"user:{user_id}" if user_id else f"ip:{client_ip}"

    # Check rate limit
    tokens_left, is_allowed = await rate_limiter.get_tokens(rate_limit_key)

    # Add rate limit headers to all responses
    response = None

    if is_allowed:
        # Process the request normally
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(rate_limiter.burst_limit)
        response.headers["X-RateLimit-Remaining"] = str(int(tokens_left))
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + (60 * (1 - tokens_left) / rate_limiter.rate_limit)))

        return response
    else:
        # Return rate limit exceeded response
        logger.warning(f"Rate limit exceeded for {rate_limit_key}")

        # Calculate reset time
        reset_time = int(time.time() + (60 * (1 - tokens_left) / rate_limiter.rate_limit))

        # Create response with rate limit headers
        response = JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded",
                "code": "rate_limit_exceeded",
                "status": 429,
                "request_id": getattr(request.state, "request_id", "unknown"),
            }
        )

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(rate_limiter.burst_limit)
        response.headers["X-RateLimit-Remaining"] = "0"
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        response.headers["Retry-After"] = str(max(1, int(reset_time - time.time())))

        return response
