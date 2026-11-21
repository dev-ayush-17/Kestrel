import pytest
import httpx


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


@pytest.mark.asyncio
async def test_admin_forbidden_for_customers(
    client: httpx.AsyncClient, customer_token: str
):
    res = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 403

