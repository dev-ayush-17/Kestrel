# Kestrel Stays — Boutique & Independent Hotels

An editorial, multi-page hotel booking platform built with **Next.js (App Router)**, **TypeScript (strict mode)**, and **Tailwind CSS**.

Kestrel Stays is designed with clean architectural decoupling so that the entire frontend functions seamlessly offline via a typed mock layer and can be flipped to a production **FastAPI + PostgreSQL** backend with a single environment toggle.

---

## Architecture & Technology Stack

- **Framework**: Next.js (App Router) + React 19
- **Type Safety**: TypeScript strict mode, zero `any`, strictly typed API contracts
- **Styling**: Tailwind CSS with custom editorial design tokens:
  - Canvas: `#FAF7F2` (warm off-white)
  - Paper: `#FFFFFF`
  - Deep Pine: `#1F4D3A` (primary accent)
  - Terracotta: `#C2603A` (warm secondary)
  - Hairline borders: `#E6DFD3`
- **Typography**: Newsreader (editorial serif) paired with Geist (clean sans)
- **Forms & Validation**: React Hook Form + Zod
- **Data Layer**: TanStack Query (React Query) with optimistic updates and cache invalidation
- **State Management**: Zustand (client auth session and search state only)
- **Primitives**: Radix UI (dialog, dropdown, tabs, popover, toast) wrapped in `/components/ui`
- **Dates & Picker**: `date-fns` + `react-day-picker`
- **Icons**: `lucide-react`
- **Charts**: `recharts`

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Verify Code Quality & Type Safety
```bash
npm run typecheck   # Strict TypeScript checks
npm run lint        # ESLint analysis
npm run build       # Next.js production build & static prerendering
```

---

## Switching Between Mock API and Real FastAPI Backend

The application contains a unified API Gateway in `lib/api/index.ts`. All UI components interact solely through typed endpoint functions and query hooks.

To switch from Mock mode to your real FastAPI backend, edit `.env.local`:

```ini
# Change to false to connect to your live FastAPI backend
NEXT_PUBLIC_USE_MOCK_API=false

# Your FastAPI endpoint base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

When `NEXT_PUBLIC_USE_MOCK_API=true`:
- All requests are resolved through `lib/api/mock/*`.
- State is persisted to browser `localStorage` under `kestrel_mock_db_v1`.
- Realistic network latency (300ms–800ms) and room inventory constraints are simulated.

---

## Demo Credentials & Roles

| Role | Email | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@kestrelstays.com` | `admin123` | Alexander Vance |
| **Customer** | `clara.oswald@example.com` | `password123` | Clara Oswald |
| **Customer** | `julian.sterling@example.com` | `password123` | Julian Sterling |

*Note: In the Navbar, you can also use the **Role Simulator** pill toggle (`Guest` | `Customer` | `Admin`) to quickly switch roles in one click.*

---

## Project Structure

```
├── app/
│   ├── (public)/          # Public routes: Home, /search, /hotels/[slug], /destinations, static pages, /styleguide
│   ├── (auth)/            # Auth routes: /login, /register, /forgot-password, /reset-password
│   ├── (account)/         # Customer area: /account, /bookings, /favorites, /reviews, /profile
│   ├── (admin)/           # Admin console: /admin, /bookings, /hotels, /rooms, /users, /reviews
│   ├── layout.tsx         # Root layout with fonts, providers, and skip-to-content
│   └── globals.css        # Tailwind design tokens, typography, and component styling
├── components/
│   ├── ui/                # 21 custom design system components (Button, Dialog, Stepper, DateRangePicker, etc.)
│   ├── layout/            # Navbar, Footer, AccountSidebar, AdminSidebar
│   ├── features/          # Domain-specific feature modules
│   └── providers/         # TanStack Query & Toast providers
├── lib/
│   ├── api/
│   │   ├── client.ts      # Typed fetch wrapper with 401 retry & token refresh
│   │   ├── index.ts       # Unified API Gateway (switches Mock vs Real)
│   │   ├── endpoints/     # Real FastAPI client endpoints
│   │   └── mock/          # Mock endpoints with seed data & localStorage persistence
│   ├── hooks/             # TanStack Query hooks (useHotels, useBookings, useFavorites, etc.)
│   ├── stores/            # Zustand client stores (authStore)
│   ├── types/             # Domain TypeScript interfaces (snake_case API schemas)
│   └── utils.ts           # Currency formatting, date helpers, cn class merge
├── BACKEND_PHASE_2_GUIDE.md  # Complete architectural backend guide for FastAPI + PostgreSQL
└── README.md
```

---

## Component Styleguide

Visit [`/styleguide`](http://localhost:3000/styleguide) in your browser while the dev server is running to test and interact with all 21 UI components, color palettes, form inputs, date range pickers, guest counters, modals, toasts, and pagination.
