import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { formatDateTimePt, percentOrNull, round } from './format.js';
import type { PrometheusClient } from './prometheus.client.js';
import { PromQL } from './promql.js';
import type { SystemInfo, SystemMetricsSummary } from './metrics.types.js';

function looksLikeDockerShortId(value: string): boolean {
  return /^[a-f0-9]{12}$/i.test(value);
}

export class MetricsService {
  constructor(private readonly prometheus: PrometheusClient) {}

  async getSummary(): Promise<SystemMetricsSummary> {
    if (!this.prometheus.isConfigured()) {
      throw new AppError(
        ErrorCodes.METRICS_UNAVAILABLE,
        'Prometheus não configurado (PROMETHEUS_URL)',
        503,
      );
    }

    const [
      cpuUsage,
      cores,
      load1,
      load5,
      load15,
      memTotal,
      memAvail,
      diskTotal,
      diskAvail,
      rx,
      tx,
      uptime,
      boot,
    ] = await Promise.all([
      this.prometheus.queryScalar(PromQL.cpuUsagePercent),
      this.prometheus.queryScalar(PromQL.cpuCores),
      this.prometheus.queryScalar(PromQL.load1),
      this.prometheus.queryScalar(PromQL.load5),
      this.prometheus.queryScalar(PromQL.load15),
      this.prometheus.queryScalar(PromQL.memoryTotal),
      this.prometheus.queryScalar(PromQL.memoryAvailable),
      this.prometheus.queryScalar(PromQL.diskSizeRoot),
      this.prometheus.queryScalar(PromQL.diskAvailRoot),
      this.prometheus.queryScalar(PromQL.networkReceiveBps),
      this.prometheus.queryScalar(PromQL.networkTransmitBps),
      this.prometheus.queryScalar(PromQL.uptimeSeconds),
      this.prometheus.queryScalar(PromQL.bootTimeSeconds),
    ]);

    const memUsed =
      memTotal !== null && memAvail !== null ? Math.max(0, memTotal - memAvail) : null;
    const diskUsed =
      diskTotal !== null && diskAvail !== null ? Math.max(0, diskTotal - diskAvail) : null;

    const bootTime =
      boot !== null && Number.isFinite(boot) ? new Date(boot * 1000).toISOString() : null;

    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usagePercent: round(cpuUsage, 1),
        cores: cores !== null ? Math.round(cores) : null,
        load1: round(load1, 2),
        load5: round(load5, 2),
        load15: round(load15, 2),
      },
      memory: {
        usedBytes: memUsed !== null ? Math.round(memUsed) : null,
        totalBytes: memTotal !== null ? Math.round(memTotal) : null,
        availableBytes: memAvail !== null ? Math.round(memAvail) : null,
        usagePercent: percentOrNull(memUsed, memTotal),
      },
      disk: {
        usedBytes: diskUsed !== null ? Math.round(diskUsed) : null,
        totalBytes: diskTotal !== null ? Math.round(diskTotal) : null,
        availableBytes: diskAvail !== null ? Math.round(diskAvail) : null,
        usagePercent: percentOrNull(diskUsed, diskTotal),
      },
      network: {
        rxBytesPerSecond: round(rx, 2),
        txBytesPerSecond: round(tx, 2),
      },
      uptime: {
        seconds: uptime !== null ? Math.round(uptime) : null,
        bootTime,
      },
    };
  }

  async getSystemInfo(): Promise<SystemInfo> {
    if (!this.prometheus.isConfigured()) {
      throw new AppError(
        ErrorCodes.METRICS_UNAVAILABLE,
        'Prometheus não configurado (PROMETHEUS_URL)',
        503,
      );
    }

    const [unameSamples, osSamples, load1, load5, load15] = await Promise.all([
      this.prometheus.queryVector(PromQL.unameInfo),
      this.prometheus.queryVector(PromQL.osInfo),
      this.prometheus.queryScalar(PromQL.load1),
      this.prometheus.queryScalar(PromQL.load5),
      this.prometheus.queryScalar(PromQL.load15),
    ]);

    const uname = unameSamples[0]?.metric ?? {};
    const os = osSamples[0]?.metric ?? {};

    const nodename = uname.nodename?.trim() || '';
    // Prefer SYSTEM_HOSTNAME when node-exporter UTS namespace is the container (short docker id).
    const resolvedHostname =
      env.SYSTEM_HOSTNAME?.trim() ||
      (nodename && !looksLikeDockerShortId(nodename) ? nodename : '') ||
      nodename ||
      '--';

    const kernel = uname.release?.trim() || '--';
    const osLabel = os.pretty_name?.trim() || os.name?.trim() || uname.sysname?.trim() || '--';
    const primaryIp = env.SYSTEM_PRIMARY_IP?.trim() || '--';

    return {
      hostname: resolvedHostname,
      os: osLabel,
      kernel,
      primaryIp,
      loadAverage: [round(load1, 2), round(load5, 2), round(load15, 2)],
      updatedAt: formatDateTimePt(),
    };
  }
}
