# Hulakico — Living Plan

Agents must read this file before writing code. Follow [AGENTS.md](AGENTS.md). One micro-step at a time. Max 3 files per prompt. Stop for human review and approval before the next step.

**Status:** Phase 2 Step 3 complete (awaiting approval). Next: Step 4.

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

### Agent (lead product engineer + system architect)
- Owns product decisions inside the active phase, architecture, seams, implementation, and strong defaults.
- Stops after each micro-step; proposes the next step after approval.
- Commits/pushes only when the human asks.

### Human (minimal gates)
- Review on localhost. Approve before the next micro-step. Ask for commit/push when desired.

---

## Architecture (locked)

| Layer | Stack | Owns |
|-------|--------|------|
| Product surface | Next.js (TypeScript) + SQLite→PostgreSQL | UI, auth, CRUD API, shipment state, carrier adapters, rate-card quotes |
| Intelligence | Python FastAPI | Ranking, ETA/delay risk, RTO/COD risk, document QC, exception triage, future ML |

**Boundaries:** Browser never calls Python. Next.js calls Python server-to-server with a service token. Secrets only in `.env`.

**Repo:** `apps/web`, `services/intelligence`, `PLAN.md`, `AGENTS.md`

**Shipment status machine**  
`DRAFT → QUOTED → BOOKED → HANDOVER_PENDING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED | RTO | EXCEPTION | CANCELLED`

---

## Nepal design constraints (research locks)

- Landlocked trade via India; Valley/Pokhara/Terai vs hill/remote ETA gap; COD-heavy domestic; monsoon and Dashain–Tihar spikes; intl HS/invoice pain.

**Beat:** DEX/Pathao/CSC/thin aggregators — by multi-carrier orchestration, predictive intelligence, premium self-serve UX, path to own fleet.

---

## Phase 1 — COMPLETE

Auth, booking draft wizard, quotes + Python ranking, AWB + tracking, ops + exceptions, ETA risk + document QC, COD ledger basics, brand landing shell, stub carriers, `transportMode` seam.

### Phase 1 checklist (archive)

| Step | Deliverable | Status |
|------|-------------|--------|
| 0–11 | Foundation through COD + landing harden | **DONE** |

---

## Phase 2 — Active

**Goal:** Harden trust seams and upgrade customer-facing UX that Phase 1 only skeletoned.

### In
- Ops **role gates** (only OPS/ADMIN open/resolve exceptions, COD, carrier ops — not customer accounts).
- **Exception collaboration:** ops can mark *info required*; customer replies on tracking; ops resolves.
- **Advanced booking UX** (richer wizard: clearer domestic/intl, docs/COD cues, less form-like).
- **Marketing homepage** (multi-section, intentional motion, Himalayan brand story) — advanced polish, not Phase 1 shell.

### Out (later phases)
Own rider/vehicle apps, full customs filing, full LC/trade finance, native mobile, deep trained ML, real carrier API keys until contracted.

### Exception collaboration (locked behavior)
- Ops opens exceptions (role-gated).
- Customer **sees** them on tracking.
- If ops marks **info required**, customer can **submit a reply** on the track view.
- Ops reviews reply → resolves or asks again.
- Customer never opens or resolves exceptions.

### UI direction (still applies)
Brand-first; Himalayan night-to-dawn; cards only where interaction requires them; English primary.

---

## Phase 2 micro-step checklist

| Step | Deliverable | Status |
|------|-------------|--------|
| 0 | Phase 2 scope + checklist in `PLAN.md` | **DONE** |
| 1 | Ops role gates (`CUSTOMER` / `OPS` / `ADMIN`) on `/ops/*` | **DONE** |
| 2 | Exception: `INFO_REQUIRED` + ops UI to request customer info | **DONE** |
| 3 | Customer reply on `/track/[token]` when info required | **DONE** (awaiting approval) |
| 4 | Advanced booking UX (wizard upgrade) | Pending |
| 5 | Marketing homepage (sections + motion) | Pending |

### Protocol
1. One step per approval cycle.
2. Max 3 files per prompt; then stop.
3. No placeholders inside shipped functions.
4. No silent scope expansion.

---

## Success criteria (end of Phase 2)

- Non-ops signed-in users cannot open `/ops` or exception/COD APIs.
- Ops can request info; customer can reply on tracking; ops can resolve after.
- Booking wizard feels clearly more advanced than Phase 1 skeleton.
- Homepage reads as a multi-section brand marketing surface with motion.
- Every step approved before the next began.

---

## After Phase 2 Step 3

Human: open public `/track/[token]` for an `INFO_REQUIRED` shipment → send reply → confirm on `/ops/exceptions` and timeline → approve → optionally commit.  
Next request when ready: **execute Step 4**.

---

## After Phase 2 Step 2

Human: as OPS, open an exception → **Request customer info** → confirm status `INFO_REQUIRED` on `/ops/exceptions` and tracking timeline → approve → optionally commit.  
Next request when ready: **execute Step 3**.

---

## After Phase 2 Step 1

Human: without OPS role, `/ops` redirects to account denied → set `OPS_BOOTSTRAP_EMAIL` to your email in `.env.local` → restart → `/ops` works → approve → optionally commit.  
Next request when ready: **execute Step 2**.

---

## After Phase 2 Step 0

Next: **execute Step 1** (ops role gates).

---

## After Phase 1 Step 11

Human: book domestic COD → `/ops/cod` → mark collected → polished `/` → commit.  
Phase 1 complete. Phase 2 started.
