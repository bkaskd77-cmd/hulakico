# Hulakico — Living Plan

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Phase 5 Step 2 complete (awaiting approval). Next: Step 3.

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

## Phase 4 — PAUSED (Step 5 pending)

Places provider seam + international commercial invoice editor are in.  
**Deferred:** Step 5 — customs-grade digital invoice UX + printable HTML + doc QC cue (resume after Phase 5 hub basics).

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

---

## Phase 5 — Active

**Goal:** Customer shipment hub — find past bookings easily and rebook the same consignee with one action.

### In
- **All shipments** list for the signed-in customer (status, route, AWB, dates).
- Pagination: **10 per page**, page numbers from **1**, plus **View more**.
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
| 1 | `listMyShipments` + All shipments on account (10/page, 3‑mo finished retention) | **DONE** |
| 2 | Copy / rebook → wizard prefilled (`/book?copyFrom=`) | **DONE** (awaiting approval) |
| 3 | Dedicated `/account/shipments` page polish + empty states | Pending |
| 4 | Resume Phase 4 Step 5 (customs invoice UX + printable + doc QC) | Pending |

---

## Success criteria (end of Phase 5 Steps 1–3)

- Customer sees their shipments from account without tracking URLs alone.
- One-click copy creates a new draft prefilled from a past shipment.
- Domestic and international copies respect lane/currency defaults.

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
