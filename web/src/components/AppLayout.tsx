import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', end: true, Icon: LayoutDashboard },
  { to: '/clients', label: 'Clientes', Icon: Users },
  { to: '/projects', label: 'Proyectos', Icon: FolderKanban },
  { to: '/budgets', label: 'Presupuestos', Icon: FileText },
  { to: '/invoices', label: 'Facturas', Icon: Receipt },
  { to: '/users', label: 'Usuarios', Icon: UserCog },
];

/** Sidebar + top bar + content shell. See docs/design-system.md. */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white">
            <span className="text-sm font-bold">S</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Studio Ops</div>
            <div className="text-xs text-muted">I&amp;S Homes</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 font-medium text-accent'
                    : 'text-muted hover:bg-bg hover:text-ink'
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <div className="px-3 py-2">
            <div className="text-xs text-muted">Conectado como</div>
            <div className="truncate text-sm font-medium">{user?.name}</div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
