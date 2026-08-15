# Product Requirements Document (PRD)
## RouteWise: Smart Fleet & Delivery Route Optimization System

**Version:** 1.0
**Author:** Parth
**Type:** College Main Project (AI/ML Domain)
**Compliance requirement:** 80% Automation / 20% AI API usage

---

## 1. Overview

RouteWise is a fleet management and delivery route optimization system for delivery/logistics businesses. It automates the assignment of delivery orders to vehicles and computes efficient multi-stop routes using a self-implemented optimization algorithm. When deliveries are delayed, the system uses an AI API to generate natural-language, customer-facing explanations in place of generic template messages.

RouteWise models a scaled-down version of the Vehicle Routing Problem (VRP), a well-established real-world logistics problem solved in production by companies such as Amazon, FedEx, and food-delivery platforms.

---

## 2. Problem Statement

Delivery businesses that manually assign orders to vehicles and manually plan delivery sequences face:
- Increased fuel and time costs from inefficient routes
- Difficulty scaling operations as order volume grows
- Generic, impersonal delay communication that frustrates customers
- No centralized visibility into fleet status, vehicle health, or delivery performance

RouteWise addresses this by automating the planning and monitoring work, while reserving AI specifically for natural-language customer communication.

---

## 3. Goals & Objectives

| Goal | Description |
|---|---|
| G1 | Automatically compute efficient delivery routes for a fleet of vehicles |
| G2 | Automatically assign orders to vehicles based on capacity and proximity |
| G3 | Provide live visibility into vehicle location and delivery status |
| G4 | Automate vehicle maintenance scheduling based on mileage |
| G5 | Generate natural-language delay explanations using an AI API |
| G6 | Provide analytics on delivery performance and fleet efficiency |
| G7 | Support three distinct user roles: Manager, Delivery Partner, Customer |

---

## 4. Target Users

### 4.1 Fleet Manager / Dispatcher (Primary User)
Runs day-to-day delivery operations. Needs to view orders, assign/monitor vehicles, review optimized routes, track live delivery status, manage maintenance, and review performance analytics.

### 4.2 Delivery Partner / Driver (Secondary User)
Executes deliveries. Needs to see only their own assigned route for the day, in optimized stop order, and mark deliveries complete.

### 4.3 Customer (Secondary User)
Needs to track the live status of their own delivery and receive automated (including AI-generated, if delayed) notifications, without needing an account.

---

## 5. Scope

### 5.1 In Scope
- Order intake and management
- Rule-based order-to-vehicle assignment
- Self-implemented route optimization algorithm (Nearest Neighbor + 2-opt)
- Simulated live vehicle tracking on a map
- Status lifecycle management (Assigned → Picked Up → In Transit → Delivered / Delayed)
- Automated notifications (standard + AI-generated for delays)
- Mileage-based maintenance ticket automation
- Analytics dashboard
- Three role-based views: Manager, Delivery Partner, Customer

### 5.2 Out of Scope (for this project's timeline)
- Real GPS hardware integration (simulated instead)
- Payment processing
- Multi-tenant support (multiple companies using one deployment)
- Native mobile apps (web-responsive only)
- Real-time traffic API integration (delay data will be simulated/manually triggered for demo purposes)

---

## 6. Functional Requirements

### 6.1 Order Management
- FR1.1: System shall allow creation of a delivery order with pickup location, drop-off location, weight/size, and time window
- FR1.2: System shall list all orders with filter/search by status, date, zone
- FR1.3: System shall allow order cancellation before pickup

### 6.2 Vehicle & Fleet Management
- FR2.1: System shall allow adding a vehicle with capacity, type, and starting location
- FR2.2: System shall track vehicle status (Available, On Route, Under Maintenance)
- FR2.3: System shall track cumulative vehicle mileage

### 6.3 Assignment Engine
- FR3.1: System shall automatically assign pending orders to available vehicles based on capacity and proximity
- FR3.2: System shall allow manual reassignment by the manager if needed

### 6.4 Route Optimization Engine
- FR4.1: System shall compute an initial route using the Nearest Neighbor heuristic
- FR4.2: System shall improve the initial route using 2-opt optimization
- FR4.3: System shall use the Haversine formula to compute distances between coordinates
- FR4.4: System shall recompute a vehicle's route if a stop is added/removed mid-route

### 6.5 Live Tracking
- FR5.1: System shall simulate vehicle movement along its assigned route over time
- FR5.2: System shall update delivery status automatically as a vehicle reaches each stop
- FR5.3: System shall display all active vehicles on a live map

### 6.6 Maintenance Automation
- FR6.1: System shall automatically generate a maintenance ticket when a vehicle crosses a defined mileage threshold
- FR6.2: System shall allow the manager to mark maintenance tickets as resolved

### 6.7 Notifications
- FR7.1: System shall send an automated notification at each status change
- FR7.2: When a delivery is marked delayed, system shall call the AI API with structured delay data and send the generated message to the customer
- FR7.3: System shall log all sent notifications, including whether AI-generated

### 6.8 Analytics Dashboard
- FR8.1: System shall display on-time delivery percentage
- FR8.2: System shall display average delivery time
- FR8.3: System shall display cost-per-delivery (estimated from distance)
- FR8.4: System shall display vehicle utilization rate

### 6.9 Role-Based Access
- FR9.1: Manager shall have full access to all modules
- FR9.2: Delivery Partner shall see only their assigned route and status update controls
- FR9.3: Customer shall access only their own order's tracking view (no login required, order ID or link based)

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Route optimization for a single vehicle (≤30 stops) should complete in under 3 seconds |
| Usability | Manager dashboard should be understandable without training (self-explanatory labels/icons) |
| Reliability | AI API failures must not break the notification flow — system falls back to a standard template message |
| Cost | All third-party services used (maps, notifications) should have a free tier suitable for a student project |
| Maintainability | Code should be modular — optimization logic, assignment logic, and AI integration kept as separate, independently testable components |

---

## 8. The 80/20 Automation-to-AI Boundary

**80% Automation (deterministic, rule-based, algorithmic):**
- Route optimization (self-written Nearest Neighbor + 2-opt)
- Order-to-vehicle assignment
- Status lifecycle tracking
- Maintenance ticket generation
- Standard notifications
- Analytics computation

**20% AI (Claude API, single well-scoped use case):**
- Converting structured delay data (traffic level, weather flag, zone) into a natural-language, customer-facing delay explanation message

**Rationale:** Route optimization is a solved algorithmic/mathematical problem where a deterministic heuristic outperforms an AI model in speed, reliability, and cost. Natural language generation for customer communication is a task AI is inherently well-suited for, and where rule-based/template approaches produce poor user experience.

---

## 9. Success Criteria

- Functional end-to-end demo: order creation → optimized routing → live tracking → delayed delivery → AI-generated customer message
- Working manager dashboard with live map and analytics
- Delivery partner view showing an optimized route
- Customer tracking page reflecting live status
- Algorithm implemented and explainable line-by-line (no black-box library dependency for routing)
- Clear, defensible documentation of the AI usage boundary

---

## 10. Assumptions & Constraints

- Vehicle GPS movement will be simulated, not sourced from real hardware
- Traffic/weather delay triggers will be simulated or manually flagged for demo purposes, not sourced from live traffic APIs
- Single-city/single-region scope (no cross-region logistics)
- Single admin/manager role — no organizational hierarchy or multi-company support
