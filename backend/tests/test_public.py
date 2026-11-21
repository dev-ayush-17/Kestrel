import pytest
import httpx


@pytest.mark.asyncio
async def test_submit_contact_inquiry_success(client: httpx.AsyncClient):
    payload = {
        "name": "Jane Eyre",
        "email": "jane.eyre@example.com",
        "subject": "Booking inquiry for Sora Machiya",
        "message": "We would like to ask if private tea ceremonies can be arranged on arrival.",
    }
    response = await client.post("/api/v1/contact", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "reference_id" in data
    assert data["reference_id"].startswith("INQ-")


@pytest.mark.asyncio
async def test_contact_inquiry_validation(client: httpx.AsyncClient):
    payload = {
        "name": "E",
        "email": "not-an-email",
        "subject": "Hi",
        "message": "Short",
    }
    response = await client.post("/api/v1/contact", json=payload)
    assert response.status_code == 422
