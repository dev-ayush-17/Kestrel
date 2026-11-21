import pytest
import pytest_asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.main import app

# Create a test engine with NullPool so connections aren't shared across different async test loops
test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def admin_token(client):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@kestrelstays.com", "password": "admin123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest_asyncio.fixture
async def customer_token(client):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "clara.oswald@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]
