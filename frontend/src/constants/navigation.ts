export const ROUTES = {
  login: '/login',
  dashboard: '/',
  services: '/services',
  projects: '/projects',
  environments: '/environments',
  logs: '/logs',
  backups: '/backups',
  settings: '/settings',
} as const;

export const PLATFORM_ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  operator: 'Operador',
  viewer: 'Viewer',
};

export interface NavItem {
  to: string;
  label: string;
  icon: 'dashboard' | 'services' | 'projects' | 'environments' | 'logs' | 'backups' | 'settings';
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: 'dashboard' },
  { to: ROUTES.services, label: 'Serviços', icon: 'services' },
  { to: ROUTES.projects, label: 'Projetos', icon: 'projects' },
  { to: ROUTES.environments, label: 'Ambientes', icon: 'environments' },
  { to: ROUTES.logs, label: 'Logs', icon: 'logs' },
  { to: ROUTES.backups, label: 'Backups', icon: 'backups' },
  { to: ROUTES.settings, label: 'Configurações', icon: 'settings' },
];

export interface PageMeta {
  greeting?: string;
  title: string;
  subtitle: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  [ROUTES.dashboard]: {
    greeting: 'Bem-vindo',
    title: 'Control Center',
    subtitle: 'Visão geral da sua VPS em tempo real.',
  },
  [ROUTES.services]: {
    title: 'Serviços',
    subtitle: 'Status e operação dos serviços da VPS.',
  },
  [ROUTES.projects]: {
    title: 'Projetos',
    subtitle: 'Projetos associados a esta VPS.',
  },
  [ROUTES.environments]: {
    title: 'Ambientes',
    subtitle: 'Ambientes de execução disponíveis.',
  },
  [ROUTES.logs]: {
    title: 'Logs',
    subtitle: 'Registros recentes do sistema.',
  },
  [ROUTES.backups]: {
    title: 'Backups',
    subtitle: 'Cópias de segurança e restauração.',
  },
  [ROUTES.settings]: {
    title: 'Configurações',
    subtitle: 'Preferências e integrações do Control Center.',
  },
};
