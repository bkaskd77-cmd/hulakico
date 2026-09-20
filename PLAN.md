# Hulakico — Living Plan (Phase 1)

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Step 9 complete (awaiting approval). Next: Step 10.

**Local note:** Step 3 uses Node built-in SQLite (`DATABASE_PATH`) because Prisma engines are unavailable on Windows ARM64. Production target remains PostgreSQL; migrate when deploying to Linux/x64.

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

### Agent (lead product engineer + system architect)
- Owns product decisions inside Phase 1, architecture, seams, implementation, and strong defaults.
- Does almost all work automatically; does not wait for human to specify folder names or minor tech choices.
- Stops after each micro-step; proposes the next step after approval.
- Commits/pushes only when the human asks.

### Human (minimal gates)
- Review on localhost (or equivalent).
- Approve before the next micro-step.
- Ask for commit/push when desired.
- Provide external secrets/accounts (real carrier APIs, production DB, DNS, payments) and business policy (margins, which partners to contract).

---

## Architecture (locked)

| Layer | Stack | Owns |
|-------|--------|------|
| Product surface | Next.js (TypeScript) + Prisma + PostgreSQL | UI, auth, CRUD API, shipment state, carrier adapters, rate-card quotes |
| Intelligence | Python FastAPI | Ranking, ETA/delay risk, RTO/COD risk, document QC, exception triage, future ML |

**Boundaries**
- Browser never calls Python. Next.js API is the only trusted boundary; it calls Python server-to-server with a service token.
- Python does not own sessions, passwords, or primary CRUD writes.
- Next.js is source of truth for stored state; Python returns scores/predictions.
- Secrets only in `.env` (never committed).
- Carrier adapters behind an interface (stub → real API → own fleet).

**Repo layout (from Step 1 onward)**
- `apps/web` — Next.js
- `services/intelligence` — Python FastAPI
- `PLAN.md` — this file
- `AGENTS.md` — agent law

**Shipment status machine**  
`DRAFT → QUOTED → BOOKED → HANDOVER_PENDING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED | RTO | EXCEPTION | CANCELLED`

**Core entities (add only when a step needs them)**  
`User`, `Organization`, `Membership`, `Address`, `Carrier`, `CarrierService`, `RateCard`, `Shipment` (+ `transportMode`), `Quote` / `QuoteOption`, `TrackingEvent`, `Document`, `ExceptionCase`, later `CodCollection`, `Settlement`, `Invoice`, `Payment`.

---

## Nepal design constraints (research locks)

- Landlocked trade via India (Birgunj–Raxaul, Kolkata/Haldia); delays and demurrage are normal.
- Valley/Pokhara/Terai vs hill/remote coverage and ETA quality gap.
- COD-heavy domestic market; RTO and slow settlements destroy trust.
- Monsoon and Dashain–Tihar capacity/ETA spikes.
- Intl pain: HS codes, invoice/packing mismatches, weak proactive updates.

**Beat:** DEX/Pathao/CSC/thin aggregators/traditional forwarders — by neutral multi-carrier orchestration, predictive intelligence, premium self-serve UX, and a clean path to own fleet.

**Phase 1 pain fixes:** scored carrier choice, ETA risk, unified tracking, COD ledger basics, intl document QC, ops exception queue, `transportMode` seam.

---

## Users (Phase 1)

- Customer (Individual / Business): book, pay, track, docs, alerts.
- Hulakico Ops: risky booking confirm, partner assign, exceptions, rate cards/SLAs.
- Partner ingest / own fleet: later micro-steps only.

---

## Phase 1 scope

### In (built step-by-step)
Auth (Individual + Business), advanced booking (domestic + intl), rate-card quotes + Python ranking, AWB + tracking, ops + exceptions, ETA risk + document QC, COD basics, brand landing, stub carriers first.

### Out (future steps only)
Own rider/vehicle apps, full customs filing (NNSW/ASYCUDA), full LC/trade finance, native mobile, deep trained ML until enough real history (start rules/algorithms → graduate to ML).

### Planned later: exception collaboration (ops ↔ customer)
- **Ops opens** an exception (role-gated admin/ops only — not customer accounts).
- **Customer sees** the exception on tracking (and optionally account inbox).
- If ops marks **info required from customer**, the customer can **submit a reply / documents / missing details** on the track or account view.
- Ops reviews that reply, then **resolves** (or requests more info again).
- Customer never opens or resolves exceptions themselves; they only respond when asked.

---

## UI direction

- Brand-first landing; **Hulakico** as hero; CTA: Book a shipment.
- Advanced, dynamic aesthetic (Himalayan night-to-dawn, live route motion) — not flat CRUD grey, not generic purple AI theme.
- Cards only where interaction requires them.
- English primary; Nepali labels for district/status where they build trust.

---

## Micro-step checklist

| Step | Deliverable | Status |
|------|-------------|--------|
| 0 | Root `PLAN.md` (this file) | **DONE** |
| 1 | Next.js scaffold + design tokens + `.env.example` | **DONE** |
| 2 | Python FastAPI skeleton + `/health` | **DONE** |
| 3 | User/Org + session auth | **DONE** |
| 4 | Carrier/rate models + adapter interface + seeds | **DONE** |
| 5 | Booking draft wizard saves `DRAFT` | **DONE** |
| 6 | Deterministic quotes from rate cards | **DONE** |
| 7 | Python ranker + Next.js integration | **DONE** |
| 8 | Book + AWB + tracking skeleton | **DONE** |
| 9 | Ops list + exceptions | **DONE** (awaiting approval) |
| 10 | Python ETA risk + document QC wired | Pending |
| 11 | COD basics + landing polish + harden | Pending |

### Protocol
1. One step per approval cycle.
2. Max 3 files per prompt; then stop.
3. No placeholders inside shipped functions; incomplete product is OK.
4. No silent scope expansion.

---

## Success criteria (end of Phase 1)

- Individual books Kathmandu → Pokhara and tracks via public link.
- Business books an international lane with document QC warnings.
- Ops sees active shipments and resolves an exception.
- Next.js ↔ Python ranking contract is live.
- `OWN_FLEET` representable in schema without driver apps yet.
- Every step was approved before the next began.

---

## After Step 9

Human: open `/ops` → flag an exception → resolve on `/ops/exceptions` → approve → optionally commit.  
Next request when ready: **execute Step 10**.

---

## After Step 8

Human: Select & book a quote → open public tracking link → approve → optionally commit.  
Next request when ready: **execute Step 9**.

---

## After Step 7

Human: get quotes on a draft → confirm ranked scores from Python → approve → optionally commit.  
Keep intelligence API running: `uvicorn main:app --host 127.0.0.1 --port 8000`  
Next request when ready: **execute Step 8**.

---

## After Step 6

Human: open a draft → **Get quotes** → confirm rate list → approve → optionally commit.  
Next request when ready: **execute Step 7**.

---

## After Step 5

Human: sign in → `/book` → save a Kathmandu→Pokhara draft → approve → optionally commit.  
Next request when ready: **execute Step 6**.

---

## After Step 4

Human: open `/ops/carriers` while signed in → confirm seeded partners → approve → optionally commit.  
Next request when ready: **execute Step 5**.

---

## After Step 3

Human: open `/signup` and `/signin` → create Individual + Business accounts → approve → optionally commit.  
Next request when ready: **execute Step 4**.

---

## After Step 2

Human: hit `/health` → approve → optionally commit.  
Next request when ready: **execute Step 3**.

---

## After Step 1

Human: run the web app locally → review brand shell → approve → optionally commit.  
Next request when ready: **execute Step 2**.

---

## After Step 0

Human: review this file → approve → optionally `git commit`.  
Next request when ready: **execute Step 1**.
