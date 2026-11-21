# Kestrel Stays — Phase 7 Learning & Code Guide
## Production Hardening, Multi-Stage Dockerization & Deployment Orchestration

Welcome to **Phase 7** — the final milestone of **Kestrel Stays**!

You built a full-stack sanctuary booking application with an asynchronous FastAPI backend, PostgreSQL database, Alembic migrations, deterministic pricing arithmetic, pessimistic concurrency locking, and a luxury Next.js 16 App Router frontend.

In this final phase, you will learn and implement **production-grade containerization and deployment orchestration**:
1. **Multi-Stage Dockerfiles** that produce minimal, secure container images.
2. **Docker Compose (`docker-compose.yml`)** to spin up the entire ecosystem (PostgreSQL, FastAPI, and Next.js) with a single command.
3. **Automated Database Healthchecks & Migrations** on container startup.
4. **Production Configuration & Security Best Practices**.

---

## 1. Architectural Concept: Multi-Stage Builds & Orchestration

In development, we run separate terminals for `npm run dev`, `uvicorn`, and a local PostgreSQL service. In production, we containerize each service so it runs identically on any cloud host (AWS ECS, DigitalOcean, Google Cloud Run, or a Linux VPS).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Docker Compose Network                          │
│                                                                        │
│  ┌───────────────────┐    HTTP:3000     ┌────────────────────────┐    │
│  │   Next.js (Web)   │─────────────────>│  FastAPI (API Server)  │    │
│  │ (Node Standalone) │                  │    (Uvicorn Workers)   │    │
│  └───────────────────┘                  └───────────┬────────────┘    │
│                                                     │                 │
│                                              asyncpg│Port 5432        │
│                                                     ▼                 │
│                                         ┌───────────────────────┐     │
│                                         │ PostgreSQL 16 (DB)    │     │
│                                         │ (Persistent Volumes)  │     │
│                                         └───────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

### Why Multi-Stage Builds Matter
A raw Node or Python build environment contains gigabytes of compiler tools, build caches, and package headers. A multi-stage build separates:
1. **The Builder stage**: Downloads dev dependencies, compiles TypeScript, and prepares production artifacts.
2. **The Runner stage**: Copies *only* the compiled static outputs and production binaries into a bare Alpine Linux image, dropping image sizes from ~1.5 GB down to ~120 MB!

---

## 2. Step 1: Backend Production Dockerfile

Create `backend/Dockerfile`.

### File: `backend/Dockerfile`

```dockerfile
# Stage 1: Build & dependency resolution
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Minimal Production Runtime
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/root/.local/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code and migrations
COPY . /app

EXPOSE 8000

# Healthcheck to ensure FastAPI is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch using uvicorn with multi-worker support
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

## 3. Step 2: Frontend Production Dockerfile

Next.js provides a `standalone` build output that extracts only the specific server files needed for production.

First, enable standalone output in `next.config.ts`:

```typescript
// Add output: "standalone" inside nextConfig
const nextConfig = {
  output: "standalone",
  // ... other existing config
};
```

Then create `Dockerfile.frontend` in the project root:

### File: `Dockerfile.frontend`

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build-time environment variables
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_USE_MOCK_API=false

RUN npm run build

# Stage 3: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root security user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 4. Step 3: Root `docker-compose.yml`

Create `docker-compose.yml` in the project root. This orchestrates PostgreSQL, runs migrations via Alembic on startup, and exposes both backend (port 8000) and frontend (port 3000).

### File: `docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    container_name: kestrel_postgres
    restart: always
    environment:
      POSTGRES_DB: Kestrel_Stays
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: production_secure_password
    ports:
      - "5432:5432"
    volumes:
      - kestrel_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d Kestrel_Stays"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kestrel_backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      PROJECT_NAME: "Kestrel Stays API"
      ENVIRONMENT: production
      DATABASE_URL: "postgresql+asyncpg://postgres:production_secure_password@db:5432/Kestrel_Stays"
      SECRET_KEY: "change_this_to_a_secure_random_64_char_key_in_production"
      BACKEND_CORS_ORIGINS: '["http://localhost:3000", "http://127.0.0.1:3000"]'
    ports:
      - "8000:8000"
    command: >
      sh -c "alembic upgrade head &&
             python -m scripts.seed &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: kestrel_frontend
    restart: always
    depends_on:
      - backend
    environment:
      PORT: 3000
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000/api/v1"
      NEXT_PUBLIC_USE_MOCK_API: "false"
    ports:
      - "3000:3000"

volumes:
  kestrel_pgdata:
    driver: local
```

---

## 5. Step 4: Production Run & Verification

To launch your entire full-stack application in containers:

```bash
# 1. Build and boot all containers
docker compose up --build

# 2. Check running container health
docker compose ps

# 3. View live backend logs and automated Alembic migration execution
docker compose logs -f backend
```

Once running:
- Frontend is live at [http://localhost:3000](http://localhost:3000).
- FastAPI Docs are live at [http://localhost:8000/docs](http://localhost:8000/docs).
- Health check is live at [http://localhost:8000/health](http://localhost:8000/health).

---

## Final Project Milestone Summary

With Phase 6 completed, you now have:
- **100% of pages built, styled, and responsive** across Public, Auth, Customer Account, and Admin Console.
- **Full-Stack Live Wiring** with FastAPI, PostgreSQL, and token persistence.
- **38 Backend Automated Tests** passing with 0 warnings.
- **7 Playwright E2E Tests** verifying real browser interaction.
- **Phase 7 Guide Ready** for you to master containerization and production deployment!
