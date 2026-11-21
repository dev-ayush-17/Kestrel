import uuid
import pytest
import httpx


@pytest.mark.asyncio
async def test_get_my_profile(client: httpx.AsyncClient, customer_token: str):
    response = await client.get(
        "/api/v1/account/profile",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "clara.oswald@example.com"
    assert data["role"] == "customer"


@pytest.mark.asyncio
async def test_update_my_profile(client: httpx.AsyncClient, customer_token: str):
    updated_name = "Clara Oswald-Smith"
    updated_phone = "+44 7700 999999"

    response = await client.patch(
        "/api/v1/account/profile",
        json={"full_name": updated_name, "phone_number": updated_phone},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == updated_name
    assert data["phone_number"] == updated_phone

    # Revert back for other tests
    await client.patch(
        "/api/v1/account/profile",
        json={"full_name": "Clara Oswald", "phone_number": "+44 7700 900142"},
        headers={"Authorization": f"Bearer {customer_token}"},
    )


@pytest.mark.asyncio
async def test_change_password_and_login(client: httpx.AsyncClient):
    # Register a fresh dedicated user for password change testing
    user_email = f"pwd_user_{uuid.uuid4().hex[:8]}@example.com"
    old_password = "OldSecretPassword123!"
    new_password = "NewSecretPassword456!"

    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": user_email,
            "password": old_password,
            "full_name": "Password Test User",
        },
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]

    # 1. Reject change if old password is incorrect
    wrong_pwd_res = await client.post(
        "/api/v1/account/change-password",
        json={"old_password": "WrongPassword123!", "new_password": new_password},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert wrong_pwd_res.status_code == 400

    # 2. Reject change if new password equals old password
    same_pwd_res = await client.post(
        "/api/v1/account/change-password",
        json={"old_password": old_password, "new_password": old_password},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert same_pwd_res.status_code == 400

    # 3. Successful password change
    success_res = await client.post(
        "/api/v1/account/change-password",
        json={"old_password": old_password, "new_password": new_password},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert success_res.status_code == 200
    assert success_res.json()["success"] is True

    # 4. Old password must fail login
    failed_login = await client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": old_password},
    )
    assert failed_login.status_code == 401

    # 5. New password must succeed login
    success_login = await client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": new_password},
    )
    assert success_login.status_code == 200
    assert "access_token" in success_login.json()
