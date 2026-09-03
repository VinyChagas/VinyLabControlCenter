import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { LogoMark } from '@/components/layout/LogoMark';
import { ROUTES } from '@/constants/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(22,139,255,0.18), transparent 55%), radial-gradient(ellipse 70% 45% at 90% 100%, rgba(255,121,0,0.12), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark />
          <p className="mt-4 text-[12px] font-semibold tracking-[0.18em] text-muted">VINYLAB</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-text">Control Center</h1>
          <p className="mt-2 text-[13px] text-muted">Acesse com sua conta autorizada.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-line bg-card/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm"
        >
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-[14px] text-text outline-none transition focus:border-blue-accent/60"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[12px] font-medium text-muted">Senha</span>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 pr-11 text-[14px] text-text outline-none transition focus:border-blue-accent/60"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-text"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="mt-4 rounded-lg border border-orange-accent/30 bg-orange-accent/10 px-3 py-2 text-[13px] text-orange-accent">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-accent px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-mid disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
