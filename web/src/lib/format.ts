/** Spanish (€) currency formatting — used across budget views. */
export function fmtEur(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Short date+time for activity timestamps. */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}
