from datetime import date, timedelta
import pytest
import httpx


@pytest.mark.asyncio
async def test_get_my_bookings(client: httpx.AsyncClient, customer_token: str):
    response = await client.get(
        "/api/v1/bookings/my",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    booking = data["items"][0]
    assert "booking_reference" in booking
    assert "status" in booking
    assert "price_breakdown" in booking


@pytest.mark.asyncio
async def test_create_and_cancel_booking(
    client: httpx.AsyncClient, customer_token: str
):
    # Get hotel and rooms
    hotels_res = await client.get("/api/v1/hotels")
    hotel = hotels_res.json()["items"][0]
    hotel_id = hotel["id"]

    rooms_res = await client.get(f"/api/v1/hotels/{hotel_id}/rooms")
    room = rooms_res.json()[0]
    room_id = room["id"]

    check_in = (date.today() + timedelta(days=60)).isoformat()
    check_out = (date.today() + timedelta(days=63)).isoformat()

    booking_payload = {
        "hotel_id": hotel_id,
        "room_type_id": room_id,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": 2,
        "children": 0,
        "rooms_count": 1,
        "guest_info": {
            "full_name": "Clara Oswald",
            "email": "clara.oswald@example.com",
            "phone_number": "+44 7700 900142",
            "special_requests": "Quiet room on higher floor please",
        },
    }

    create_res = await client.post(
        "/api/v1/bookings",
        json=booking_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert create_res.status_code in (200, 201)
    booking_data = create_res.json()
    booking_id = booking_data["id"]
    assert booking_data["status"] == "confirmed"
    assert booking_data["nights"] == 3

    # Cancel booking
    cancel_res = await client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        json={"reason": "Change of travel plans"},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"
