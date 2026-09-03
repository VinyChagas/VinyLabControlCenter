import { apiUsageMock } from '@/mocks/apiUsage';
import { metricsMock, resourceHistoryMock } from '@/mocks/metrics';
import { quickLinksMock } from '@/mocks/quickLinks';
import { servicesMock } from '@/mocks/services';
import {
  currentUserMock,
  notificationCountMock,
  systemHealthMock,
  systemInfoMock,
} from '@/mocks/system';
import type { DashboardData } from '@/types';

export const dashboardMock: DashboardData = {
  metrics: metricsMock,
  resourceHistory: resourceHistoryMock,
  apiUsage: apiUsageMock,
  quickLinks: quickLinksMock,
  services: servicesMock,
  system: systemInfoMock,
  health: systemHealthMock,
  user: currentUserMock,
  notificationCount: notificationCountMock,
};
