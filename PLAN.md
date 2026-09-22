# Hulakico — Living Plan

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Phase 4 Step 4 complete (awaiting approval). Next: Step 5.

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

## Phase 4 — Active

**Goal:** Real-world address intelligence + international customs document foundation — step by step, no rush.

### In
- **Places provider seam** (env-backed adapter): stub catalog remains fallback; optional live provider maps results into existing `kind` + address fields.
- **Tighter suggest matching** (no false Kathmandu hits); preserve typed company forever.
- **Commercial / customs digital invoice** for **international** drafts (line items, values, currency) — not just a contents string.
- Invoice fields stored on shipment / related table; wizard step or panel for international only.
- Stub PDF or printable HTML invoice export (carrier-ready polish later).
- Doc QC awareness of invoice presence on international lanes.

### Out (later phases)
Native mobile, own-fleet apps, full carrier label APIs, payment settlement depth, live carrier address validation beyond Places.

### Protocol
1. One step per approval cycle.
2. Max 3 files per prompt; then stop.
3. No placeholders; no silent scope expansion.
4. Never hardcode Places/API secrets — `.env` only.

---

## Phase 4 micro-step checklist

| Step | Deliverable | Status |
|------|-------------|--------|
| 0 | Phase 4 scope + checklist in `PLAN.md` | **DONE** |
| 1 | Places provider interface + stub adapter (kind-aware) behind intelligence | **DONE** |
| 2 | Optional live provider hook via env (fallback to stub if unset) | **DONE** |
| 3 | International commercial invoice schema + data helpers | **DONE** |
| 4 | Booking UI: invoice line items for international only | **DONE** (awaiting approval) |
| 5 | Printable/digital invoice view (HTML) + doc QC cue | Pending |

---

## Success criteria (end of Phase 4)

- Suggest can use live Places when configured; stub still works offline.
- `BUSINESS` vs `ADDRESS` continues to drive company fill rules.
- International drafts can carry a structured commercial invoice.
- Domestic booking unchanged (no invoice required).
- Every step approved before the next began.

---

## After Phase 4 Step 4

Human: book an **international** draft → open `/book/draft/[id]` → fill commercial invoice lines → Save invoice → reload shows saved lines. Domestic draft has no invoice block.  
Next request when ready: **execute Step 5**.

---

## After Phase 4 Step 3

Human: no UI yet — approve schema (`commercial_invoices` + lines) and helpers → optionally commit.  
Next request when ready: **execute Step 4**.

---

## After Phase 4 Step 2

Human: keep `PLACES_PROVIDER=stub` (default) → Soaltee/lakeside still work. Optionally set `PLACES_PROVIDER=nominatim` in `services/intelligence/.env`, restart intelligence → type a real place (e.g. Hyatt Kathmandu) → live results or stub fallback.  
Next request when ready: **execute Step 3**.

---

## After Phase 4 Step 1

Human: restart intelligence → `/book` type `Hyatt Regency Kathmandu` → should NOT list unrelated Kathmandu hotels; type `Soaltee` or `lakeside` → matches → approve.  
Next request when ready: **execute Step 2**.

---

## After Phase 4 Step 0

Human: read Phase 4 scope above → approve → optionally commit.  
Next request when ready: **execute Step 1**.

---

## After Phase 3 Step 5

Human: open `/book` → Package step → domestic shows NPR + COD cue → switch International → USD default, COD message says unavailable → approve → commit.  
Phase 3 complete. Phase 4 started.
