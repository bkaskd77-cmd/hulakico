# Hulakico — Living Plan

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Phase 11 complete. Admin shipment filters (in progress / delivered / finished) in progress. Next after that: live wallet HMAC (Phase 12).

**Local note:** Node built-in SQLite (`DATABASE_PATH`) on Windows ARM64. Production target remains PostgreSQL.

---

## Product

**Hulakico** is Nepal’s AI-powered logistics **middleman control tower**.

- Individuals and businesses book “send X from A to B” in our system (advanced booking, documents, track, exceptions, pay/settle).
- Fulfillment uses **third-party carriers** first (DHL, FedEx, domestic couriers, freight partners).
- Schema keeps `transportMode: THIRD_PARTY | OWN_FLEET` so owned transport can plug in later without rewriting booking/tracking.
- Scope: **domestic + international**.

Tagline direction: *One booking brain. Every carrier. Domestic + world.*

---

## Operating model

### Agent
Owns product decisions inside the active phase, architecture, seams, implementation. Stops after each micro-step. Commits/pushes only when asked.

### Human
Review on localhost. Approve before the next micro-step.

---

## Architecture (locked)

| Layer | Stack | Owns |
|-------|--------|------|
| Product surface | Next.js (TypeScript) + SQLite→PostgreSQL | UI, auth, CRUD, adapters, quotes |
| Intelligence | Python FastAPI | Ranking, ETA risk, doc QC, future ML |

Browser never calls Python. Secrets only in `.env`.

**Shipment status**  
`DRAFT → QUOTED → BOOKED → HANDOVER_PENDING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED | RTO | EXCEPTION | CANCELLED`

---

## Phase 1 — COMPLETE

Foundation through COD + brand landing shell + stub carriers.

---

## Phase 2 — COMPLETE

Ops role gates, exception collaboration (INFO_REQUIRED + customer track reply), advanced booking wizard UX, marketing homepage.

---

## Phase 3 — COMPLETE

Carrier-grade party + address model: structured shipper/consignee, address book, inline place suggest seam (`BUSINESS` | `ADDRESS` kinds), live validation, NPR/USD + COD lane defaults.

---

## Phase 4 — COMPLETE (Step 5 closed)

Places provider seam + international commercial invoice editor + printable digital invoice + invoice Doc QC blockers are in.

### Places suggest quality (locked)

Address intelligence must only suggest places that match the **selected country** and, when the user has entered a **city**, that city/location too. Wrong-country or wrong-city hits are bugs, not “best effort.” Stub catalog is a seed; live `PLACES_PROVIDER=nominatim` expands coverage. Product-list/Google-grade completeness is later.

### Mobile UX (locked)

Core flows (book, account, track) use narrow `max-w-*` shells and should remain usable on phones. **Documents** (digital invoice) must not rely on wide tables alone: stack line items on small screens; keep a full table for desktop and print. Long IDs wrap (`break-all`). Broader mobile QA pass is ongoing.

### Required fields (locked)

Customs invoice lines require description, HS code, country of manufacture, qty, unit, unit value, and **weight per item (kg)** before save. Incomplete invoices are Doc QC **BLOCKER**s and must not advance to booking. The same rule applies system-wide: required fields gate the next step (UI + schema + QC).

### Customs invoice target (from carrier-grade reference)

Line-item screen should support what customs typically expects — not a bare description box:

| Field / action | Why | Hulakico today |
|----------------|-----|----------------|
| Clear item description (+ optional guided helper) | Vague goods get held | Free-text description only |
| Commodity / HS code (+ lookup later) | Tariff classification | Optional HS text field |
| Qty + packaging unit (PCS, Boxes, …) | Declared contents | Qty; unit hard-coded `PCS` |
| Unit value + shipment currency | Duties / valuation | Unit value + NPR/USD |
| Unit weight (kg) | Weight vs value checks | Missing on invoice lines |
| Country of manufacture (full name or ISO) | Origin rules | Optional 2-letter ISO |
| Line totals + shipment totals (units / weight / value) | QC at a glance | Value total only on save |
| Add another item / copy line | Multi-SKU shipments | Add line / remove last |
| Save / reuse product list (later) | Repeat shippers | Out of scope for Step 5 |
| Export reason (sale, gift, …) | Purpose of export | Already on invoice header |

**Step 5 scope (when resumed):** expand line schema (unit select, weightKg), live totals bar, copy-line, country-of-origin UX, printable invoice HTML, doc QC cue. Product-list save/lookup and HS lookup can follow after.

### Phase 4 Step 5 micro-steps

| Step | Deliverable | Status |
|------|-------------|--------|
| 5a | Line unit enum + `weightKg` domain/DB/data | **DONE** |
| 5b | InvoiceEditor: unit, weight, totals bar, copy line | **DONE** |
| 5c | Printable commercial invoice HTML | **DONE** |
| 5d | Doc QC cue tied to invoice completeness | **DONE** |

---

## Phase 5 — Active

**Goal:** Customer shipment hub — find past bookings easily and rebook the same consignee with one action.

### In
- **All shipments** list for the signed-in customer (status, route, AWB, dates).
- Pagination: **15 per page**, page number buttons **1–10** max, plus **View more**.
- Finished shipments (`DELIVERED` / `CANCELLED` / `RTO`) remain visible for **3 months**, then auto-deleted.
- Open draft / track booked from the list.
- **Copy / rebook** — open `/book?copyFrom=` with party + address + package prefilled so the user reviews Route → Package → Review stepwise, then saves a new draft.
- Account entry point (clear “All shipments” CTA).

### Out (later)
Full shipment detail dashboard, bulk export, saved consignee favorites beyond address book, native apps.

### Protocol
1. One step per approval cycle.
2. Max 3 files per prompt; then stop.
3. No placeholders; no silent scope expansion.

---

## Phase 5 micro-step checklist

| Step | Deliverable | Status |
|------|-------------|--------|
| 0 | Phase 5 scope + checklist in `PLAN.md` | **DONE** |
| 1 | `listMyShipments` + All shipments on account (15/page, pages 1–10, 3‑mo finished retention) | **DONE** |
| 2 | Copy / rebook → wizard prefilled (`/book?copyFrom=`) | **DONE** |
| 3 | Dedicated `/account/shipments` page polish + empty states | **DONE** |
| 4 | Resume Phase 4 Step 5 (customs invoice UX + printable + doc QC) | **DONE** |

### Phase 5 follow-on (hub + hybrid track)

| Step | Deliverable | Status |
|------|-------------|--------|
| 5 | Open shipment shows Hulakico AWB + partner AWB deep link | **DONE** |
| 6 | Track: clean timeline, Hold (not Exception), handed over / dest city | **DONE** |
| 7 | Exception info-request / reply events use Hold on customer track | **DONE** |

---

## Phase 7 — COMPLETE (settle & notify)

**Goal:** Close the loop after booking — customer knows what to pay and when something needs action, without Ops chasing manually.

| Step | Deliverable | Status |
|------|-------------|--------|
| 0–6 | Notify stub + Ops log + settle status/list + stub transfer pay | **DONE** |

---

## Phase 8 — COMPLETE (Ops settle confirm; Step 4 deferred)

**Goal:** Ops can close the stub transfer loop the same way COD is collected — see awaiting payments and mark them paid so the customer open shipment shows **Paid**.

| Step | Deliverable | Status |
|------|-------------|--------|
| 0–3 | List/mark paid API + `/ops/payments` desk + stub notify | **DONE** |
| 4 | Ops nav link + COD/payments cross-links | **DEFERRED** (after Admin foundation) |

---

## Phase 9 — COMPLETE (Admin AI control tower; shared-role model superseded)

Shared `users.platform_role` Admin/Ops is superseded by Phase 10 staff accounts.

| Step | Deliverable | Status |
|------|-------------|--------|
| 0–6 | Admin gate, AI tower board, eta-risk-batch, account CTA | **DONE** |

---

## Phase 10 — COMPLETE (Separate Admin staff vs customer)

**Goal:** Customer book/track accounts and Admin/staff control accounts are completely separate systems. Ops lives under `/admin`.

### In
- `staff_users` + `staff_sessions` + `hulakico_staff_session` cookie.
- Staff bootstrap via `STAFF_BOOTSTRAP_EMAIL` + `STAFF_BOOTSTRAP_PASSWORD`.
- `/admin/signin` uses staff auth only.
- Staff gate for AI tower + Ops desks under `/admin/*`.
- `/ops/*` redirects to `/admin/*`; customer account has no Ops/Admin CTAs.
- Retire promoting customers with OPS/ADMIN_BOOTSTRAP_EMAIL.

### Out (later)
Staff invite UI, CMS, impersonation, drop unused `users.platform_role`.

| Step | Deliverable | Status |
|------|-------------|--------|
| 0–7 | Staff auth, gates, Ops under Admin, redirects | **DONE** |

---

## Phase 11 — IN PROGRESS (Booking prepay gate + stub Nepal wallets)

**Goal:** After Review, customers must pay freight before BOOKED unless domestic COD. Stub eSewa / Khalti / Connect IPS until live merchant keys.

| Step | Deliverable | Status |
|------|-------------|--------|
| 1 | Payment domain + wallet provider seam | **DONE** |
| 2 | Pay API + stub checkout + confirm gate | **DONE** |
| 3 | Wizard Payment step | **DONE** |
| 4 | Draft page payment gate + settle ops list | **DONE** |
| 5 | PLAN.md note | **DONE** |

**Later:** Live eSewa/Khalti/Connect IPS HMAC, merchant IDs, production callbacks.

---

## After Phase 5 Step 2

Human: open `/account` → **Copy / rebook** → `/book` wizard opens with prior shipper/consignee/package filled → review each step → Save draft → approve.  
Next request when ready: **execute Step 3**.

---

## After Phase 5 Step 1

Human: open `/account` → All shipments shows up to 10 rows → use page **1, 2, …** or **View more** when needed. Finished stay ~3 months then drop.  
Next request when ready: **execute Step 2** (Copy / rebook).

---

## After Phase 4 Step 4

Human: book an **international** draft → open `/book/draft/[id]` → fill commercial invoice lines → Save invoice.  
Phase 4 Step 5 deferred; Phase 5 customer hub started.

---

## Phase 6 — Live third-party carriers

**Goal:** Replace stub freight with real partner AWB + tracking sync while customers still track on Hulakico.

| Step | Deliverable | Status |
|------|-------------|--------|
| 1 | Ops attach/edit `external_awb` on booked shipments | **DONE** |
| 2 | `syncTrackingFromCarrier` + status mapper + ops refresh | **DONE** |
| 3 | `DhlAdapter` behind `DHL_API_KEY` (sandbox/live) | **DONE** |
| 4 | FedEx + domestic adapters + `POST /api/webhooks/carrier` | **DONE** |

**Ops:** `/ops` → Attach/Update partner AWB → Hulakico milestones (Refresh partner tracking deferred until live API).  
**Webhook:** `POST /api/webhooks/carrier` with `{ externalAwb, events }` (+ `CARRIER_WEBHOOK_SECRET` when set).

### Hybrid tracking (starting phase — no partner API required)

**Principle:** Hulakico AWB is the primary handle for booking, account, invoice, support, and the Hulakico timeline. Partner AWB is secondary: pasted once, then used for live partner movement.

| Step | Deliverable | Status |
|------|-------------|--------|
| A | Public `/track` shows Hulakico AWB first + partner AWB deep link | **DONE** |
| B | Ops 1-click Hulakico status / timeline presets (milestones only) | **DONE** |
| C | Remove demo Refresh from Ops UI until partner API | **DONE** |
| D | Clean track timeline (no stub duplicates); Hold not Exception | **DONE** |

Customers track partner hops via the partner link; Ops updates Hulakico milestones until live API/webhook sync exists.

---

## After Phase 5 Step 3

Human: `/account` → **All shipments** → `/account/shipments` list (15/page, pages 1–10) · empty state books first send · open/track/copy work.  
Next when ready: Phase 4 Step 5 polish **or** ops/partner tracking refinements.
