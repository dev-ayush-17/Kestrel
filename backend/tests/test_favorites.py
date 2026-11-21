import pytest
import httpx


@pytest.mark.asyncio
async def test_favorites_workflow(client: httpx.AsyncClient, customer_token: str):
    # 1. List current favorites
    res = await client.get(
        "/api/v1/favorites",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 200
    initial_favs = res.json()
    assert isinstance(initial_favs, list)

    # 2. Add a new favorite
    hotels_res = await client.get("/api/v1/hotels")
    hotel = hotels_res.json()["items"][1]
    hotel_id = hotel["id"]

    add_res = await client.post(
        "/api/v1/favorites",
        json={"hotel_id": hotel_id},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert add_res.status_code in (200, 201)

    # 3. Remove favorite
    del_res = await client.delete(
        f"/api/v1/favorites/{hotel_id}",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
