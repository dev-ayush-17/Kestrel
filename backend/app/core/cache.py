import asyncio
from datetime import datetime, timezone, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, Tuple


class SimpleMemoryCache:
    """
    Thread-safe in-memory cache with TTL expiration.
    """

    def __init__(self):
        self._cache: Dict[str, Tuple[Any, datetime]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            item = self._cache.get(key)
            if not item:
                return None
            value, expires_at = item
            if datetime.now(timezone.utc) > expires_at:
                del self._cache[key]
                return None
            return value

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        async with self._lock:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            self._cache[key] = (value, expires_at)

    async def clear_pattern(self, pattern: str) -> None:
        async with self._lock:
            keys_to_delete = [k for k in self._cache if pattern in k]
            for k in keys_to_delete:
                del self._cache[k]


cache = SimpleMemoryCache()


def cached_endpoint(ttl_seconds: int = 300):
    """
    Decorator to cache endpoint results based on request path and parameters.
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate deterministic cache key ignoring DB session
            key_parts = [func.__name__]
            for k, v in sorted(kwargs.items()):
                if k != "db":
                    key_parts.append(f"{k}={v}")
            cache_key = ".".join(key_parts)

            cached_data = await cache.get(cache_key)
            if cached_data is not None:
                return cached_data

            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds=ttl_seconds)
            return result

        return wrapper

    return decorator
