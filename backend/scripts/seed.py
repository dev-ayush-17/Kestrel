import asyncio
from datetime import date, datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingStatusEvent
from app.models.destination import Destination
from app.models.favorite import Favorite
from app.models.hotel import Hotel
from app.models.review import Review
from app.models.room import RoomType
from app.models.user import User


async def seed():
    async with AsyncSessionLocal() as session:
        print("🌱 Seeding Kestrel Stays database...")

        # Check if users already seeded
        existing_admin = (
            await session.execute(
                select(User).where(User.email == "admin@kestrelstays.com")
            )
        ).scalar_one_or_none()

        if existing_admin:
            print("Database already contains seed data. Cleaning up tables for a fresh seed...")
            await session.execute(select(BookingStatusEvent))
            await session.commit()

        # Clean tables in proper FK order
        for model in [BookingStatusEvent, Booking, Review, Favorite, RoomType, Hotel, Destination, User]:
            records = (await session.execute(select(model))).scalars().all()
            for r in records:
                await session.delete(r)
        await session.commit()
        print("Cleared existing records. Populating fresh dataset...")

        # 1. Users
        admin_user = User(
            email="admin@kestrelstays.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Alexander Vance",
            role="admin",
            phone_number="+1 (415) 890-2100",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        )
        clara_user = User(
            email="clara.oswald@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Clara Oswald",
            role="customer",
            phone_number="+44 7700 900142",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        )
        julian_user = User(
            email="julian.sterling@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Julian Sterling",
            role="customer",
            phone_number="+1 (310) 555-0199",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        )
        session.add_all([admin_user, clara_user, julian_user])
        await session.flush()

        # 2. Hotels
        hotels_data = [
            {
                "slug": "sora-machiya-retreat",
                "name": "Sora Machiya Retreat",
                "tagline": "An 18th-century cedar machiya reimagined for meditative stillness.",
                "description": "Tucked inside an undisturbed flagstone alley in northern Higashiyama, Sora Machiya blends ancient sukiya-zukuri joinery with silent garden courtyards. Hand-chiseled hinoki cypress soaking tubs are filled with mountain spring water each evening, accompanied by curated tea ceremonies and seasonal kaiseki.",
                "property_type": "boutique",
                "star_rating": 5,
                "average_rating": 4.95,
                "review_count": 84,
                "featured": True,
                "min_price_cents": 38000,
                "currency": "USD",
                "location": {
                    "city": "Kyoto",
                    "country": "Japan",
                    "address": "14-2 Shirakawa Minami-dori, Higashiyama",
                    "postal_code": "605-0085",
                    "latitude": 35.0037,
                    "longitude": 135.7772,
                    "neighborhood_description": "Stroll three minutes to the weeping willows of Shirakawa canal and the secluded sub-temples of Nanzen-ji.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Full refund up to 48 hours before check-in date. Within 48 hours, first night is retained.",
                    "free_cancellation_hours": 48,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 16,
                },
                "amenities": [{"name": "Onsen"}, {"name": "Breakfast"}, {"name": "Wi-Fi"}, {"name": "Spa"}, {"name": "Air Conditioning"}],
                "images": [
                    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "higashiyama-zen-pavilion",
                "name": "Higashiyama Zen Pavilion",
                "tagline": "Tranquil stone courtyards overlooking bamboo hill slopes.",
                "description": "Designed by award-winning timber artisans, this intimate ten-suite sanctuary features floor-to-ceiling shoji screens framing private moss rockeries.",
                "property_type": "boutique",
                "star_rating": 5,
                "average_rating": 4.88,
                "review_count": 62,
                "featured": False,
                "min_price_cents": 42000,
                "currency": "USD",
                "location": {
                    "city": "Kyoto",
                    "country": "Japan",
                    "address": "28 Maruyama-cho, Higashiyama-ku",
                    "postal_code": "605-0071",
                    "latitude": 35.0022,
                    "longitude": 135.7824,
                    "neighborhood_description": "Direct access to Maruyama park trails and historic preservation tea houses.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Free cancellation until 72 hours before arrival.",
                    "free_cancellation_hours": 72,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 18,
                },
                "amenities": [{"name": "Onsen"}, {"name": "Breakfast"}, {"name": "Wi-Fi"}, {"name": "Terrace"}],
                "images": [
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "loch-kestrel-timber-lodge",
                "name": "Loch Kestrel Timber Lodge",
                "tagline": "Heavy Douglas fir beams, peat fires, and silent highland waters.",
                "description": "Perched upon the pine-fringed shore of Loch Ness, the lodge offers a haven from the highland elements. Unwind by hand-laid riverstone fireplaces.",
                "property_type": "lodge",
                "star_rating": 5,
                "average_rating": 4.92,
                "review_count": 112,
                "featured": True,
                "min_price_cents": 29000,
                "currency": "USD",
                "location": {
                    "city": "Scottish Highlands",
                    "country": "United Kingdom",
                    "address": "Drumnadrochit Shore Trail, Inverness-shire",
                    "postal_code": "IV63 6TX",
                    "latitude": 57.3341,
                    "longitude": -4.4789,
                    "neighborhood_description": "Surrounded by 140 acres of private Caledonian pine forest and heather hills.",
                },
                "policies": {
                    "check_in_time": "16:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Flexible cancellation up to 48 hours prior to check-in.",
                    "free_cancellation_hours": 48,
                    "pet_friendly": True,
                    "smoking_allowed": False,
                    "min_age_requirement": 0,
                },
                "amenities": [{"name": "Breakfast"}, {"name": "Fireplace"}, {"name": "Wi-Fi"}, {"name": "Kitchen"}],
                "images": [
                    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "glen-rowan-castle",
                "name": "Glen Rowan Castle Estate",
                "tagline": "Baronial stone architecture surrounded by heather-clad peaks.",
                "description": "An authentic 19th-century Scots Baronial estate restored with warm wool tweeds, hand-carved mahogany libraries, and estate-foraged gastronomy.",
                "property_type": "lodge",
                "star_rating": 5,
                "average_rating": 4.96,
                "review_count": 53,
                "featured": False,
                "min_price_cents": 51000,
                "currency": "USD",
                "location": {
                    "city": "Scottish Highlands",
                    "country": "United Kingdom",
                    "address": "Glen Affric Byroad, Beauly",
                    "postal_code": "IV4 7LY",
                    "latitude": 57.2954,
                    "longitude": -4.8211,
                    "neighborhood_description": "Located within the ancient Glen Affric National Nature Reserve.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "12:00",
                    "cancellation_policy_summary": "Full refund up to 7 days before check-in.",
                    "free_cancellation_hours": 168,
                    "pet_friendly": True,
                    "smoking_allowed": False,
                    "min_age_requirement": 12,
                },
                "amenities": [{"name": "Breakfast"}, {"name": "Fireplace"}, {"name": "Wi-Fi"}, {"name": "Spa"}],
                "images": [
                    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "pacific-redwood-cliff-inn",
                "name": "Pacific Redwood Cliff Inn",
                "tagline": "Architecture suspended between old-growth redwoods and sea spray.",
                "description": "Constructed entirely of salvaged cedar and local granite stone, Pacific Redwood sits 800 feet above the crashing surf of Big Sur.",
                "property_type": "boutique",
                "star_rating": 5,
                "average_rating": 4.97,
                "review_count": 146,
                "featured": True,
                "min_price_cents": 64000,
                "currency": "USD",
                "location": {
                    "city": "Big Sur",
                    "country": "United States",
                    "address": "Highway 1, Mile Marker 42.8",
                    "postal_code": "93920",
                    "latitude": 36.2341,
                    "longitude": -121.7821,
                    "neighborhood_description": "Direct private trail down to secluded coves and Julia Pfeiffer Burns State Park.",
                },
                "policies": {
                    "check_in_time": "16:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Free cancellation until 5 days prior to arrival.",
                    "free_cancellation_hours": 120,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 18,
                },
                "amenities": [{"name": "Breakfast"}, {"name": "Ocean View"}, {"name": "Spa"}, {"name": "Terrace"}],
                "images": [
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "villa-positano-solarium",
                "name": "Villa Positano Solarium",
                "tagline": "Cascading bougainvillea terraces overlooking the turquoise Tyrrhenian Sea.",
                "description": "Built into the sheer limestone cliffside of Positano, this converted lemon orchard villa features terracotta hand-painted majolica tiles.",
                "property_type": "beachfront",
                "star_rating": 5,
                "average_rating": 4.89,
                "review_count": 98,
                "featured": True,
                "min_price_cents": 56000,
                "currency": "USD",
                "location": {
                    "city": "Amalfi Coast",
                    "country": "Italy",
                    "address": "Via Cristoforo Colombo 88, Positano",
                    "postal_code": "84017",
                    "latitude": 40.6281,
                    "longitude": 14.485,
                    "neighborhood_description": "Ten minutes winding walk down steps to the Spiaggia Grande beach and marina.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Free cancellation up to 48 hours before check-in.",
                    "free_cancellation_hours": 48,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 16,
                },
                "amenities": [{"name": "Breakfast"}, {"name": "Ocean View"}, {"name": "Spa"}, {"name": "Terrace"}],
                "images": [
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "cliffside-ravello-suites",
                "name": "Cliffside Ravello Suites",
                "tagline": "Medieval serenity suspended 1,000 feet above the coast.",
                "description": "Perched high above the crowds in quiet Ravello, these historic cloister suites feature vaulted ceilings and private herb gardens.",
                "property_type": "boutique",
                "star_rating": 5,
                "average_rating": 4.93,
                "review_count": 47,
                "featured": False,
                "min_price_cents": 48000,
                "currency": "USD",
                "location": {
                    "city": "Amalfi Coast",
                    "country": "Italy",
                    "address": "Piazza Duomo 12, Ravello",
                    "postal_code": "84010",
                    "latitude": 40.6489,
                    "longitude": 14.6118,
                    "neighborhood_description": "Direct neighbor to Villa Rufolo and its famed cliffside orchestral gardens.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Free cancellation until 72 hours before arrival date.",
                    "free_cancellation_hours": 72,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 18,
                },
                "amenities": [{"name": "Breakfast"}, {"name": "Ocean View"}, {"name": "Terrace"}, {"name": "Wi-Fi"}],
                "images": [
                    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
            },
            {
                "slug": "oia-caldera-caves",
                "name": "Oia Caldera Caves",
                "tagline": "Volcanic cliffside caves sculpted with minimalist Aegean grace.",
                "description": "Carved deep into the volcanic pumice cliffs of Oia, each whitewashed cave suite provides an undisturbed sanctuary above the cobalt Aegean.",
                "property_type": "resort",
                "star_rating": 5,
                "average_rating": 4.96,
                "review_count": 121,
                "featured": True,
                "min_price_cents": 59000,
                "currency": "USD",
                "location": {
                    "city": "Santorini",
                    "country": "Greece",
                    "address": "Caldera Cliff Path, Oia",
                    "postal_code": "84702",
                    "latitude": 36.4618,
                    "longitude": 25.3753,
                    "neighborhood_description": "Quiet sunset quarter of Oia, away from the cruise ship excursion routes.",
                },
                "policies": {
                    "check_in_time": "15:00",
                    "check_out_time": "11:00",
                    "cancellation_policy_summary": "Full refund up to 7 days before arrival.",
                    "free_cancellation_hours": 168,
                    "pet_friendly": False,
                    "smoking_allowed": False,
                    "min_age_requirement": 18,
                },
                "amenities": [{"name": "Onsen"}, {"name": "Breakfast"}, {"name": "Ocean View"}, {"name": "Spa"}, {"name": "Terrace"}],
                "images": [
                    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&w=800&q=80",
                ],
                "hero_image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
            },
        ]

        hotel_map = {}
        for h_dict in hotels_data:
            hotel_obj = Hotel(**h_dict)
            session.add(hotel_obj)
            await session.flush()
            hotel_map[hotel_obj.slug] = hotel_obj

        # 3. Room Types
        rooms_data = [
            # Sora Machiya
            {
                "hotel_slug": "sora-machiya-retreat",
                "slug": "cedar-garden-suite",
                "name": "Cedar Garden Suite",
                "description": "Overlooks a private moss rockery with aromatic Japanese hinoki soaking tub.",
                "max_occupancy": 2,
                "bed_type": "tatami",
                "bed_count": 2,
                "size_sqm": 45,
                "base_nightly_rate_cents": 38000,
                "currency": "USD",
                "total_inventory": 4,
                "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"],
                "amenities": [{"name": "Hinoki Bath"}],
                "features": ["Private moss garden", "Hinoki cypress bath", "Tea ceremony table"],
            },
            {
                "hotel_slug": "sora-machiya-retreat",
                "slug": "bamboo-pavilion-loft",
                "name": "Bamboo Pavilion Loft",
                "description": "Second-floor sanctuary with exposed cedar rafters and hand-painted shoji screens.",
                "max_occupancy": 3,
                "bed_type": "king",
                "bed_count": 1,
                "size_sqm": 58,
                "base_nightly_rate_cents": 46000,
                "currency": "USD",
                "total_inventory": 3,
                "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"],
                "amenities": [{"name": "Balcony"}],
                "features": ["Exposed timber rafters", "Soaking tub", "Reading alcove"],
            },
            # Loch Kestrel
            {
                "hotel_slug": "loch-kestrel-timber-lodge",
                "slug": "hearthside-timber-room",
                "name": "Hearthside Timber Room",
                "description": "Cozy pine-paneled retreat with hand-laid riverstone fireplace and Harris tweed armchair.",
                "max_occupancy": 2,
                "bed_type": "king",
                "bed_count": 1,
                "size_sqm": 42,
                "base_nightly_rate_cents": 29000,
                "currency": "USD",
                "total_inventory": 5,
                "images": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"],
                "amenities": [{"name": "Wood Fireplace"}],
                "features": ["Riverstone fireplace", "Forest view", "Roll-top bath"],
            },
            # Pacific Redwood
            {
                "hotel_slug": "pacific-redwood-cliff-inn",
                "slug": "oceanfront-cliff-suite",
                "name": "Oceanfront Cliff Suite",
                "description": "Cantilevered glass suite with unobstructed Pacific ocean vistas and private cedar hot tub.",
                "max_occupancy": 2,
                "bed_type": "king",
                "bed_count": 1,
                "size_sqm": 62,
                "base_nightly_rate_cents": 64000,
                "currency": "USD",
                "total_inventory": 4,
                "images": ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"],
                "amenities": [{"name": "Cedar Hot Tub"}, {"name": "Ocean View"}],
                "features": ["Private cliff terrace", "Outdoor hot tub", "Binoculars for whale watching"],
            },
            # Oia Caldera Caves
            {
                "hotel_slug": "oia-caldera-caves",
                "slug": "caldera-infinity-cave-suite",
                "name": "Caldera Infinity Cave Suite",
                "description": "Whitewashed volcanic cave suite with private heated infinity plunge pool over the Aegean.",
                "max_occupancy": 2,
                "bed_type": "king",
                "bed_count": 1,
                "size_sqm": 68,
                "base_nightly_rate_cents": 59000,
                "currency": "USD",
                "total_inventory": 3,
                "images": ["https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&w=800&q=80"],
                "amenities": [{"name": "Private Plunge Pool"}, {"name": "Caldera Sunset View"}],
                "features": ["Heated infinity plunge pool", "Private sunset terrace", "Champagne breakfast included"],
            },
        ]

        room_map = {}
        for r_dict in rooms_data:
            h_slug = r_dict.pop("hotel_slug")
            h_obj = hotel_map[h_slug]
            room_obj = RoomType(hotel_id=h_obj.id, **r_dict)
            session.add(room_obj)
            await session.flush()
            room_map[room_obj.slug] = room_obj

        # 4. Bookings & Status History
        sora_hotel = hotel_map["sora-machiya-retreat"]
        cedar_room = room_map["cedar-garden-suite"]

        booking_1 = Booking(
            booking_reference="KS-892147",
            user_id=clara_user.id,
            hotel_id=sora_hotel.id,
            room_type_id=cedar_room.id,
            hotel_name=sora_hotel.name,
            hotel_slug=sora_hotel.slug,
            hotel_city="Kyoto",
            hotel_country="Japan",
            hotel_image=sora_hotel.hero_image,
            room_name=cedar_room.name,
            room_image=cedar_room.images[0],
            check_in_date=date(2026, 11, 15),
            check_out_date=date(2026, 11, 19),
            nights=4,
            adults=2,
            children=0,
            rooms_count=1,
            status="confirmed",
            price_breakdown={
                "nightly_rate_cents": 38000,
                "nights": 4,
                "subtotal_cents": 152000,
                "taxes_and_fees_cents": 21280,
                "cleaning_fee_cents": 4500,
                "discount_cents": 0,
                "total_cents": 177780,
                "currency": "USD",
            },
            guest_info={
                "full_name": "Clara Oswald",
                "email": "clara.oswald@example.com",
                "phone_number": "+44 7700 900142",
            },
            payment={
                "transaction_id": "tx_seed_1001",
                "status": "succeeded",
                "card_last4": "4242",
                "card_brand": "Visa",
                "amount_cents": 177780,
                "currency": "USD",
                "paid_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        session.add(booking_1)
        await session.flush()

        event_1 = BookingStatusEvent(
            booking_id=booking_1.id,
            status="confirmed",
            note="Initial reservation confirmed",
            created_by="System",
        )
        session.add(event_1)

        # 5. Reviews
        review_1 = Review(
            hotel_id=sora_hotel.id,
            booking_id=booking_1.id,
            user_id=clara_user.id,
            hotel_name=sora_hotel.name,
            user_name=clara_user.full_name,
            user_avatar=clara_user.avatar_url,
            overall_rating=5.0,
            title="The most peaceful stay of my life",
            content="Drinking ceremonial matcha in the morning looking out at the moss rockery will stay with me forever. The attention to detail from the staff was sublime.",
            stay_date="October 2026",
            room_name=cedar_room.name,
            categories={"cleanliness": 5.0, "location": 5.0, "service": 5.0, "comfort": 5.0, "value": 4.9},
            helpful_count=18,
            moderation_status="approved",
        )
        session.add(review_1)

        # 6. Favorites
        fav_1 = Favorite(user_id=clara_user.id, hotel_id=sora_hotel.id)
        session.add(fav_1)

        # 7. Destinations
        destinations_data = [
            {
                "slug": "kyoto",
                "name": "Kyoto",
                "country": "Japan",
                "tagline": "Ancient cedar machiyas and silent stone gardens.",
                "description": "Japan's imperial capital offers timeless wooden architecture, hidden bamboo paths, and geothermally fed onsen sanctuaries.",
                "hero_image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
                "hotel_count": 2,
                "best_season": "October – April",
                "coordinates": {"lat": 35.0116, "lng": 135.7681},
            },
            {
                "slug": "scottish-highlands",
                "name": "Scottish Highlands",
                "country": "United Kingdom",
                "tagline": "Heavy Douglas fir timbers, peat hearths, and glass lochs.",
                "description": "Dramatic heather-clad mountains and secluded pine forests, offering roll-top baths, single-malt cellars, and silent waters.",
                "hero_image": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
                "hotel_count": 2,
                "best_season": "May – September",
                "coordinates": {"lat": 57.3229, "lng": -4.4244},
            },
            {
                "slug": "big-sur",
                "name": "Big Sur",
                "country": "United States",
                "tagline": "Cantilevered cedar decks above crashing Pacific surf.",
                "description": "Suspended between coastal redwoods and dramatic sea cliffs along California's rugged Highway 1.",
                "hero_image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
                "hotel_count": 1,
                "best_season": "September – November",
                "coordinates": {"lat": 36.2704, "lng": -121.8081},
            },
            {
                "slug": "amalfi-coast",
                "name": "Amalfi Coast",
                "country": "Italy",
                "tagline": "Travertine terraces over the turquoise Tyrrhenian Sea.",
                "description": "Lemon orchard terraces, majolica tile villas, and cliffside hideaways nestled into sheer Mediterranean cliffs.",
                "hero_image": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
                "hotel_count": 2,
                "best_season": "April – October",
                "coordinates": {"lat": 40.6333, "lng": 14.6029},
            },
            {
                "slug": "santorini",
                "name": "Santorini",
                "country": "Greece",
                "tagline": "Volcanic cliffside caves sculpted with minimalist Aegean grace.",
                "description": "Whitewashed pumice stone cave suites, private plunge pools, and uninterrupted caldera sunset horizons.",
                "hero_image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
                "hotel_count": 1,
                "best_season": "May – October",
                "coordinates": {"lat": 36.3932, "lng": 25.4615},
            },
        ]
        for dest_dict in destinations_data:
            session.add(Destination(**dest_dict))

        await session.commit()
        print("✅ Seeding completed successfully with 8 hotels, destinations, rooms, bookings, reviews, and users!")


if __name__ == "__main__":
    asyncio.run(seed())
