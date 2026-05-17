# Job Description — Custom Operations Platform (WhatsApp-Driven CRM)

## Client

**I&S Homes Studio** (Iruarrizaga & St. Aubin) — architecture / interior design
studio based in Donostia (San Sebastián), País Vasco. Operating entity:
**NSG Donostia S.L., CIF B22932537**. Currently runs 11 active construction
renovation projects.

Existing tooling: Lovable (website + forms), Kit (email), Google Drive.
HubSpot will **not** be used — everything lives in the system we build.

## Overview

Design and build a custom operational system for the studio. The studio runs its
entire client workflow — from quote request to milestone billing — through a
single interface: **WhatsApp**. The studio never opens a technical tool. Behind
WhatsApp, a custom backend handles clients, budgets, AI-assisted proposals, PDF
documents, e-signatures, and invoicing.

This is a **custom software project**, not a no-code automation setup. The
deliverable is a real operational platform with its own logic, data, and state.

## Goals

- WhatsApp as the only control panel for the studio team.
- End clients only ever receive professional, branded emails.
- Replace Notion and Google Sheets with a structured, queryable database.
- Automate the full flow: quote request → budget → fee proposal → contract →
  invoice → milestone payments.
- Full TicketBAI compliance (mandatory for País Vasco).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (admin panel) | React (Vite, TailwindCSS, React Query) |
| Backend | Node.js + NestJS, REST API |
| Database | PostgreSQL + Prisma ORM |
| Async jobs | BullMQ + Redis |
| WhatsApp | Meta WhatsApp Business API (or Twilio wrapper) |
| AI budget generation | OpenAI API — historical budgets used as reference/knowledge base (RAG) |
| Document generation | Puppeteer (HTML templates → branded PDF) |
| E-signature | DocuSign API (webhook-driven) |
| Invoicing | Holded API with TicketBAI compliance |
| Payments (optional) | Stripe payment links |

## Scope of Work

**Total: $4,800 · 9–12 weeks**, structured in five independent sub-phases the
studio can pause between to validate each before continuing.

### Phase 1 — Core operations system · $2,400 · 4–5 weeks

#### Phase 1.1 — WhatsApp bot + database + AI budget generation
- WhatsApp bot: receive structured message → parse → create client + project.
- PostgreSQL database, admin dashboard for oversight.
- AI-assisted budget generation following the studio's real chapter/item
  structure (see [`client-data-analysis.md`](client-data-analysis.md)).
- WhatsApp review loop: studio replies to adjust, system re-generates.
- Replaces Notion + Google Sheets immediately.

#### Phase 1.2 — Branded PDFs + fee proposal + email to client
- Branded PDF generation (Puppeteer) for budgets and fee proposals — visual
  copies of the studio's existing documents.
- Fee proposal (honorarios) auto-generated from the approved budget using the
  locked rule: `15% of PEM, minimum €4,500 (sin IVA)`.
- Studio approves in WhatsApp → emails (budget PDF + proposal PDF) sent
  automatically to the end client.

### Phase 2 — Full operations flow · $2,400 · 6–7 weeks

#### Phase 2.1 — DocuSign contracts & signing · $800 · 2–3 weeks
- Contract generation from template once the proposal is accepted.
- Sent for signature via DocuSign API.
- Webhook on signature completion → automatic state advance.

#### Phase 2.2 — Holded invoicing + Stripe payments · $700 · 2 weeks
- Initial invoice auto-created in Holded (TicketBAI) on contract signature.
- Email to client with invoice + optional Stripe payment link.
- Milestone invoicing triggered by WhatsApp command ("hito 2, proyecto …"),
  following the studio's standard **30% / 40% / 30%** honorarios schedule:
  acceptance · start of works · during execution.
- Payment status tracking + automated reminders.

#### Phase 2.3 — Team users, permissions & analytics · $900 · 2 weeks
- Roles + permissions (admin / studio member).
- Full audit log of every action.
- Analytics dashboard.
- API hooks for future integrations.

## Locked Business Rules (extracted from real client documents)

- Budget structure: **chapter → item hierarchy** (13 standard chapters).
- Honorarios: `max(PEM × 15%, €4,500)`, sin IVA.
- All budgets shown sin IVA; IVA applied at invoice time only.
- Milestone schedule: 30% acceptance · 40% start of works · 30% during execution.
- Disclaimer text on budget PDFs is fixed (legal/commercial wording).

See [`client-data-analysis.md`](client-data-analysis.md) for the full extract.

## Architectural Principles

- **Event-driven core** — every state change emits an event; modules stay decoupled.
- **Isolated integration adapters** — Holded, DocuSign, WhatsApp, Stripe each
  behind their own module, so external API changes touch one file.
- **AI as a module, not the core** — budget logic works rule-based first; AI
  improves coherence on top. (Phase 1.1 ships rule-based budgets; AI is added
  once the WhatsApp loop is proven.)
- **WhatsApp as command interface** — a parser layer turns messages into
  structured actions; the admin panel is the fallback and oversight tool.

## Required Skills

- Proven experience building integrated custom systems (not isolated automations).
- Strong knowledge of REST APIs and webhooks for system integration.
- Node.js + React + PostgreSQL.
- Experience integrating CRM / billing / e-signature platforms.
- Ability to analyze and structure complex business processes — systemic thinking.

## Engagement

Starts with a paid trial phase (Phase 1.1), with the option of continuing
sub-phase by sub-phase based on the success and efficiency of each delivery.

## Ownership & Handover

The studio owns everything: source code, database, and infrastructure accounts.
Clean, documented code plus written technical documentation is delivered so any
competent developer can maintain or extend the system. An optional monthly
maintenance arrangement (backups monitoring, security updates, API fixes) is
available but not mandatory.
