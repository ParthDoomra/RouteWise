# Technical Architecture Document
## RouteWise: Smart Fleet & Delivery Route Optimization System

**Version:** 1.0

---

## 1. Architecture Overview

RouteWise follows a three-tier architecture:

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                        │
│         React + Leaflet.js (Live Map)             │
│   Manager Dashboard | Driver View | Customer View  │
└───────────────────────┬─────────────────────────┘
                         │ REST API (HTTPS/JSON)
┌───────────────────────▼─────────────────────────┐
│                    BACKEND                         │
│                Python + FastAPI                    │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │ Route Engine │ │ Assignment   │ │ Notification││
│  │ (self-built) │ │ Engine       │ │ Engine      ││
│  └──────────────┘ └──────────────┘ └────────────┘│
│  ┌──────────────┐ ┌──────────────┐                │
│  │ Maintenance  │ │ Tracking     │                │
│  │ Scheduler    │ │ Simulator    │                │
│  └──────────────┘ └──────────────┘                │
└──────────┬──────────────────────────┬─────────────┘
           │                          │
┌──────────▼──────────┐    ┌──────────▼─────────────┐
│     PostgreSQL        │    │     Claude API          │
│  (orders, vehicles,   │    │  (delay message         │
│   routes, status,     │    │   generation only)      │
│   maintenance)        │    │                          │
└────────────────────────┘    └──────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React | Component-based, widely supported, good ecosystem for dashboards |
| Map rendering | Leaflet.js + react-leaflet | Free, open-source, no billing/API key required |
| Map tiles | OpenStreetMap | Free tile provider, no usage limits for student-scale traffic |
| Backend framework | Python + FastAPI | Fast to build REST APIs, automatic docs (Swagger), async support |
| Database | PostgreSQL | Relational integrity for orders/vehicles/routes, supports geospatial data via PostGIS if needed |
| Route optimization | Custom Python (no external library) | Nearest Neighbor + 2-opt, implemented manually for full explainability in viva |
| Distance calculation | Haversine formula (custom) | Standard great-circle distance formula for lat/lng coordinates |
| AI integration | Claude API (Anthropic) | Single, direct integration for one bounded task: delay message generation |
| Notifications | Twilio (SMS) / SMTP (email) | Free-tier friendly, simple integration |
| Authentication | JWT-based session auth | Simple, stateless, standard for a small system |

---

## 3. Module Breakdown

### 3.1 Route Optimization Engine
**Responsibility:** Given a vehicle's starting point and a list of assigned stops, compute the shortest practical route.

**Algorithm:**
1. Haversine distance function — computes real-world distance between two lat/lng points
2. Nearest Neighbor construction — builds an initial route by always visiting the nearest unvisited stop
3. 2-opt improvement — iteratively swaps segments of the route if doing so reduces total distance, repeating until no improvement is found

**Inputs:** vehicle start location, list of stop coordinates
**Outputs:** ordered list of stops, total route distance, estimated time

### 3.2 Assignment Engine
**Responsibility:** Match pending orders to available vehicles.

**Logic:** Rule-based — filters vehicles by remaining capacity, then assigns based on proximity to the vehicle's current location or existing route. Runs whenever a new order is created or on a scheduled interval.

### 3.3 Tracking Simulator
**Responsibility:** Simulate vehicle movement along its assigned route in the absence of real GPS hardware.

**Logic:** A background task interpolates a vehicle's position between its current stop and next stop over a defined time interval, updating the database and pushing status changes (e.g., "Picked Up" → "In Transit" → "Delivered") as each stop is reached.

### 3.4 Maintenance Scheduler
**Responsibility:** Monitor vehicle mileage and auto-generate maintenance tickets.

**Logic:** Rule-based threshold check (e.g., every 5,000 km since last service) run after each completed route; creates a `maintenance_tickets` record when triggered.

### 3.5 Notification Engine
**Responsibility:** Send automated updates to customers at each status change.

**Logic:**
- For standard status changes: template-based message
- For delayed status: calls the AI module to generate the message body, then sends via SMS/email

### 3.6 AI Module (the 20%)
**Responsibility:** Convert structured delay data into a natural-language customer message.

**Flow:**
1. Delay is detected/flagged (delay reason: traffic, weather, load issue — structured fields)
2. Backend constructs a prompt with this structured data
3. Single API call to Claude API
4. Response text is stored and passed to the Notification Engine
5. **Fallback:** if the API call fails or times out, system falls back to a standard template message (non-blocking design — AI failure never breaks the notification flow)

### 3.7 Analytics Engine
**Responsibility:** Aggregate data for the dashboard.

**Logic:** Scheduled/on-demand SQL aggregation queries computing on-time %, average delivery time, cost-per-delivery (estimated from route distance × fuel cost constant), and vehicle utilization.

---

## 4. Database Schema

```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate_no VARCHAR(20) UNIQUE NOT NULL,
    capacity_kg NUMERIC NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- available, on_route, maintenance
    current_lat NUMERIC,
    current_lng NUMERIC,
    mileage_km NUMERIC DEFAULT 0,
    last_service_date DATE
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id),
    shift_start TIME,
    shift_end TIME
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    pickup_lat NUMERIC NOT NULL,
    pickup_lng NUMERIC NOT NULL,
    drop_lat NUMERIC NOT NULL,
    drop_lng NUMERIC NOT NULL,
    weight_kg NUMERIC,
    time_window_start TIMESTAMP,
    time_window_end TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, picked_up, in_transit, delivered, delayed
    vehicle_id INTEGER REFERENCES vehicles(id),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_date DATE,
    total_distance_km NUMERIC,
    total_time_min NUMERIC
);

CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    order_id INTEGER REFERENCES orders(id),
    sequence_no INTEGER,
    eta TIMESTAMP,
    actual_arrival TIMESTAMP,
    delay_reason VARCHAR(255)
);

CREATE TABLE maintenance_tickets (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    trigger_type VARCHAR(50), -- mileage, manual
    created_at TIMESTAMP DEFAULT now(),
    status VARCHAR(20) DEFAULT 'open' -- open, resolved
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    message TEXT,
    channel VARCHAR(20), -- sms, email
    ai_generated BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) -- manager, driver
);
```

---

## 5. API Design (Key Endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/orders` | Create a new delivery order |
| GET | `/api/orders` | List orders (filterable) |
| GET | `/api/orders/{id}/track` | Public tracking endpoint (customer view) |
| POST | `/api/vehicles` | Add a vehicle |
| GET | `/api/vehicles` | List vehicles with live status |
| POST | `/api/routes/optimize` | Trigger route optimization for a vehicle's assigned orders |
| GET | `/api/routes/{vehicle_id}` | Get a vehicle's current route |
| POST | `/api/orders/{id}/delay` | Flag an order as delayed (triggers AI message generation) |
| GET | `/api/analytics/summary` | Dashboard summary metrics |
| GET | `/api/maintenance` | List maintenance tickets |
| POST | `/api/maintenance/{id}/resolve` | Mark maintenance ticket resolved |
| POST | `/api/auth/login` | Manager/driver login |

---

## 6. Data Flow: Delay Handling (Illustrating the AI Boundary)

1. Tracking Simulator detects a stop is running behind its ETA beyond a threshold
2. Order status set to `delayed`; delay reason captured (e.g., `traffic`, `weather`)
3. Backend calls `generate_delay_message(order_id, delay_reason, delay_minutes, zone)` → single Claude API call
4. Generated message stored in `notifications` table with `ai_generated = true`
5. Notification Engine sends the message via SMS/email
6. If the API call fails: Notification Engine falls back to a static template (e.g., "Your delivery is delayed by approximately X minutes due to {reason}.")

---

## 7. Deployment Considerations (Student Project Scope)

- Local development: FastAPI via Uvicorn, PostgreSQL local instance or free-tier hosted (Supabase/Neon)
- Frontend: local dev server (Vite/CRA), can be deployed to Vercel/Netlify free tier for demo purposes
- Backend: can be deployed to Render/Railway free tier for a live demo link
- No need for containerization/orchestration (Docker/Kubernetes) at this scope — optional stretch goal only

---

## 8. Design Principles

- **Separation of concerns:** routing, assignment, tracking, and AI integration are independent modules, individually testable
- **AI as a bounded dependency:** the system must remain fully functional (with degraded messaging) if the AI API is unavailable
- **Explainability first:** core optimization algorithm is self-written, not a third-party black box, to support full technical defense in viva
