/** Stand-in for nav sections not yet built. Replaced module by module in Phase 1. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{title}</h1>
      <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Esta sección se implementa en la Fase 1.
      </div>
    </div>
  );
}
