from datetime import date, timedelta
import pytest
import httpx


@pytest.mark.asyncio
async def test_search_hotels_pagination(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 2
    assert "total" in data
    assert "total_pages" in data


@pytest.mark.asyncio
async def test_search_hotels_destination_filter(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels?destination=Kyoto")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    for hotel in data["items"]:
        assert "Kyoto" in hotel["location"]["city"] or "Kyoto" in hotel["name"]


@pytest.mark.asyncio
async def test_search_hotels_property_type_filter(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels?property_types=boutique")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    for hotel in data["items"]:
        assert hotel["property_type"] == "boutique"


@pytest.mark.asyncio
async def test_search_hotels_price_range(client: httpx.AsyncClient):
    response = await client.get("/api/v1/hotels?min_price_cents=30000&max_price_cents=60000")
    assert response.status_code == 200
    data = response.json()
    for hotel in data["items"]:
        assert 30000 <= hotel["min_price_cents"] <= 60000


@pytest.mark.asyncio
async def test_search_hotels_sorting(client: httpx.AsyncClient):
    res_asc = await client.get("/api/v1/hotels?sort_by=price_asc")
    assert res_asc.status_code == 200
    prices_asc = [h["min_price_cents"] for h in res_asc.json()["items"]]
    assert prices_asc == sorted(prices_asc)

    res_desc = await client.get("/api/v1/hotels?sort_by=price_desc")
    assert res_desc.status_code == 200
    prices_desc = [h["min_price_cents"] for h in res_desc.json()["items"]]
    assert prices_desc == sorted(prices_desc, reverse=True)


@pytest.mark.asyncio
async def test_search_hotels_date_availability(client: httpx.AsyncClient):
    check_in = (date.today() + timedelta(days=40)).isoformat()
    check_out = (date.today() + timedelta(days=44)).isoformat()
    response = await client.get(
        f"/api/v1/hotels?check_in={check_in}&check_out={check_out}&guests=2&rooms=1"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
