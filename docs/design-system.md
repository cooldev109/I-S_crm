# Design System — Admin Panel

Internal reference. Locked before frontend work starts. Stack: React + TailwindCSS.

## Principles

- The team lives in WhatsApp; this panel is the **fallback / oversight surface**.
- Calm, scannable, gets out of the way. Status colors do the heavy lifting.
- Warm neutrals (stone, not slate) — suits a design studio without being flashy.
- It's a working tool, not a marketing site.

## Layout

- **Sidebar + content** — fixed left sidebar, main content to the right.
  - Nav: Dashboard, Clients, Projects, Budgets, Invoices, Users
- **Top bar** — current studio user, search, notifications / alerts.
- **Content** — list views as dense tables; detail views as cards.
  - Project detail uses a timeline component for the audit trail.
- Max content width on detail pages so it doesn't sprawl on wide monitors.

## Color Theme

Light, neutral base + one accent. Maps to Tailwind `stone` + `blue` — no custom
theming overhead.

| Role | Color |
|------|-------|
| Background | `#FAFAF9` (warm off-white) |
| Surface / cards | `#FFFFFF` |
| Borders / dividers | `#E7E5E4` |
| Primary text | `#1C1917` (near-black) |
| Secondary text | `#78716C` (warm gray) |
| Accent (buttons, links, active nav) | `#2563EB` (or muted terracotta `#B45309` for a more "studio" feel) |

### Status colors

Used everywhere — budget states, payment states, contract states.

| State | Color |
|-------|-------|
| Draft / pending | `#78716C` gray |
| Under review | `#D97706` amber |
| Approved / paid / signed | `#16A34A` green |
| Overdue / error | `#DC2626` red |

## Typography

- **Inter** for all UI (clean, neutral, free).
- Optional display font for the login screen only — never in the working UI.

## Components (baseline)

- Tables: dense rows, sticky header, status badge column.
- Cards: white surface, `#E7E5E4` border, subtle shadow.
- Status badge: pill, status color background at low opacity + solid text.
- Buttons: solid accent (primary), outline (secondary), ghost (tertiary).
- Timeline: vertical, one node per `event` record.
