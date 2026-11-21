import asyncio
import random
from datetime import date, timedelta
import pytest
import httpx


@pytest.mark.asyncio
async def test_modify_booking_dates_success(
    client: httpx.AsyncClient, customer_token: str
):
    # 1. Create a confirmed booking to modify
    hotels_res = await client.get("/api/v1/hotels")
    hotel = hotels_res.json()["items"][0]
    rooms_res = await client.get(f"/api/v1/hotels/{hotel['id']}/rooms")
    room = rooms_res.json()[0]

    initial_check_in = (date.today() + timedelta(days=100)).isoformat()
    initial_check_out = (date.today() + timedelta(days=103)).isoformat()

    create_res = await client.post(
        "/api/v1/bookings",
        json={
            "hotel_id": hotel["id"],
            "room_type_id": room["id"],
            "check_in_date": initial_check_in,
            "check_out_date": initial_check_out,
            "adults": 2,
            "children": 0,
            "rooms_count": 1,
            "guest_info": {
                "full_name": "Clara Oswald",
                "email": "clara.oswald@example.com",
                "phone_number": "+44 7700 900142",
            },
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["id"]

    # 2. Reschedule stay dates
    new_check_in = (date.today() + timedelta(days=120)).isoformat()
    new_check_out = (date.today() + timedelta(days=125)).isoformat()

    modify_res = await client.post(
        f"/api/v1/bookings/{booking_id}/modify-dates",
        json={
            "new_check_in_date": new_check_in,
            "new_check_out_date": new_check_out,
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert modify_res.status_code == 200
    updated_booking = modify_res.json()
    assert updated_booking["check_in_date"] == new_check_in
    assert updated_booking["check_out_date"] == new_check_out
    assert updated_booking["nights"] == 5
    assert updated_booking["price_breakdown"]["nights"] == 5


@pytest.mark.asyncio
async def test_modify_booking_invalid_dates(
    client: httpx.AsyncClient, customer_token: str
):
    my_bookings_res = await client.get(
        "/api/v1/bookings/my",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    booking_id = my_bookings_res.json()["items"][0]["id"]

    # Check-out before check-in must fail with 400
    res = await client.post(
        f"/api/v1/bookings/{booking_id}/modify-dates",
        json={
            "new_check_in_date": "2026-12-10",
            "new_check_out_date": "2026-12-05",
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_concurrent_double_booking_exhaustion(
    client: httpx.AsyncClient, customer_token: str
):
    """
    Stress-test simulating simultaneous requests attempting to book all remaining inventory.
    Row-level locking guarantees atomic reservation without overselling.
    """
    hotels_res = await client.get("/api/v1/hotels")
    hotel_id = hotels_res.json()["items"][0]["id"]

    rooms_res = await client.get(f"/api/v1/hotels/{hotel_id}/rooms")
    room = rooms_res.json()[0]
    room_id = room["id"]
    total_inventory = room["total_inventory"]

    # Use random future window so test runs are completely idempotent
    future_offset = random.randint(300, 900)
    check_in = (date.today() + timedelta(days=future_offset)).isoformat()
    check_out = (date.today() + timedelta(days=future_offset + 3)).isoformat()

    # Create payload demanding the entire inventory at once
    payload = {
        "hotel_id": hotel_id,
        "room_type_id": room_id,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": 2,
        "children": 0,
        "rooms_count": total_inventory,
        "guest_info": {
            "full_name": "Concurrency Test Guest",
            "email": "concurrency@example.com",
            "phone_number": "+1 555-0100",
        },
    }

    # Dispatch two simultaneous reservations for the entire inventory
    task1 = client.post(
        "/api/v1/bookings",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    task2 = client.post(
        "/api/v1/bookings",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )

    res1, res2 = await asyncio.gather(task1, task2)

    status_codes = sorted([res1.status_code, res2.status_code])
    # Exactly one request must succeed (201) and the second must be rejected (409 Conflict)
    assert status_codes == [201, 409], f"Expected [201, 409] but got {status_codes}"
