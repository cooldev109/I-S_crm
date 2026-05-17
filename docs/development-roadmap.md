# Development Roadmap — Custom Operations Platform

Internal working document. Granular task breakdown, sequencing, and deliverables.

- **Total estimate:** 9–12 weeks · $4,800
- **Stack:** React + Node.js (NestJS) + PostgreSQL + Prisma + Redis/BullMQ
- **Repo strategy:** monorepo — `/api`, `/web`, `/shared` (types)
- **Branching:** `main` protected, feature branches, PR review before merge

References:
- [job-description.md](job-description.md) — scope summary
- [client-data-analysis.md](client-data-analysis.md) — locked business rules from real client docs
- [design-system.md](design-system.md) — admin panel design
- [build-prompt.md](build-prompt.md) — kickoff prompt for AI coding agents

---

## Phase 0 — Setup & Foundation · ✅ DONE

Monorepo, tooling, Prisma schema (with chapter-based Budget model), base NestJS
app with auth + health check, React scaffold with login + auth guard, CI
pipeline, PostgreSQL running locally. See [README.md](../README.md) for the
verification sequence.

---

## Phase 1.1 — WhatsApp bot + database + AI budget generation · ~3 weeks

Goal: replace Notion + Google Sheets. Studio runs day-to-day from WhatsApp +
admin panel. End of Phase 1.1, the system can produce a reviewable budget from
a WhatsApp message.

### Week 1 — Data model + WhatsApp intake

- [ ] Prisma schema is in place — extend with any missing relations as needed
- [ ] CRUD services + REST endpoints for clients and projects
- [ ] Meta WhatsApp Business API account setup, phone number, webhook verified
- [ ] Inbound webhook endpoint: receive message, store raw in `messages`
- [ ] Message parser v1: extract `name`, `contact`, `project type`, `m²`, `scope`
      from structured WhatsApp message
- [ ] On parse success → create `client` + `project`, emit `client.created` event
- [ ] Outbound WhatsApp helper: send confirmation reply to studio
- [ ] Parser **confirms before acting** — confirmation reply summarises what it
      understood; studio must approve

**Deliverable:** WhatsApp message → client + project in DB → confirmation reply.

### Week 2 — Rule-based budget engine

> AI is deliberately added in Week 3, not Week 2. Rule-based first, AI on top.

- [ ] 13-chapter template encoded (see [client-data-analysis.md](client-data-analysis.md)):
      Derribos · Pladur · Albañilería · Carpintería · Fontanería · Electricidad ·
      Calefacción · Pintura · Muebles cocina · Electrodomésticos · Muebles armario ·
      Residuos · Limpieza
- [ ] Item catalog seeded from Lekunberri budget — codes, units (M2/ML/UD/un),
      descriptions, default unit prices
- [ ] Budget generator: project type + m² + scope → walks the chapter template,
      includes/excludes chapters by relevance, applies default quantities and prices
- [ ] PEM = sum of all items across chapters
- [ ] Honorarios computation: `max(pemTotal × 0.15, 4500)`
- [ ] `taxBaseTotal = pemTotal + feeAmount` (sin IVA, IVA is invoice-time only)
- [ ] Budget stored as `DRAFT`, linked to project, versioned
- [ ] WhatsApp notification: "presupuesto listo para revisar — PEM €X, honorarios €Y"
- [ ] Review loop: studio replies with adjustment → parser updates → new version
      (`UNDER_REVIEW` → `APPROVED`)

**Deliverable:** WhatsApp message produces a reviewable, versioned budget that
matches the structure of the studio's real documents.

### Week 3 — Admin dashboard + AI layer

- [ ] Clients list + detail view (projects, budgets, message history)
- [ ] Projects list + detail, status badges (per [design-system.md](design-system.md))
- [ ] Budget viewer: chapter-grouped item table, version selector, diff between versions
- [ ] Manual edit fallback (anything WhatsApp can do, the admin panel can do)
- [ ] Events / audit trail timeline per project
- [ ] Dashboard home: counts, recent activity
- [ ] OpenAI integration module (isolated adapter)
- [ ] Historical budgets ingested as reference base (RAG: embed + retrieve, or
      context injection if corpus is small — Lekunberri only for now, more arriving)
- [ ] AI refines the rule-based draft for coherence; never produces unvalidated
      numbers — validation runs on every AI output
- [ ] End-to-end test of Phase 1.1 flow
- [ ] Phase 1.1 documentation + studio walkthrough

**Deliverable:** Phase 1.1 complete, deployed, studio trained. Notion + Sheets
retired.

---

## Phase 1.2 — Branded PDFs + fee proposal + email to client · ~1.5 weeks

- [ ] Puppeteer service: HTML template → branded PDF
- [ ] **Budget PDF template** — visual 1:1 of the studio's existing document:
      header, chapter sections, item table, totals block (PEM / Honorarios /
      Base Imponible), disclaimer footer (verbatim text from analysis)
- [ ] `proposals` model: template type (interiorismo/arquitectura/estudio previo/
      mixto), linked to approved budget
- [ ] Fee proposal generator: pulls PEM + computed honorarios, renders the
      standard sections (Objeto · Alcance: Diseño/Técnica/Obra · PEM · Honorarios ·
      Forma de pago 30/40/30 · Consideraciones · Aceptación)
- [ ] **Honorarios PDF template** — 1:1 visual copy of Lekunberri's
      "Carta de Honorarios Profesionales"
- [ ] Studio validation loop for proposals (same WhatsApp pattern as budgets)
- [ ] Email adapter (transactional provider — Resend or SES)
- [ ] On studio approval → send both PDFs to end client by email
- [ ] Email templates branded with studio identity

**Deliverable:** approving a budget+proposal in WhatsApp triggers professional
branded PDFs delivered to the end client by email. End clients never need to
know there's a system.

---

## Phase 2.1 — DocuSign contracts & signing · $800 · 2–3 weeks

- [ ] `contracts` model + contract HTML template (Puppeteer)
- [ ] Contract generator: pulls project + budget + accepted honorarios, renders PDF
- [ ] DocuSign adapter (isolated): create envelope, send for signature
- [ ] DocuSign webhook: signature completed → emit `contract.signed`
- [ ] State machine: `proposal accepted → contract sent → signed`
- [ ] WhatsApp notification to studio at each transition

**Deliverable:** end client accepts → contract goes out via DocuSign → system
advances automatically on signature.

---

## Phase 2.2 — Holded invoicing + Stripe payments · $700 · 2 weeks

- [ ] `invoices` model: Holded ID, TicketBAI status, milestone (1/2/3), payment status
- [ ] Holded adapter: create invoice, submit TicketBAI, fetch status
- [ ] Milestone schedule encoded: **30% / 40% / 30%** of honorarios
      (acceptance · start of works · during execution)
- [ ] Trigger: `contract.signed` → generate milestone 1 invoice automatically
- [ ] Milestone 2 + 3 triggered by WhatsApp command:
      `hito 2, proyecto García` → parse → invoice
- [ ] Stripe adapter (optional): generate payment link per invoice
- [ ] Email module: invoice PDF + payment instructions / Stripe link to client
- [ ] Payment status tracking: `pending → paid → overdue`
- [ ] Payment reminders job (scheduled, BullMQ)
- [ ] TicketBAI edge cases tested (rectificative invoices, errors)

**Deliverable:** signed contract → automatic milestone 1 invoice; milestones 2+3
triggered by WhatsApp; payment status tracked.

---

## Phase 2.3 — Team users, permissions & analytics · $900 · 2 weeks

- [ ] Roles: admin, studio member, (read-only?)
- [ ] Role-based access control on API + UI
- [ ] User management screen in admin panel
- [ ] WhatsApp sender identity → mapped to a user; actions attributed in audit trail
- [ ] Invite / deactivate users
- [ ] Analytics dashboard: pipeline counts, conversion, PEM/honorarios over time,
      payment status overview
- [ ] API hook scaffold for future integrations (signed webhooks out, API keys)

**Deliverable:** multi-user, permissioned, attributed actions, with a real
analytics view for the studio.

---

## Cross-cutting (ongoing every phase)

- [ ] Every external integration behind its own adapter module
- [ ] Every state change emits an event into `events` (audit trail)
- [ ] Async/slow work (PDF, email, invoice, AI) runs via BullMQ jobs, never inline
- [ ] Integration failures alert the studio (don't fail silently)
- [ ] Tests: unit on business logic, integration tests on adapters (mocked)
- [ ] `.env.example` and README kept current

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| WhatsApp message parsing ambiguity | Structured message format defined with studio; confirmation reply before acting |
| TicketBAI compliance complexity | Lean on Holded's native support; test rectificative cases early in 2.2 |
| AI returns wrong numbers into budgets | Rule-based engine is source of truth; AI only refines; output validated |
| External API changes (Holded/DocuSign/Meta) | Isolated adapters — one file to fix |
| Scope creep via WhatsApp "just add..." requests | Phase gates; changes outside scope = change request |
| DocuSign API plan cost higher than expected | Confirm pricing before 2.1 starts |
| Only 1 historical budget so far | More needed before AI generation can be tuned — chase before Week 3 |

---

## Pre-Phase-1 Checklist (need from studio)

### ✅ Received (2026-05-16)
- [x] Studio identity & legal info (NSG Donostia S.L., CIF B22932537, partners)
- [x] One real budget structure (Lekunberri) — chapter set, item shape, totals
- [x] One real fee proposal (Lekunberri) — sections, payment schedule
- [x] Honorarios rule confirmed (15% PEM, min €4,500 sin IVA)
- [x] Milestone schedule confirmed (30/40/30)
- [x] TicketBAI requirement confirmed (País Vasco)

### ⏳ Still needed
- [ ] **2–3 more historical budgets** — variety (integral, larger parcial,
      bathroom) — needed before Week 3 AI tuning
- [ ] **List of 11 active projects** — client name, type, current stage, notes —
      first real data to import
- [ ] Pricing notes per project type (per-item unit-price logic, anything
      beyond the 15% honorarios rule)
- [ ] Brand assets (logo vector, colors, fonts) — needed for Phase 1.2 PDFs
- [ ] Contract template — needed for Phase 2.1
- [ ] Access to ishomesstudio.com — for understanding current lead capture

### 🟡 Start now, slow lead time
- [ ] **Meta WhatsApp Business API verification** — can take days; start at
      Phase 1.1 kickoff
- [ ] VPS (Hetzner / DigitalOcean, ~€5–10/month) + admin subdomain
      (e.g. `app.ishomesstudio.com`)
- [ ] OpenAI account + API key (free to set up, pay per use)
- [ ] Dedicated WhatsApp phone number (cannot be a personal one)
