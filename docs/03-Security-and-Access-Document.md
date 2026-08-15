# Security & Access Document
## RouteWise: Smart Fleet & Delivery Route Optimization System

**Version:** 1.0

---

## 1. Purpose

This document defines the roles, access levels, authentication approach, and data protection practices for RouteWise. Scope is calibrated for a student/demo project while still reflecting real-world good practice.

---

## 2. User Roles & Access Levels

| Role | Access Level | Login Required |
|---|---|---|
| **Manager / Dispatcher** | Full access: all orders, vehicles, routes, analytics, maintenance, notifications log | Yes |
| **Delivery Partner (Driver)** | Restricted: only their own assigned route and status-update controls | Yes |
| **Customer** | Public, read-only: tracking view for their own order only | No (order ID / secure link based) |

### 2.1 Role Permission Matrix

| Action | Manager | Driver | Customer |
|---|:---:|:---:|:---:|
| Create/edit orders | ✅ | ❌ | ❌ |
| View all orders | ✅ | ❌ | ❌ |
| View own assigned route | ✅ | ✅ | ❌ |
| Update delivery status | ✅ | ✅ (own only) | ❌ |
| View analytics dashboard | ✅ | ❌ | ❌ |
| Manage vehicles | ✅ | ❌ | ❌ |
| Manage maintenance tickets | ✅ | ❌ | ❌ |
| View own order tracking | ✅ | ✅ | ✅ (own only) |
| Trigger route optimization | ✅ | ❌ | ❌ |

---

## 3. Authentication & Authorization

- **Manager and Driver accounts:** authenticated via email + password, using hashed passwords (bcrypt) — never stored in plain text
- **Session handling:** JWT (JSON Web Token) issued on login, included in the `Authorization` header for subsequent requests, with a reasonable expiry (e.g., 8 hours)
- **Role enforcement:** backend middleware checks the role encoded in the JWT before allowing access to role-restricted endpoints (e.g., a driver token cannot call `/api/analytics/summary`)
- **Customer access:** no account/login — access is scoped to a single order via a unique, non-guessable order tracking ID (e.g., UUID rather than sequential integer, to prevent someone guessing other customers' order IDs)

---

## 4. Data Protection

### 4.1 Data Classified as Sensitive
- Customer contact information (phone/email) — used only for notifications
- Driver personal information (name, contact)
- Login credentials (hashed, never logged in plaintext)

### 4.2 Protection Measures
- All API traffic over HTTPS (even in local demo, plan for HTTPS in any deployed version)
- Passwords hashed with bcrypt before storage
- API keys (Claude API, Twilio/SMTP) stored in environment variables (`.env`), never committed to source control
- `.env` file explicitly excluded via `.gitignore`
- Customer tracking links use non-sequential, non-guessable identifiers (UUID) rather than exposing internal database IDs

### 4.3 What Is Explicitly NOT Collected
- No payment information (out of scope)
- No precise real-time customer location (only pickup/drop addresses provided at order creation)
- No unnecessary personal data beyond what's needed for delivery and contact

---

## 5. AI API Data Handling

- Only **structured, non-personally-identifying delay data** (delay reason, delay duration, zone) is sent to the Claude API for message generation
- Customer names/contact details are **not** included in the AI prompt — personalization (if any) is done by inserting the AI-generated text into a template that adds the recipient's name locally, after the API response is received
- No customer data is used to train or fine-tune any model — this project uses the API in a stateless, single-request manner only

---

## 6. Input Validation & Abuse Prevention

- All order creation inputs validated server-side (valid coordinates, non-negative weight, realistic time windows)
- Rate limiting recommended on public-facing endpoints (e.g., customer tracking lookup) to prevent abuse/enumeration attempts
- SQL injection prevented by using parameterized queries / ORM (SQLAlchemy) rather than raw string-concatenated SQL

---

## 7. Error Handling & Fail-Safes

- AI API failures (timeout, quota exceeded, error response) must not block the notification flow — system falls back to a static template message, logged distinctly so failures are visible to the manager
- Database connection failures return graceful error responses, not raw stack traces, to any client-facing endpoint

---

## 8. Known Limitations (Acceptable for Student Project Scope)

- No two-factor authentication (would be a reasonable production enhancement, out of scope here)
- No formal penetration testing performed — security measures reflect standard good practice for a project of this scale, not enterprise-grade hardening
- Single-server deployment assumed — no discussion of distributed security concerns (out of scope)

These limitations are appropriate to disclose plainly in your report as "acknowledged scope boundaries," which reads as mature engineering judgment rather than an oversight.
