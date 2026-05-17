import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <form
        onSubmit={onSubmit}
        className="w-80 rounded-lg border border-border bg-surface p-6 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-semibold">Studio Ops</h1>
        <p className="mb-5 text-sm text-muted">Inicia sesión para continuar</p>

        <label className="mb-1 block text-sm text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm text-muted">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {error && <p className="mb-3 text-sm text-status-error">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-accent py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
