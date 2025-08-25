"""
Caching module for FastAPI using Redis
"""
from functools import wraps
import json
import time
import hashlib
from typing import Callable, Any, Optional, Union, Dict
import redis
import logging
from ..config.settings import settings

# Configure logging
logger = logging.getLogger("cache")

# Initialize Redis client
try:
    redis_client = redis.from_url(settings.redis_url)
    # Test connection
    redis_client.ping()
    REDIS_AVAILABLE = True
    logger.info(f"Redis connected at {settings.redis_url}")
except (redis.ConnectionError, redis.exceptions.ConnectionError):
    REDIS_AVAILABLE = False
    redis_client = None
    logger.warning(f"Redis connection failed at {settings.redis_url}. Caching disabled.")


def generate_cache_key(func_name: str, args: tuple, kwargs: Dict[str, Any]) -> str:
    """
    Generate a unique cache key based on function name and arguments
    
    Args:
        func_name: Name of the function being cached
        args: Positional arguments to the function
        kwargs: Keyword arguments to the function
        
    Returns:
        A unique hash key for caching
    """
    # Convert args and kwargs to strings
    key_parts = [func_name]
    
    # Add args
    for arg in args:
        if hasattr(arg, "__dict__"):
            # For objects, use their __dict__
            key_parts.append(str(arg.__dict__))
        else:
            key_parts.append(str(arg))
    
    # Add kwargs
    for k in sorted(kwargs.keys()):
        v = kwargs[k]
        if hasattr(v, "__dict__"):
            key_parts.append(f"{k}:{str(v.__dict__)}")
        else:
            key_parts.append(f"{k}:{str(v)}")
    
    # Join and hash
    key_base = ":".join(key_parts)
    return f"cache:{hashlib.md5(key_base.encode()).hexdigest()}"


def cache(ttl: int = 60, prefix: Optional[str] = None, key_builder: Optional[Callable] = None):
    """
    Cache decorator for FastAPI route handlers and other functions
    
    Args:
        ttl: Time to live in seconds
        prefix: Optional prefix for cache key
        key_builder: Optional function to build cache key
        
    Returns:
        Decorated function with caching
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip caching if Redis is not available
            if not REDIS_AVAILABLE or not redis_client:
                return await func(*args, **kwargs)
            
            # Generate cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                func_name = f"{prefix}:{func.__name__}" if prefix else func.__name__
                cache_key = generate_cache_key(func_name, args, kwargs)
            
            # Try to get from cache
            cached_data = redis_client.get(cache_key)
            if cached_data:
                try:
                    logger.debug(f"Cache hit for {cache_key}")
                    return json.loads(cached_data)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to decode cached data for {cache_key}")
                    # Continue with function execution
            
            # Cache miss, execute function
            logger.debug(f"Cache miss for {cache_key}")
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Cache the result
            try:
                # Only cache if execution time is significant (>10ms)
                if execution_time > 0.01:
                    redis_client.setex(
                        cache_key,
                        ttl,
                        json.dumps(result)
                    )
                    logger.debug(f"Cached {cache_key} for {ttl}s (execution: {execution_time:.4f}s)")
            except (TypeError, json.JSONDecodeError) as e:
                logger.error(f"Failed to cache result for {cache_key}: {e}")
            
            return result
        
        return wrapper
    
    return decorator


def invalidate_cache(pattern: str = "*"):
    """
    Invalidate cache entries matching a pattern
    
    Args:
        pattern: Redis key pattern to match
        
    Returns:
        Number of keys deleted
    """
    if not REDIS_AVAILABLE or not redis_client:
        return 0
    
    try:
        # Add cache: prefix if not present
        if not pattern.startswith("cache:"):
            pattern = f"cache:{pattern}"
        
        # Find keys matching pattern
        keys = redis_client.keys(pattern)
        if not keys:
            return 0
        
        # Delete keys
        deleted = redis_client.delete(*keys)
        logger.info(f"Invalidated {deleted} cache entries matching '{pattern}'")
        return deleted
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
        return 0


def clear_all_cache():
    """
    Clear all cache entries
    
    Returns:
        Number of keys deleted
    """
    return invalidate_cache("cache:*")
