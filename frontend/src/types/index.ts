export type AccentColor = 'blue' | 'orange';

export type MetricIcon = 'cpu' | 'memory' | 'storage' | 'network' | 'uptime';

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  secondary: string;
  icon: MetricIcon;
  accent: AccentColor;
  sparkline: number[];
}

export interface ResourceHistoryPoint {
  hour: number;
  label: string;
  cpu: number;
  memory: number;
  storage: number;
}

export interface ApiUsageItemData {
  id: string;
  provider: string;
  amount: string;
  variation: number;
  used: string;
  limit: string;
  percentage: number;
  unit: string;
  accentColor: AccentColor;
}

export type ServiceStatus = 'online' | 'offline' | 'degraded';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  port: number;
  status: ServiceStatus;
  uptime: string;
  cpu: number;
  memoryLabel: string;
  memoryPercent: number;
}

export type QuickLinkIcon = 'n8n' | 'hermes' | 'grafana' | 'portainer' | 'postgres' | 'telegram';

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon: QuickLinkIcon;
}

export interface SystemInfoData {
  hostname: string;
  primaryIp: string;
  os: string;
  kernel: string;
  loadAverage: [number, number, number];
  updatedAt: string;
}

export type PlatformRole = 'owner' | 'admin' | 'operator' | 'viewer';

export type SessionScope = 'setup' | 'user';

export type AuthState = 'anonymous' | 'setup' | 'authenticated';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  kind: 'permanent' | 'temporary';
  platformRole: PlatformRole;
  status: 'pending' | 'active' | 'disabled' | 'expired';
  expiresAt: string | null;
  initials: string;
}

/** @deprecated Prefer AuthUser — mantido para dados legados do dashboard mock */
export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
}

export interface SystemHealthData {
  statusLabel: string;
  detail: string;
  percentage: number;
  incidentsLabel: string;
  sparkline: number[];
}

export interface DashboardData {
  metrics: MetricCardData[];
  resourceHistory: ResourceHistoryPoint[];
  apiUsage: ApiUsageItemData[];
  quickLinks: QuickLink[];
  services: ServiceItem[];
  system: SystemInfoData;
  health: SystemHealthData;
  user: CurrentUser;
  notificationCount: number;
}

export interface SettingsSection {
  id: string;
  label: string;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
