import type { CurrentUser, SystemHealthData, SystemInfoData } from '@/types';

export const currentUserMock: CurrentUser = {
  name: 'Vini Chagas',
  role: 'Administrador',
  initials: 'VC',
};

export const systemInfoMock: SystemInfoData = {
  hostname: 'vps-vinichagas',
  primaryIp: '192.168.1.10',
  os: 'Ubuntu 24.04 LTS',
  kernel: '6.8.0-41-generic',
  loadAverage: [0.32, 0.41, 0.38],
  updatedAt: '03/09/2026 11:45',
};

export const systemHealthMock: SystemHealthData = {
  statusLabel: 'Sistema Online',
  detail: 'Todos os serviços',
  percentage: 100,
  incidentsLabel: 'Sem incidentes',
  sparkline: [96, 97, 98, 99, 98, 99, 100, 100, 99, 100, 100, 100],
};

export const notificationCountMock = 3;
