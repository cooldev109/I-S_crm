/**
 * Parses studio replies to a budget-review message. Designed for short,
 * direct WhatsApp commands. Unknown messages return null so the orchestrator
 * can fall back to the help text.
 *
 * Supported commands (Spanish, case-insensitive):
 *
 *   aprobar | aprobado | ok                  -> approve the current draft
 *   regenerar | regenerate                   -> regenerate v_n+1 from defaults
 *   subir <codigo> a <precio>                -> set unitPrice of item <codigo>
 *   bajar <codigo> a <precio>                -> alias for subir
 *   precio <codigo> <precio>                 -> alias for subir
 *   cambiar <codigo> qty <cantidad>          -> set quantity of item <codigo>
 *   cantidad <codigo> <cantidad>             -> alias for cambiar qty
 *   quitar <codigo> | eliminar <codigo>      -> remove item <codigo>
 */

export type Adjustment =
  | { kind: 'approve' }
  | { kind: 'regenerate' }
  | { kind: 'refine' }
  | { kind: 'setPrice'; itemCode: string; unitPrice: number }
  | { kind: 'setQuantity'; itemCode: string; quantity: number }
  | { kind: 'remove'; itemCode: string };

const APPROVE = /^(aprob(ar|ado)|approve|ok)\s*\.?$/i;
const REGENERATE = /^(regenerar|regenerate|reset)\s*\.?$/i;
const REFINE = /^(refinar|afinar|ai|refine)\s*\.?$/i;
const SET_PRICE = /^(?:subir|bajar)\s+(\d+(?:\.\d+)?)\s+a\s+(\d+(?:[.,]\d+)?)\s*\.?$/i;
const SET_PRICE_ALT = /^precio\s+(\d+(?:\.\d+)?)\s+(\d+(?:[.,]\d+)?)\s*\.?$/i;
const SET_QTY = /^(?:cambiar\s+(\d+(?:\.\d+)?)\s+qty|cantidad\s+(\d+(?:\.\d+)?))\s+(\d+(?:[.,]\d+)?)\s*\.?$/i;
const REMOVE = /^(?:quitar|eliminar|borrar)\s+(\d+(?:\.\d+)?)\s*\.?$/i;

export function parseAdjustment(body: string): Adjustment | null {
  const t = body.trim();
  if (APPROVE.test(t)) return { kind: 'approve' };
  if (REGENERATE.test(t)) return { kind: 'regenerate' };
  if (REFINE.test(t)) return { kind: 'refine' };

  const price = t.match(SET_PRICE) ?? t.match(SET_PRICE_ALT);
  if (price) {
    return {
      kind: 'setPrice',
      itemCode: price[1],
      unitPrice: parseDecimal(price[2]),
    };
  }

  const qty = t.match(SET_QTY);
  if (qty) {
    return {
      kind: 'setQuantity',
      itemCode: qty[1] ?? qty[2],
      quantity: parseDecimal(qty[3]),
    };
  }

  const rm = t.match(REMOVE);
  if (rm) return { kind: 'remove', itemCode: rm[1] };

  return null;
}

function parseDecimal(s: string): number {
  return Number(s.replace(',', '.'));
}

export const ADJUSTMENT_HELP =
  'Comandos disponibles:\n' +
  '  aprobar | regenerar | refinar (IA)\n' +
  '  subir <código> a <precio>\n' +
  '  cambiar <código> qty <cantidad>\n' +
  '  quitar <código>\n' +
  'Ejemplos: "subir 1.1 a 35"  |  "cambiar 6.5 qty 12"  |  "quitar 11.1"  |  "refinar"';
