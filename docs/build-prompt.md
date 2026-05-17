# AI Coding-Agent Build Prompt

Paste this as the kickoff prompt for an AI coding agent (Claude Code, Cursor, etc.).
It assumes the agent can read the other files in `docs/`.

---

## Context

You are building a **custom operations platform** for **I&S Homes Studio**
(NSG Donostia S.L., CIF B22932537) — an architecture / interior design studio in
Donostia, País Vasco. The studio runs its entire client workflow through
**WhatsApp** as the only interface. A custom backend handles everything behind
it; the studio never opens a technical tool. End clients only receive
professional, branded emails.

Phase 0 (setup, schema, auth, base app, CI) is already complete and verified —
PostgreSQL is running locally, the API boots, login works.

Read these first and treat them as the source of truth:

- `docs/job-description.md` — scope, phases, pricing, engagement
- `docs/development-roadmap.md` — phased task breakdown and sequencing
- `docs/client-data-analysis.md` — **locked business rules and data structures
  extracted from real client documents** — do not deviate
- `docs/design-system.md` — admin panel layout, colors, typography
- `README.md` — current state, how to run

If anything in this prompt conflicts with those docs, the docs win. If something
is undefined, ask before assuming.

## Locked Business Rules (must not deviate)

These come from real client documents (`client-data-analysis.md`) — they are
contractual reality, not assumptions:

- Budget structure is **chapter → item hierarchy**, not flat. 13 standard
  chapters defined in `client-data-analysis.md`.
- Item units are `M2`, `ML`, `UD`, `un` — keep this set.
- Honorarios formula: `feeAmount = max(pemTotal × 0.15, 4500)` — sin IVA.
- All budgets shown **sin IVA**. IVA is invoice-time only, never on the budget.
- Milestone schedule for honorarios: **30% · 40% · 30%** —
  acceptance · start of works · during execution.
- TicketBAI is **mandatory** (País Vasco) — every invoice must submit through it.
- PDF disclaimer wording on budgets is fixed legal text — do not paraphrase.

## Tech Stack (do not substitute without asking)

- **Monorepo:** `/api`, `/web`, `/shared` (shared TypeScript types)
- **Backend:** Node.js + NestJS, REST API, TypeScript
- **DB:** PostgreSQL + Prisma ORM
- **Async jobs:** BullMQ + Redis
- **Frontend:** React + Vite + TailwindCSS + React Query
- **Integrations:** Meta WhatsApp Business API, OpenAI API, Puppeteer, DocuSign
  API, Holded API (TicketBAI), Stripe (optional)

## Architectural Rules (non-negotiable)

1. **Every external integration lives behind its own adapter module.** Holded,
   DocuSign, WhatsApp, OpenAI, Stripe, email — each isolated so an external API
   change touches one file. No integration SDK calls scattered through business
   logic.
2. **Event-driven core.** Every state change writes a record to the `events`
   table and emits an internal event. Modules stay decoupled.
3. **Async/slow work runs as BullMQ jobs** — PDF generation, email, invoice
   creation, AI calls. Never block an HTTP request or a webhook handler on them.
4. **AI is a module, not the core.** The rule-based budget engine is the source
   of truth. AI only refines coherence on top. **Validate all AI output** — AI
   numbers never flow unvalidated into a budget or invoice.
5. **Integration failures must alert the studio** — never fail silently. Failed
   jobs go to a dead-letter queue.
6. **WhatsApp parser confirms before acting** — send a confirmation reply, act
   on the structured interpretation, never guess silently.

## Conventions

- TypeScript strict mode everywhere. Shared types in `/shared`, imported by both
  apps.
- ESLint + Prettier; CI runs lint + typecheck + test on every PR.
- `main` is protected; work on feature branches with PRs.
- Env via `.env`; keep `.env.example` current with every new variable.
- Tests: unit tests on business logic, integration tests on adapters (external
  APIs mocked).
- Commits: small, scoped, conventional-commit style.
- No secrets in code or commits.
- `bcryptjs` (not `bcrypt`) — Windows compatibility, already in place.

## Data Model

Phase 1 baseline is already in Prisma (`api/prisma/schema.prisma`):

- `users`, `clients`, `projects`, `messages`, `events`
- `budgets` with hierarchical `chapters` JSON, `pemTotal`, `feePercent` (0.15),
  `feeMinAmount` (4500), `feeAmount`, `taxBaseTotal`

Later phases add `proposals`, `contracts`, `invoices`. Slot them in following
the same pattern: Project is the spine, new tables hang off it.

## How to Work

- **Follow the roadmap phase by phase.** Do not jump ahead. Current state:
  Phase 0 complete. Start at Phase 1.1 Week 1.
- At the start of each phase, restate the tasks and confirm the plan.
- After each meaningful unit of work: run lint, typecheck, and tests; report
  what was done and what's next.
- When a task needs studio-provided input (more historical budgets, brand
  assets, API keys — see the roadmap's pre-start checklist), stop and flag it
  rather than mocking around it permanently.
- Keep `docs/` updated if architecture decisions change.

## First Task

Begin with **Phase 1.1 Week 1 — Data model + WhatsApp intake** from
`docs/development-roadmap.md`:

- CRUD services + REST endpoints for clients and projects.
- WhatsApp Business API webhook (inbound + verification).
- Message parser v1 → create client + project + emit `client.created` event.
- Confirmation reply back to the studio (parser confirms before acting).

Restate the Week 1 task list, confirm the studio has started Meta Business API
verification (lead time several days — block if not), then start.
