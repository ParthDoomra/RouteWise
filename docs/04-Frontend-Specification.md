# Frontend Specification
## RouteWise: Smart Fleet & Delivery Route Optimization System

**Version:** 1.0
**Stack:** React + Leaflet.js (react-leaflet), OpenStreetMap tiles

---

## 1. Application Structure

Three distinct interfaces, sharing a common component library but with role-specific routing:

```
/                       → Login (Manager/Driver)
/manager/*              → Manager dashboard (auth required, role=manager)
/driver/*               → Driver view (auth required, role=driver)
/track/:orderId         → Public customer tracking page (no auth)
```

---

## 2. Manager Interface (Primary — highest build priority)

### 2.1 Dashboard (Home) — `/manager/dashboard`
**Purpose:** At-a-glance operational overview.
**Components:**
- Summary cards: Active Deliveries, On-Time % (today), Vehicles Available, Open Maintenance Tickets
- Mini live map preview (click-through to full map)
- Recent notifications feed (last 5, flagged if AI-generated)

### 2.2 Live Map View — `/manager/map`
**Purpose:** Core demo screen — real-time fleet visibility.
**Components:**
- Full-screen Leaflet map, OpenStreetMap tiles
- Vehicle markers, color-coded by status (green = on time, yellow = delayed, gray = idle/maintenance)
- Route polylines shown for each active vehicle
- Click a vehicle marker → side panel with: driver name, current order, next stop, ETA
- Filter control: show/hide by vehicle status

### 2.3 Orders Page — `/manager/orders`
**Purpose:** Manage all delivery orders.
**Components:**
- Table: Order ID, Pickup, Drop, Status, Assigned Vehicle, Time Window
- Filter/search bar (status, date range)
- "Add Order" button → opens form modal
- Row click → order detail view (status history, notifications sent)

**Add Order Form fields:**
- Pickup address/coordinates (with map-click-to-select option)
- Drop address/coordinates
- Weight/size
- Time window (start/end)

### 2.4 Vehicles Page — `/manager/vehicles`
**Purpose:** Manage fleet.
**Components:**
- Table: Plate No, Capacity, Status, Current Mileage, Last Service Date
- "Add Vehicle" button → form modal
- Row click → vehicle detail (current route, maintenance history)

### 2.5 Route Detail Page — `/manager/routes/:vehicleId`
**Purpose:** Inspect a specific vehicle's optimized route.
**Components:**
- Map showing this vehicle's route only, with numbered stop markers in visit order
- Stop-by-stop list: sequence number, address, ETA, status
- Total distance / estimated total time summary
- "Re-optimize" button (manual trigger, useful for demo)

### 2.6 Maintenance Page — `/manager/maintenance`
**Purpose:** Track and resolve maintenance tickets.
**Components:**
- Table: Vehicle, Trigger Reason, Created Date, Status
- "Mark Resolved" action button per row

### 2.7 Analytics Page — `/manager/analytics`
**Purpose:** Performance reporting.
**Components:**
- Line/bar chart: On-time delivery % over time (Recharts)
- Bar chart: Average delivery time by zone/vehicle
- Card: Cost-per-delivery trend
- Card: Vehicle utilization rate

### 2.8 Notifications Log — `/manager/notifications`
**Purpose:** Audit trail, and a place to visibly showcase the AI feature.
**Components:**
- Table: Order ID, Message, Channel, AI-Generated (badge/tag), Sent At
- Filter: show only AI-generated messages (good for demo purposes)

---

## 3. Driver Interface (Secondary — simpler, mobile-friendly)

### 3.1 My Route — `/driver/route`
**Purpose:** Driver's single-focus screen for the day.
**Components:**
- Map showing only this driver's route
- Ordered stop list (card per stop: address, package details, ETA)
- "Mark Picked Up" / "Mark Delivered" buttons per stop
- Current stop highlighted/expanded, upcoming stops collapsed

**Design note:** Keep this view minimal — a driver is glancing at this while working, not analyzing data. Large touch targets, high contrast, essential info only.

---

## 4. Customer Interface (Public, no login)

### 4.1 Tracking Page — `/track/:orderId`
**Purpose:** Let a customer check their delivery status.
**Components:**
- Status stepper: Assigned → Picked Up → In Transit → Delivered (current stage highlighted)
- Estimated arrival time
- If delayed: prominent card showing the AI-generated explanation message
- Small map showing approximate current vehicle location (optional, simulated)

---

## 5. Shared Components

| Component | Used In | Notes |
|---|---|---|
| `<StatusBadge>` | Orders table, tracking page | Color-coded by status |
| `<MapView>` | Live map, route detail, tracking page | Wraps react-leaflet, accepts markers/polylines as props |
| `<DataTable>` | Orders, vehicles, maintenance pages | Reusable sortable/filterable table |
| `<SummaryCard>` | Dashboard, analytics | Metric + label + optional trend indicator |
| `<Modal>` | Add order, add vehicle forms | Reusable form modal wrapper |
| `<NotificationBadge>` | Notifications log | Flags AI-generated messages distinctly |

---

## 6. Visual Design Guidelines

- **Color coding for status** should be consistent everywhere: green (on-time/delivered), yellow/amber (delayed), blue (in transit), gray (idle/pending)
- **AI-generated content** should be visually marked (small badge/icon) wherever shown, so it's clear to both users and evaluators exactly where AI is used in the system
- Keep the manager dashboard information-dense but organized (cards + tables), the driver view sparse and large-touch-target, and the customer view simple and reassuring (status-forward, minimal clutter)

---

## 7. Build Priority (if time-constrained)

1. Live Map View + Orders + Vehicles pages (core demo)
2. Route Detail page (shows the algorithm's output clearly)
3. Analytics dashboard (shows completeness)
4. Notifications log with AI badge (shows the required AI feature explicitly)
5. Driver view
6. Customer tracking page
