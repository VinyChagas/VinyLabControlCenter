export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export type AccentColor = 'blue' | 'orange';
export type MetricIcon = 'cpu' | 'memory' | 'storage' | 'network' | 'uptime';
export type ServiceStatus = 'online' | 'offline' | 'degraded';
export type QuickLinkIcon = 'n8n' | 'hermes' | 'grafana' | 'portainer' | 'postgres' | 'telegram';

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
  loadAverage: [number | null, number | null, number | null];
  updatedAt: string;
}

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
