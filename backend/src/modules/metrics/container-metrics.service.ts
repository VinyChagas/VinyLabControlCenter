import { round } from './format.js';
import type { PrometheusClient } from './prometheus.client.js';
import { namesToRegex, PromQL } from './promql.js';
import type { AggregatedContainerMetrics, ContainerMetrics } from './metrics.types.js';

function mapByName(samples: Array<{ metric: Record<string, string>; value: [number, string] }>): Map<string, number> {
  const map = new Map<string, number>();
  for (const sample of samples) {
    const name = sample.metric.name;
    if (!name) continue;
    const value = Number(sample.value[1]);
    if (!Number.isFinite(value)) continue;
    map.set(name, (map.get(name) ?? 0) + value);
  }
  return map;
}

export class ContainerMetricsService {
  constructor(private readonly prometheus: PrometheusClient) {}

  async getContainers(names: string[]): Promise<ContainerMetrics[]> {
    if (names.length === 0) return [];

    const regex = namesToRegex(names);
    const [cpu, memory, rx, tx, start, lastSeen] = await Promise.all([
      this.prometheus.queryVector(PromQL.containerCpuCoresUsed(regex)),
      this.prometheus.queryVector(PromQL.containerMemoryBytes(regex)),
      this.prometheus.queryVector(PromQL.containerNetworkRxBps(regex)),
      this.prometheus.queryVector(PromQL.containerNetworkTxBps(regex)),
      this.prometheus.queryVector(PromQL.containerStartTime(regex)),
      this.prometheus.queryVector(PromQL.containerLastSeen(regex)),
    ]);

    const cpuMap = mapByName(cpu);
    const memMap = mapByName(memory);
    const rxMap = mapByName(rx);
    const txMap = mapByName(tx);
    const startMap = mapByName(start);
    const seenMap = mapByName(lastSeen);
    const nowSec = Date.now() / 1000;

    return names.map((name) => {
      const available = seenMap.has(name) || cpuMap.has(name) || memMap.has(name);
      const startSec = startMap.get(name) ?? null;
      const startTime =
        startSec !== null && Number.isFinite(startSec)
          ? new Date(startSec * 1000).toISOString()
          : null;
      const uptimeSeconds =
        startSec !== null && Number.isFinite(startSec) ? Math.max(0, Math.round(nowSec - startSec)) : null;
      const coresUsed = cpuMap.get(name) ?? null;

      return {
        name,
        available,
        // % of one CPU core (docker-stats style)
        cpuUsagePercent: coresUsed !== null ? round(coresUsed * 100, 1) : null,
        memoryUsageBytes: memMap.has(name) ? Math.round(memMap.get(name)!) : null,
        networkRxBps: rxMap.has(name) ? round(rxMap.get(name)!, 2) : null,
        networkTxBps: txMap.has(name) ? round(txMap.get(name)!, 2) : null,
        startTime,
        uptimeSeconds,
      };
    });
  }

  async aggregate(
    names: string[],
    options?: { essentialNames?: string[] },
  ): Promise<AggregatedContainerMetrics> {
    const containers = await this.getContainers(names);
    const essential = options?.essentialNames ?? names;
    const essentialStates = containers.filter((c) => essential.includes(c.name));
    const availableEssential = essentialStates.filter((c) => c.available);
    const availableAny = containers.filter((c) => c.available);

    let status: AggregatedContainerMetrics['status'] = 'offline';
    if (essential.length === 0) {
      status = 'offline';
    } else if (availableEssential.length === essential.length) {
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
      cpuUsagePercent: round(cpuSum, 1),
      memoryUsageBytes: Math.round(memSum),
      networkRxBps: round(rxSum, 2),
      networkTxBps: round(txSum, 2),
      uptimeSeconds: uptimes.length > 0 ? Math.min(...uptimes) : null,
      startTime: starts[0] ?? null,
      containers,
    };
  }
}
