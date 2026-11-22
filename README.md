# Kestrel Stays — Luxury Sanctuary & Boutique Hotel Booking Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat&logo=playwright)](https://playwright.dev/)

An architectural, production-grade full-stack hospitality reservation platform. **Kestrel Stays** connects intentional travelers directly with independent boutique hotels, historic mountain lodges, and coastal retreats.

Built with an asynchronous **FastAPI** backend, **PostgreSQL** database, **Alembic** migrations, deterministic integer-cent financial arithmetic, pessimistic row-level inventory serialization, and an editorial **Next.js 16 App Router** frontend.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │      Client Browser       │
                                  └─────────────┬─────────────┘
                                                │
                                       HTTP / JSON / Cookies
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Docker Network                                          │
│                                                                                           │
│   ┌────────────────────────┐      Proxy / REST       ┌───────────────────────────────┐    │
│   │   Next.js 16 Web App   │────────────────────────>│      FastAPI Core Engine      │    │
│   │   • App Router         │                         │   • Uvicorn Multi-Workers     │    │
│   │   • Turbopack          │                         │   • JWT & OAuth2 Bearer       │    │
│   │   • Standalone Runner  │                         │   • In-Memory TTL Cache       │    │
│   │   • Port 3000          │                         │   • Port 8000                 │    │
│   └────────────────────────┘                         └───────────────┬───────────────┘    │
│                                                                      │                    │
│                                                          SQLAlchemy  │ asyncpg Driver     │
│                                                          AsyncSession│ Port 5432          │
│                                                                      ▼                    │
│                                                      ┌───────────────────────────────┐    │
│                                                      │       PostgreSQL 16 DB        │    │
│                                                      │   • Row-Level Locking         │    │
│                                                      │   • Foreign Key Integrity     │    │
│                                                      │   • Persistent Named Volumes  │    │
│                                                      └───────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features

### 1. Catalog & Multi-Criteria Search Engine
- Search by destination, dates, guest counts, and star rating.
- Server-side date range intersection queries ensuring zero overbooking of unavailable rooms.
- High-performance in-memory TTL caching layer for destination queries.

### 2. High-Concurrency Booking Engine
- **Pessimistic Row-Level Locking (`with_for_update()`)**: Eliminates race conditions and double-booking during concurrent checkouts.
- **Deterministic Integer-Cent Pricing**: All rates, fees, and taxes computed in integer minor units (no floating-point rounding bugs).
- **Date Rescheduling**: Atomic date modifications with instant price recalculation.

### 3. Customer Portal
- Live reservation management with cancellation and date modification dialogs.
- Bookmarked favorites persisted in PostgreSQL.
- Profile settings and cryptographic password rotation.

### 4. Administrative Control Center
- Executive KPI dashboard computing real-time occupancy rate, Average Daily Rate (ADR), and total revenue.
- Visual monthly revenue and weekly occupancy pace charts.
- Hotel catalog CRUD and suite inventory management.
- User role governance (Customer $\leftrightarrow$ Admin) with 1-click account suspension.
- Review moderation queue updating hotel averages dynamically.

---

## 🚀 Quick Start

### Option A: Launch with Docker Compose (Recommended)

Run the entire ecosystem (PostgreSQL, FastAPI migrations & seeds, and Next.js) with a single command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Local Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Configure your DATABASE_URL in .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --port 8000 --reload
```

#### 2. Frontend Setup
```bash
# In project root:
npm install
npm run dev
```

---

## 🧪 Comprehensive Test Suite

### Backend Unit & Integration Tests (38/38 Passing)
Covers concurrency double-booking prevention, pricing math, hotel search, review recalculation, and admin governance.
```bash
# In backend/ (or with venv active):
pytest
```

### End-to-End Browser Tests with Playwright (7/7 Passing)
Automates full user flows across catalog browsing, hotel suite selection, guest checkout, and admin console.
```bash
npm run test:e2e
```

### Type Checking & Build Verification
```bash
npm run typecheck    # 0 TypeScript errors
npm run build        # Generates all 24 static and dynamic routes
```

---

## 🔐 Demo Credentials

| Role | Email | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@kestrelstays.com` | `admin123` | Alexander Vance |
| **Customer** | `clara.oswald@example.com` | `password123` | Clara Oswald |
| **Customer** | `julian.sterling@example.com` | `password123` | Julian Sterling |

---

## 🗺️ System Design & Evolution Roadmap

Kestrel Stays serves as an active living platform for advanced backend and distributed systems engineering:

- [ ] **Distributed Caching with Redis**: Transitioning from single-node memory caching to Redis Cluster for distributed rate-limiting and session caching.
- [ ] **Asynchronous Workers with Celery / RabbitMQ**: Offloading confirmation emails, invoice PDFs, and webhook dispatches to background worker queues.
- [ ] **Nginx Reverse Proxy & SSL Termination**: Reverse proxy with SSL stapling, rate limiting, and HTTP/2 multiplexing.
- [ ] **Read Replicas & Connection Pooling**: Separating read queries from transactional booking mutations using PgBouncer and PostgreSQL streaming replication.
- [ ] **Observability**: Prometheus metrics exporter and OpenTelemetry distributed tracing.

---

## 📄 License

MIT License. Crafted with intention for modern hospitality engineering.
