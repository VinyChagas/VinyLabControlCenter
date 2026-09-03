import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ROUTES } from '@/constants/navigation';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-muted">
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isSetupSession, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen label="Validando sessão..." />;
  }

  if (isSetupSession) {
    return <Navigate to={ROUTES.setup} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isSetupSession, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Carregando..." />;
  }

  if (isSetupSession) {
    return <Navigate to={ROUTES.setup} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}

export function SetupRoute() {
  const { isAuthenticated, isSetupSession, loading, setupRequired } = useAuth();

  if (loading) {
    return <LoadingScreen label="Carregando..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (setupRequired === false) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!isSetupSession) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}
