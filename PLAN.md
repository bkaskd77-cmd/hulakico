# Hulakico — Living Plan

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Phase 3 Step 2 complete (awaiting approval). Next: Step 3.

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

## Phase 3 — Active

**Goal:** Carrier-grade party + address model (inspired by MyDHL-style ship forms) — step by step, no rush.

### In
- Structured **shipper / consignee** (name, company, phone, email).
- Structured **address** (line1, line2, postal, city, country).
- **Saved addresses** (address book) for signed-in users.
- Booking wizard wired to party/address fields.
- Light **live validation** and country→defaults (currency / COD rules).

### Out (later)
Full postal autocomplete APIs, real carrier address validation, native mobile, own fleet apps.

### Protocol
1. One step per approval cycle.
2. Max 3 files per prompt; then stop.
3. No placeholders; no silent scope expansion.

---

## Phase 3 micro-step checklist

| Step | Deliverable | Status |
|------|-------------|--------|
| 0 | Phase 3 scope + checklist in `PLAN.md` | **DONE** |
| 1 | `saved_addresses` table + shipment party columns + data helpers | **DONE** |
| 2 | Booking wizard: shipper/consignee + structured address fields | **DONE** (awaiting approval) |
| 3 | Saved address picker on booking (From / To) | Pending |
| 4 | Live field validation (required party, phone/email shape) | Pending |
| 5 | Country defaults (currency, COD eligibility cues) | Pending |

---

## Success criteria (end of Phase 3)

- Drafts store contact + structured address for origin and destination.
- User can save and reuse an address from their book.
- Wizard validates party essentials before save.
- Legacy flat `origin_address` / `destination_address` still populated for older views.
- Every step approved before the next began.

---

## After Phase 3 Step 2

Human: open `/book` → fill From/To contact + line1/line2/postal → save draft → approve → optionally commit.  
Next request when ready: **execute Step 3**.

---

## After Phase 3 Step 1

Human: no UI change required this step — approve schema/helpers → optionally commit.  
Next request when ready: **execute Step 2**.

---

## After Phase 2 Step 5

Human: open `/` → confirm marketing sections + motion → commit.  
Phase 2 complete. Phase 3 started.
