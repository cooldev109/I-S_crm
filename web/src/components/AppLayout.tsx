import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clientes' },
  { to: '/projects', label: 'Proyectos' },
  { to: '/budgets', label: 'Presupuestos' },
  { to: '/invoices', label: 'Facturas' },
  { to: '/users', label: 'Usuarios' },
];

/** Sidebar + top bar + content shell. See docs/design-system.md. */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-surface">
        <div className="px-5 py-4 text-lg font-semibold">Studio Ops</div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:bg-bg'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <div className="text-sm text-muted">Panel de control</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink">{user?.name}</span>
            <button onClick={logout} className="text-muted hover:text-accent">
              Salir
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
