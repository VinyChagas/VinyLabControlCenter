import { AppError, ErrorCodes } from '../../utils/errors.js';
import { bytesToLabel, formatUptime, percentOrNull } from '../metrics/format.js';
import type { ContainerMetricsService } from '../metrics/container-metrics.service.js';
import type { MetricsService } from '../metrics/metrics.service.js';
import type { AggregatedContainerMetrics, ContainerMetrics } from '../metrics/metrics.types.js';
import type { ServiceItem } from './services.types.js';
import {
  allTrackedContainerNames,
  getServiceDefinition,
  SERVICE_REGISTRY,
  type ServiceDefinition,
} from './service-registry.js';

export class ServicesService {
  constructor(
    private readonly containers: ContainerMetricsService,
    private readonly metricsService?: MetricsService,
  ) {}

  async getAll(): Promise<ServiceItem[]> {
    const hostMemoryTotal = await this.safeHostMemoryTotal();
    const names = allTrackedContainerNames();
    let byName = new Map<string, ContainerMetrics>();

    if (names.length > 0) {
      try {
        const list = await this.containers.getContainers(names);
        byName = new Map(list.map((c) => [c.name, c]));
      } catch {
        byName = new Map();
      }
    }

    return SERVICE_REGISTRY.map((def) => this.fromDefinition(def, byName, hostMemoryTotal));
  }

  async getById(id: string): Promise<ServiceItem> {
    const def = getServiceDefinition(id);
    if (!def) {
      throw new AppError(ErrorCodes.NOT_FOUND, `Service '${id}' not found`, 404);
    }
    const hostMemoryTotal = await this.safeHostMemoryTotal();
    let byName = new Map<string, ContainerMetrics>();
    if (def.containers.length > 0) {
      try {
        const list = await this.containers.getContainers(def.containers);
        byName = new Map(list.map((c) => [c.name, c]));
      } catch {
        byName = new Map();
      }
    }
    return this.fromDefinition(def, byName, hostMemoryTotal);
  }

  private async safeHostMemoryTotal(): Promise<number | null> {
    if (!this.metricsService) return null;
    try {
      const summary = await this.metricsService.getSummary();
      return summary.memory.totalBytes;
    } catch {
      return null;
    }
  }

  private fromDefinition(
    def: ServiceDefinition,
    byName: Map<string, ContainerMetrics>,
    hostMemoryTotal: number | null,
  ): ServiceItem {
    if (def.containers.length === 0) {
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        port: def.port,
        status: 'offline',
        uptime: '--',
        cpu: 0,
        memoryLabel: '--',
        memoryPercent: 0,
      };
    }

    const aggregated = aggregateFromMap(def, byName);
    const memoryBytes = aggregated.memoryUsageBytes;
    const memoryPercentRaw = percentOrNull(memoryBytes, hostMemoryTotal);
    const memoryPercent =
      memoryPercentRaw !== null
        ? Math.min(100, Math.round(memoryPercentRaw))
        : memoryBytes !== null
          ? Math.min(100, Math.round((memoryBytes / (1024 ** 3)) * 100))
          : 0;

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      port: def.port,
      status: aggregated.status,
      uptime: formatUptime(aggregated.uptimeSeconds),
      cpu: aggregated.cpuUsagePercent !== null ? Math.round(aggregated.cpuUsagePercent) : 0,
      memoryLabel: bytesToLabel(memoryBytes),
      memoryPercent,
    };
  }
}

function aggregateFromMap(
  def: ServiceDefinition,
  byName: Map<string, ContainerMetrics>,
): AggregatedContainerMetrics {
  const essential = def.essentialContainers ?? def.containers;
  const containers = def.containers.map(
    (name) =>
      byName.get(name) ?? {
        name,
        available: false,
        cpuUsagePercent: null,
        memoryUsageBytes: null,
        networkRxBps: null,
        networkTxBps: null,
        startTime: null,
        uptimeSeconds: null,
      },
  );

  const essentialStates = containers.filter((c) => essential.includes(c.name));
  const availableEssential = essentialStates.filter((c) => c.available);
  const availableAny = containers.filter((c) => c.available);

  let status: AggregatedContainerMetrics['status'] = 'offline';
  if (availableEssential.length === essential.length && essential.length > 0) {
    status = 'online';
  } else if (availableEssential.length > 0 || availableAny.length > 0) {
    status = 'degraded';
  }

  if (availableAny.length === 0) {
    return {
      status: 'offline',
      cpuUsagePercent: null,
      memoryUsageBytes: null,
      networkRxBps: null,
      networkTxBps: null,
      uptimeSeconds: null,
      startTime: null,
      containers,
    };
  }

  const cpuSum = availableAny.reduce((acc, c) => acc + (c.cpuUsagePercent ?? 0), 0);
  const memSum = availableAny.reduce((acc, c) => acc + (c.memoryUsageBytes ?? 0), 0);
  const rxSum = availableAny.reduce((acc, c) => acc + (c.networkRxBps ?? 0), 0);
  const txSum = availableAny.reduce((acc, c) => acc + (c.networkTxBps ?? 0), 0);
  const uptimes = availableAny
    .map((c) => c.uptimeSeconds)
    .filter((v): v is number => v !== null);
  const starts = availableAny
    .map((c) => c.startTime)
    .filter((v): v is string => Boolean(v))
    .sort();

  return {
    status,
    cpuUsagePercent: Math.round(cpuSum * 10) / 10,
    memoryUsageBytes: Math.round(memSum),
    networkRxBps: Math.round(rxSum * 100) / 100,
    networkTxBps: Math.round(txSum * 100) / 100,
    uptimeSeconds: uptimes.length > 0 ? Math.min(...uptimes) : null,
    startTime: starts[0] ?? null,
    containers,
  };
}
