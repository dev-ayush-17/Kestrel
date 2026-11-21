import pytest
import httpx


@pytest.mark.asyncio
async def test_list_destinations(client: httpx.AsyncClient):
    response = await client.get("/api/v1/destinations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    for dest in data:
        assert "slug" in dest
        assert "name" in dest
        assert "hotel_count" in dest


@pytest.mark.asyncio
async def test_get_destination_by_slug(client: httpx.AsyncClient):
    response = await client.get("/api/v1/destinations/kyoto")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "kyoto"
    assert data["name"] == "Kyoto"
    assert data["country"] == "Japan"


@pytest.mark.asyncio
async def test_get_destination_not_found(client: httpx.AsyncClient):
    response = await client.get("/api/v1/destinations/non-existent-city")
    assert response.status_code == 404

