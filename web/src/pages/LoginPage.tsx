import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <span className="text-base font-bold">S</span>
          </div>
          <div>
            <div className="text-base font-semibold">Studio Ops</div>
            <div className="text-xs text-muted">I&amp;S Homes</div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-border bg-surface p-7 shadow-sm"
        >
          <h1 className="mb-1 text-lg font-semibold">Iniciar sesión</h1>
          <p className="mb-6 text-sm text-muted">
            Entra con tu cuenta del estudio.
          </p>

          <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />

          <label className="mb-1.5 block text-xs font-medium text-muted">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />

          {error && (
            <div className="mb-4 rounded-md border border-status-error/30 bg-status-error/5 px-3 py-2 text-sm text-status-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          ¿Problemas para entrar? Contacta con el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
