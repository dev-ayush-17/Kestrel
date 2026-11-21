import pytest
import httpx


@pytest.mark.asyncio
async def test_get_hotel_reviews(client: httpx.AsyncClient):
    hotels_res = await client.get("/api/v1/hotels")
    hotel_id = hotels_res.json()["items"][0]["id"]

    res = await client.get(f"/api/v1/hotels/{hotel_id}/reviews")
    assert res.status_code == 200
    data = res.json()
    assert "reviews" in data
    assert "summary" in data
    assert "average_rating" in data["summary"]
    assert "rating_distribution" in data["summary"]


@pytest.mark.asyncio
async def test_create_and_list_my_reviews(
    client: httpx.AsyncClient, customer_token: str
):
    hotels_res = await client.get("/api/v1/hotels")
    hotel_id = hotels_res.json()["items"][0]["id"]

    review_payload = {
        "hotel_id": hotel_id,
        "overall_rating": 4.8,
        "title": "A serene sanctuary",
        "content": "Loved the tranquility and authentic architecture. Would definitely recommend.",
        "categories": {
            "cleanliness": 5.0,
            "location": 5.0,
            "service": 4.8,
            "comfort": 4.8,
            "value": 4.6,
        },
    }

    create_res = await client.post(
        "/api/v1/reviews",
        json=review_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert create_res.status_code in (200, 201)
    assert create_res.json()["title"] == "A serene sanctuary"

    my_res = await client.get(
        "/api/v1/reviews/my",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert my_res.status_code == 200
    reviews = my_res.json()
    assert len(reviews) >= 1

