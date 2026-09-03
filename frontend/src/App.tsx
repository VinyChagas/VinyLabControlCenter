import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/constants/navigation';
import { BackupsPage } from '@/pages/Backups';
import { DashboardPage } from '@/pages/Dashboard';
import { EnvironmentsPage } from '@/pages/Environments';
import { LogsPage } from '@/pages/Logs';
import { ProjectsPage } from '@/pages/Projects';
import { ServicesPage } from '@/pages/Services';
import { SettingsPage } from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.services} element={<ServicesPage />} />
          <Route path={ROUTES.projects} element={<ProjectsPage />} />
          <Route path={ROUTES.environments} element={<EnvironmentsPage />} />
          <Route path={ROUTES.logs} element={<LogsPage />} />
          <Route path={ROUTES.backups} element={<BackupsPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
