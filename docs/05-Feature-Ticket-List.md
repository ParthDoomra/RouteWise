# Feature Ticket List
## RouteWise: Smart Fleet & Delivery Route Optimization System

**Format:** Ticket ID | Title | Description | Priority | Est. Effort
**Priority:** P0 = Must-have for demo, P1 = Important, P2 = Nice-to-have

---

## Epic 1: Project Setup

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-001 | Backend project scaffold | Set up FastAPI project structure, virtual env, dependencies | P0 | S |
| RW-002 | Database setup | Install PostgreSQL, create database, connect via SQLAlchemy | P0 | S |
| RW-003 | Frontend project scaffold | Set up React (Vite) project, install react-leaflet | P0 | S |
| RW-004 | Frontend-backend connectivity check | Health check endpoint + frontend call to confirm stack works end-to-end | P0 | S |

## Epic 2: Database & Core Models

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-010 | Create database schema | Implement all tables per Technical Architecture Document | P0 | M |
| RW-011 | SQLAlchemy models | Define ORM models matching schema | P0 | M |
| RW-012 | Seed script | Script to populate sample vehicles/orders for testing | P1 | S |

## Epic 3: Order Management

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-020 | Create order API | POST /api/orders endpoint with validation | P0 | S |
| RW-021 | List/filter orders API | GET /api/orders with query filters | P0 | S |
| RW-022 | Order detail API | GET /api/orders/{id} with status history | P1 | S |
| RW-023 | Cancel order API | Allow cancellation before pickup | P2 | S |
| RW-024 | Orders page (frontend) | Table view with filters, add-order modal | P0 | M |

## Epic 4: Vehicle & Fleet Management

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-030 | Add vehicle API | POST /api/vehicles | P0 | S |
| RW-031 | List vehicles API | GET /api/vehicles with live status | P0 | S |
| RW-032 | Vehicles page (frontend) | Table + add-vehicle modal, detail view | P0 | M |

## Epic 5: Route Optimization Engine (Core Technical Deliverable)

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-040 | Haversine distance function | Implement and unit test distance calculation | P0 | S |
| RW-041 | Nearest Neighbor algorithm | Implement initial route construction | P0 | M |
| RW-042 | 2-opt improvement algorithm | Implement route improvement step | P0 | M |
| RW-043 | Route optimization API | POST /api/routes/optimize wiring the algorithm to real data | P0 | M |
| RW-044 | Algorithm unit tests | Test with sample coordinate sets, verify distance reduction | P0 | S |
| RW-045 | Multi-vehicle assignment support | Extend to handle assigning stops across multiple vehicles | P1 | L |
| RW-046 | Route detail page (frontend) | Map + stop list showing optimized route | P0 | M |

## Epic 6: Assignment Engine

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-050 | Auto-assignment logic | Rule-based order-to-vehicle matching by capacity/proximity | P0 | M |
| RW-051 | Manual reassignment API | Allow manager to override assignment | P2 | S |

## Epic 7: Live Tracking Simulation

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-060 | Vehicle movement simulator | Background task interpolating position along route | P0 | M |
| RW-061 | Status lifecycle logic | Auto-update status as stops are reached | P0 | M |
| RW-062 | Live map view (frontend) | Real-time vehicle markers + polylines | P0 | L |

## Epic 8: Maintenance Automation

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-070 | Mileage threshold check | Auto-generate maintenance ticket on threshold breach | P1 | S |
| RW-071 | Maintenance page (frontend) | Table + resolve action | P1 | S |

## Epic 9: Notifications & AI Integration (Required 20% AI Component)

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-080 | Standard notification sender | Template-based SMS/email on status change | P0 | M |
| RW-081 | Delay flagging endpoint | POST /api/orders/{id}/delay with structured reason data | P0 | S |
| RW-082 | Claude API integration | Direct API call converting delay data → natural language message | P0 | M |
| RW-083 | AI fallback handling | Fallback to template message if AI call fails | P0 | S |
| RW-084 | Notifications log (frontend) | Table with AI-generated badge/filter | P0 | S |

## Epic 10: Analytics Dashboard

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-090 | Analytics aggregation API | On-time %, avg delivery time, cost/delivery, utilization | P1 | M |
| RW-091 | Analytics page (frontend) | Charts via Recharts | P1 | M |

## Epic 11: Role-Based Access & Auth

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-100 | Auth API (login/JWT) | Manager/driver login, JWT issuance | P0 | M |
| RW-101 | Role-based middleware | Restrict endpoints by role | P0 | S |
| RW-102 | Login page (frontend) | Simple auth form | P0 | S |
| RW-103 | Driver route view (frontend) | Restricted view, mark-delivered actions | P1 | M |
| RW-104 | Customer tracking page (frontend) | Public, UUID-based, no login | P1 | M |

## Epic 12: Polish, Testing, Documentation

| ID | Title | Description | Priority | Effort |
|---|---|---|---|---|
| RW-110 | Error handling pass | Graceful errors across all endpoints | P1 | M |
| RW-111 | End-to-end demo script | Scripted walkthrough: order → route → delay → AI message | P0 | S |
| RW-112 | Report writing | Compile PRD, architecture, algorithm explanation into report | P0 | L |
| RW-113 | Viva prep | Anticipated Q&A, algorithm walkthrough rehearsal | P0 | M |

---

## Suggested Build Order (Maps to Week-by-Week Plan)

1. **Weeks 1-2:** Epics 1, 2 (Setup + DB)
2. **Weeks 3-4:** Epic 5 (Route Optimization — your technical centerpiece)
3. **Weeks 5-6:** Epics 3, 4, 6 (Orders, Vehicles, Assignment)
4. **Week 7:** Epic 7 (Live tracking + map — core demo screen)
5. **Week 8:** Epics 8, 9 (Maintenance + Notifications/AI)
6. **Week 9:** Epic 9 continued (AI integration finalized)
7. **Week 10:** Epic 10 (Analytics)
8. **Week 11:** Epic 11 (Auth + role views)
9. **Weeks 12-14:** Epic 12 (Polish, testing, report, viva prep)

**Effort key:** S = Small (few hours–1 day), M = Medium (1–3 days), L = Large (3+ days)
