import pytest
import httpx


@pytest.mark.asyncio
async def test_get_featured_hotels(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels/featured")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 4
    for hotel in data:
        assert hotel["featured"] is True


@pytest.mark.asyncio
async def test_get_hotel_detail_by_slug(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels/sora-machiya-retreat")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "sora-machiya-retreat"
    assert data["name"] == "Sora Machiya Retreat"
    assert "location" in data
    assert "policies" in data


@pytest.mark.asyncio
async def test_get_hotel_detail_not_found(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels/non-existent-hotel-slug")
    assert response.status_code == 404
    assert "not found" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_get_similar_hotels(client: httpx.AsyncClient):
    # First get an existing hotel ID
    detail_res = await client.get("/api/v1/hotels/sora-machiya-retreat")
    assert detail_res.status_code == 200
    hotel_id = detail_res.json()["id"]

    sim_res = await client.get(f"/api/v1/hotels/{hotel_id}/similar")
    assert sim_res.status_code == 200
    similar = sim_res.json()
    assert isinstance(similar, list)
    for h in similar:
        assert h["id"] != hotel_id
