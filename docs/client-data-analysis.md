# Client Data Analysis — I&S Homes Studio

Extracted from the first project package sent on 2026-05-16 (Lekunberri).
Use this as the source of truth for the budget/proposal data model and PDF templates
until more historical projects are received.

## Studio identity (use in PDFs + TicketBAI)

| Field | Value |
|-------|-------|
| Legal name | NSG Donostia S.L. |
| CIF | B22932537 |
| Brand | I&S Homes Studio (Iruarrizaga & St. Aubin) |
| Location | San Sebastián (Donostia), País Vasco |
| Signatories | Patrick de St. Aubin · Bernardita de Iruarrizaga |
| Fiscal regime | País Vasco → **TicketBAI mandatory** |

## Budget (Presupuesto Estimativo) — structure

Hierarchical: **chapter → item**. Flat line-item shape (our original assumption) is wrong.

```
Chapter (Capítulo)            — code "1", title "TRABAJOS PREVIOS/DEMOLICIONES"
  Item                        — code "1.1", unit "M2", description, qty, unitPrice, total
  Item                        — code "1.2", …
  Chapter subtotal            — "1. TOTAL DERRIBOS"
Chapter "2. PLADUR, ESCAYOLA" …
…
TOTAL OBRAS SIN IVA           (= PEM, Presupuesto de Ejecución Material)
HONORARIOS PROFESIONALES      (= 15% PEM, min €4,500 sin IVA)
TOTAL BASE IMPONIBLE SIN IVA  (= PEM + honorarios, still sin IVA)
```

### Standard chapter set (used in Lekunberri — derive a template from this)

1. Trabajos previos / Demoliciones
2. Pladur, escayola
3. Albañilería
4. Carpintería interior madera
5. Fontanería
6. Electricidad
7. Calefacción
8. Pintura
9. Muebles de cocina (sin electrodomésticos)
10. Electrodomésticos cocina
11. Muebles armario
12. Gestión de residuos
13. Limpieza final

Not every project uses all 13 — a kitchen-only job skips Carpintería or Muebles armario.
The chapter set is a checklist the budget generator works through.

### Item fields

| Field | Example | Notes |
|-------|---------|-------|
| code | "1.1", "6.9" | chapter.item dotted |
| unit | M2, ML, UD, un | square m, linear m, unit |
| description | "M2 DEMOLICIÓN TABIQUERIA ZONA ARMARIO" | can be multi-line with detailed spec |
| quantity | 4.00 | decimals supported |
| unitPrice | 30.00 | euros, sin IVA |
| total | 120.00 | qty × unitPrice |

### Disclaimer text (verbatim, reuse in PDF template)

> Documento estimativo, no contractual.
> Mediciones y precios sujetos a definición final de calidades.
> Los importes detallados en el presente documento se expresan sin IVA.

## Honorarios (Carta de Honorarios Profesionales) — structure

Separate document tied to one budget. Sections in order:

1. Header: title + project metadata (Proyecto · Ubicación · Cliente · Fecha)
2. **Objeto del encargo** — purpose statement
3. **Alcance de los servicios** — three fixed phases:
   - Fase de diseño
   - Fase de desarrollo técnico
   - Fase de obra
4. **PEM** — references the budget total
5. **Honorarios profesionales** — "15% sobre el PEM, mínimo 4.500 € sin IVA"
6. **Base imponible total** — PEM + honorarios
7. **Forma de pago** (the milestone schedule — see below)
8. **Consideraciones** — boilerplate disclaimers
9. **Aceptación**
10. Signature block (Patrick + Bernardita)

## Payment schedule (locks Phase 2.2 milestone model)

Honorarios paid in **three milestones**:

| Milestone | % | Trigger |
|-----------|---|---------|
| 1 | 30% | A la aceptación del encargo |
| 2 | 40% | Al inicio de obra |
| 3 | 30% | Durante la ejecución (según avance de obra) |

The system's milestone-invoice command (`hito 2, proyecto …`) maps directly to these.

## Locked business rules (encode in the budget generator)

- `feeAmount = max(pem * 0.15, 4500)` — both sin IVA
- `taxBaseTotal = pem + feeAmount` — sin IVA
- IVA is **invoice-time only**, never on the budget
- Honorarios PDF references the budget but is independent — same project, separate document
- Disclaimer wording is fixed (legal/commercial); do not paraphrase in PDF templates

## Still missing from the client

Sent so far: 1 project (Lekunberri — reforma parcial cocina + vestidor).

| Need | Status | Why |
|------|--------|-----|
| 2–3 more historical budgets | missing | Need variety (one reforma integral, one bigger parcial, one bath) to train AI generator and validate the chapter set |
| 11 active projects list | missing | First real data to import — also confirms what statuses/phases they actually use |
| Pricing notes per project type | missing | Currently only know "15% on PEM" for honorarios; nothing on item unit-price logic |
| Brand assets (logo files, colors) | not yet sent | Needed for PDF templates (Phase 1.2). Logo wordmark visible in the honorarios PDF — would need vector source |
| Contract template | not yet sent | Phase 2.1 |

## Implications for our build

1. **Prisma schema update** (done in this session): `Budget.lineItems` → `Budget.chapters`,
   with chapter/item nested shape; add `pemTotal`, `feePercent`, `feeMinAmount`,
   `feeAmount`, `taxBaseTotal`; drop the budget-level IVA fields (IVA is invoice-time).
2. **Shared DTOs updated**: `BudgetLineItem` removed; `BudgetChapter` and `BudgetItem` added.
3. **Budget generator (Week 2)**: walks the 13-chapter template, asks/derives items per
   chapter based on project type and scope, computes PEM + honorarios automatically.
4. **PDF templates (Phase 1.2)**: near-1:1 visual copies of the Lekunberri documents —
   reuse the exact section structure and disclaimer wording.
