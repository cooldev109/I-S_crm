import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo iniciar sesión',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-accent via-[#1e40af] to-[#0f172a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Blueprint grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        {/* Soft glow accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
            <Compass className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Studio Ops</div>
            <div className="text-xs text-white/70">I&amp;S Homes</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-light leading-[1.15] tracking-tight">
            La plataforma operativa de{' '}
            <span className="font-normal italic">
              Iruarrizaga &amp; St. Aubin
            </span>
            .
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/75">
            Clientes, presupuestos y honorarios — todo el flujo del estudio en
            una sola herramienta.
          </p>
        </div>

        <div className="relative space-y-3 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>Donostia · País Vasco</span>
          </div>
          <div className="text-xs text-white/45">
            © {new Date().getFullYear()} NSG Donostia S.L.
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen items-center justify-center px-6 py-16 lg:min-h-0 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand mark */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <Compass className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Studio Ops
              </div>
              <div className="text-xs text-muted">I&amp;S Homes</div>
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-muted">
              Entra con tu cuenta del estudio para continuar.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@estudio.com"
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted transition hover:bg-bg hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-status-error/30 bg-status-error/5 px-3.5 py-2.5 text-sm text-status-error"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-muted">
            ¿Problemas para entrar? Contacta con el administrador del sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
