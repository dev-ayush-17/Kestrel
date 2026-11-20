import asyncio
from datetime import date, timedelta
import httpx
from app.main import app


async def test_api():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Hotels
        res = await client.get("/api/v1/hotels")
        assert res.status_code == 200, f"Hotels failed: {res.text}"
        hotels_data = res.json()
        print(f"✅ GET /api/v1/hotels: {len(hotels_data['items'])} hotels returned")

        # 2. Login as Admin
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@kestrelstays.com", "password": "admin123"},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        admin_token = login_res.json()["access_token"]
        print("✅ POST /api/v1/auth/login: admin token received")

        # 3. Admin dashboard
        dash_res = await client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert dash_res.status_code == 200, f"Admin dashboard failed: {dash_res.text}"
        print(f"✅ GET /api/v1/admin/dashboard: {dash_res.json()['metrics']}")

        # 4. Hotel Detail
        hotel_slug = "sora-machiya-retreat"
        hotel_res = await client.get(f"/api/v1/hotels/{hotel_slug}")
        assert hotel_res.status_code == 200, f"Hotel detail failed: {hotel_res.text}"
        hotel_id = hotel_res.json()["id"]
        print(f"✅ GET /api/v1/hotels/{hotel_slug}: ok (id: {hotel_id})")

        # 5. Rooms
        rooms_res = await client.get(f"/api/v1/hotels/{hotel_id}/rooms")
        assert rooms_res.status_code == 200, f"Rooms failed: {rooms_res.text}"
        rooms = rooms_res.json()
        print(f"✅ GET /api/v1/hotels/{hotel_id}/rooms: {len(rooms)} rooms returned")
        room_id = rooms[0]["id"]

        # 6. Reviews for Hotel
        reviews_res = await client.get(f"/api/v1/hotels/{hotel_id}/reviews")
        assert reviews_res.status_code == 200, f"Reviews failed: {reviews_res.text}"
        print(f"✅ GET /api/v1/hotels/{hotel_id}/reviews: {len(reviews_res.json()['reviews'])} reviews returned")

        # 7. Customer Login & Authenticated Endpoints
        cust_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "clara.oswald@example.com", "password": "password123"},
        )
        assert cust_res.status_code == 200
        cust_token = cust_res.json()["access_token"]

        # Favorites
        fav_res = await client.get(
            "/api/v1/favorites",
            headers={"Authorization": f"Bearer {cust_token}"},
        )
        assert fav_res.status_code == 200, f"Favorites failed: {fav_res.text}"
        print(f"✅ GET /api/v1/favorites: {len(fav_res.json())} favorites found for customer")

        # My Bookings
        my_bookings_res = await client.get(
            "/api/v1/bookings/my",
            headers={"Authorization": f"Bearer {cust_token}"},
        )
        assert my_bookings_res.status_code == 200, f"My bookings failed: {my_bookings_res.text}"
        print(f"✅ GET /api/v1/bookings/my: {len(my_bookings_res.json())} bookings found for customer")

        # My Reviews
        my_rev_res = await client.get(
            "/api/v1/reviews/my",
            headers={"Authorization": f"Bearer {cust_token}"},
        )
        assert my_rev_res.status_code == 200, f"My reviews failed: {my_rev_res.text}"
        print(f"✅ GET /api/v1/reviews/my: {len(my_rev_res.json())} customer reviews found")

        # Availability
        check_in = (date.today() + timedelta(days=30)).isoformat()
        check_out = (date.today() + timedelta(days=33)).isoformat()
        avail_res = await client.get(
            f"/api/v1/availability?hotel_id={hotel_id}&check_in={check_in}&check_out={check_out}&guests=2"
        )
        assert avail_res.status_code == 200, f"Availability check failed: {avail_res.text}"
        print(f"✅ GET /api/v1/availability: {len(avail_res.json())} available room types evaluated")

    print("\n🎉 ALL 8 CORE REST API SERVICE DOMAINS VERIFIED SUCCESSFULLY AGAINST POSTGRESQL!")


if __name__ == "__main__":
    asyncio.run(test_api())
