import uuid
import pytest
import httpx


@pytest.mark.asyncio
async def test_admin_login_success(client: httpx.AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@kestrelstays.com", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"


@pytest.mark.asyncio
async def test_customer_login_success(client: httpx.AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "clara.oswald@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "customer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: httpx.AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@kestrelstays.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_and_get_me(client: httpx.AsyncClient):
    unique_email = f"guest_{uuid.uuid4().hex[:8]}@example.com"
    reg_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Test Guest",
        },
    )
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    token = reg_data["access_token"]
    assert reg_data["user"]["email"] == unique_email

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == unique_email
