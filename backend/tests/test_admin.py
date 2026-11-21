import pytest
import httpx
import uuid


@pytest.mark.asyncio
async def test_admin_dashboard_metrics(client: httpx.AsyncClient, admin_token: str):
    res = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "revenue_chart" in data
    assert "occupancy_chart" in data
    assert "recent_bookings" in data
    assert data["metrics"]["total_revenue_cents"] >= 0


@pytest.mark.asyncio
async def test_admin_bookings_pagination(client: httpx.AsyncClient, admin_token: str):
    res = await client.get(
        "/api/v1/admin/bookings?page=1&page_size=5",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5


@pytest.mark.asyncio
async def test_admin_forbidden_for_customers(
    client: httpx.AsyncClient, customer_token: str
):
    res = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_admin_hotel_lifecycle(client: httpx.AsyncClient, admin_token: str):
    unique_slug = f"test-hotel-{uuid.uuid4().hex[:8]}"
    hotel_payload = {
        "slug": unique_slug,
        "name": "The Highland Retreat",
        "tagline": "Sanctuary amidst the mist",
        "description": "A secluded architectural retreat nestled in the hills.",
        "property_type": "Boutique Hotel",
        "star_rating": 5,
        "average_rating": 4.9,
        "review_count": 12,
        "featured": True,
        "min_price_cents": 35000,
        "currency": "USD",
        "location": {
            "city": "Inverness",
            "country": "United Kingdom",
            "address": "12 Glen Road",
            "postal_code": "IV1 1AA",
            "latitude": 57.4778,
            "longitude": -4.2247,
            "neighborhood_description": "Scenic Scottish Highlands",
        },
        "policies": {
            "check_in_time": "15:00",
            "check_out_time": "11:00",
            "cancellation_policy_summary": "Free cancellation up to 48 hours before check-in",
            "free_cancellation_hours": 48,
            "pet_friendly": True,
            "smoking_allowed": False,
            "min_age_requirement": 18,
        },
        "amenities": [{"name": "Spa", "icon": "spa"}, {"name": "Fireplace", "icon": "fireplace"}],
        "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
        "hero_image": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    }

    # 1. Create hotel
    res_create = await client.post(
        "/api/v1/admin/hotels",
        json=hotel_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_create.status_code == 201
    created = res_create.json()
    hotel_id = created["id"]
    assert created["slug"] == unique_slug

    # 2. Update hotel
    res_update = await client.patch(
        f"/api/v1/admin/hotels/{hotel_id}",
        json={"name": "The Highland Grand Retreat", "min_price_cents": 38000},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "The Highland Grand Retreat"
    assert res_update.json()["min_price_cents"] == 38000

    # 3. Create a room for this hotel
    room_payload = {
        "slug": f"deluxe-suite-{uuid.uuid4().hex[:6]}",
        "name": "Deluxe Mountain Suite",
        "description": "Panoramic mountain views with private balcony.",
        "max_occupancy": 2,
        "bed_type": "King",
        "bed_count": 1,
        "size_sqm": 48,
        "base_nightly_rate_cents": 42000,
        "currency": "USD",
        "total_inventory": 4,
        "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427"],
        "amenities": [{"name": "Balcony", "icon": "balcony"}],
        "features": ["Mountain View", "Soundproof"],
    }
    res_room = await client.post(
        f"/api/v1/admin/hotels/{hotel_id}/rooms",
        json=room_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_room.status_code == 201
    room_id = res_room.json()["id"]

    # 4. Update the room
    res_room_update = await client.patch(
        f"/api/v1/admin/rooms/{room_id}",
        json={"base_nightly_rate_cents": 45000, "total_inventory": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_room_update.status_code == 200
    assert res_room_update.json()["base_nightly_rate_cents"] == 45000

    # 5. Clean up - Delete the hotel
    res_delete = await client.delete(
        f"/api/v1/admin/hotels/{hotel_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_delete.status_code == 200
    assert res_delete.json()["success"] is True


@pytest.mark.asyncio
async def test_admin_user_governance(client: httpx.AsyncClient, admin_token: str):
    # 1. List users
    res_users = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_users.status_code == 200
    users = res_users.json()
    assert len(users) >= 2

    target_customer = next((u for u in users if u["role"] == "customer"), None)
    assert target_customer is not None
    user_id = target_customer["id"]

    # 2. Update user status (toggle is_active)
    res_status = await client.patch(
        f"/api/v1/admin/users/{user_id}/status",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_status.status_code == 200
    assert res_status.json()["is_active"] is True


@pytest.mark.asyncio
async def test_admin_booking_status_update(client: httpx.AsyncClient, admin_token: str):
    res_list = await client.get(
        "/api/v1/admin/bookings?page=1&page_size=1",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_list.status_code == 200
    bookings = res_list.json()["items"]
    if bookings:
        booking_id = bookings[0]["id"]
        res_patch = await client.patch(
            f"/api/v1/admin/bookings/{booking_id}/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "confirmed"


@pytest.mark.asyncio
async def test_admin_review_moderation(client: httpx.AsyncClient, admin_token: str):
    hotels_res = await client.get("/api/v1/hotels")
    assert hotels_res.status_code == 200
    hotels = hotels_res.json()["items"]
    if hotels:
        hotel_id = hotels[0]["id"]
        reviews_res = await client.get(f"/api/v1/hotels/{hotel_id}/reviews")
        assert reviews_res.status_code == 200
        reviews = reviews_res.json().get("reviews", [])
        if reviews:
            review_id = reviews[0]["id"]
            mod_res = await client.patch(
                f"/api/v1/admin/reviews/{review_id}/moderate",
                json={"status": "approved"},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert mod_res.status_code == 200
            assert mod_res.json()["moderation_status"] == "approved"
