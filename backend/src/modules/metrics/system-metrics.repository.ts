import { query } from '../../db/pool.js';
import type { SystemHistoryPoint, SystemMetricsSummary, MetricsHistoryRange } from './metrics.types.js';
import { HISTORY_MAX_POINTS, HISTORY_RANGE_MS } from './metrics.types.js';

export interface SystemMetricsRow {
  recorded_at: Date;
  cpu_usage_percent: number | null;
  memory_usage_percent: number | null;
  disk_usage_percent: number | null;
}

export class SystemMetricsRepository {
  async insertSummary(summary: SystemMetricsSummary): Promise<void> {
    await query(
      `INSERT INTO system_metrics (
        recorded_at,
        cpu_usage_percent, cpu_cores, load_1, load_5, load_15,
        memory_used_bytes, memory_total_bytes, memory_usage_percent,
        disk_used_bytes, disk_total_bytes, disk_usage_percent,
        network_rx_bps, network_tx_bps,
        uptime_seconds, boot_time
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )`,
      [
        new Date(summary.timestamp),
        summary.cpu.usagePercent,
        summary.cpu.cores,
        summary.cpu.load1,
        summary.cpu.load5,
        summary.cpu.load15,
        summary.memory.usedBytes,
        summary.memory.totalBytes,
        summary.memory.usagePercent,
        summary.disk.usedBytes,
        summary.disk.totalBytes,
        summary.disk.usagePercent,
        summary.network.rxBytesPerSecond,
        summary.network.txBytesPerSecond,
        summary.uptime.seconds,
        summary.uptime.bootTime ? new Date(summary.uptime.bootTime) : null,
      ],
    );
  }

  async getHistory(range: MetricsHistoryRange): Promise<SystemHistoryPoint[]> {
    const since = new Date(Date.now() - HISTORY_RANGE_MS[range]);
    const result = await query<SystemMetricsRow>(
      `SELECT recorded_at, cpu_usage_percent, memory_usage_percent, disk_usage_percent
       FROM system_metrics
       WHERE recorded_at >= $1
       ORDER BY recorded_at ASC`,
      [since],
    );

    return downsample(
      result.rows.map((row) => ({
        timestamp: row.recorded_at.toISOString(),
        cpu: row.cpu_usage_percent,
        memory: row.memory_usage_percent,
        disk: row.disk_usage_percent,
      })),
      HISTORY_MAX_POINTS[range],
    );
  }

  async getRecentSparkline(limit = 12): Promise<{
    cpu: number[];
    memory: number[];
    disk: number[];
    network: number[];
  }> {
    const result = await query<{
      cpu_usage_percent: number | null;
      memory_usage_percent: number | null;
      disk_usage_percent: number | null;
      network_rx_bps: number | null;
      network_tx_bps: number | null;
    }>(
      `SELECT cpu_usage_percent, memory_usage_percent, disk_usage_percent,
              network_rx_bps, network_tx_bps
       FROM system_metrics
       ORDER BY recorded_at DESC
       LIMIT $1`,
      [limit],
    );

    const rows = [...result.rows].reverse();
    return {
      cpu: rows.map((r) => r.cpu_usage_percent ?? 0),
      memory: rows.map((r) => r.memory_usage_percent ?? 0),
      disk: rows.map((r) => r.disk_usage_percent ?? 0),
      network: rows.map((r) => {
        const rx = r.network_rx_bps ?? 0;
        const tx = r.network_tx_bps ?? 0;
        return (rx + tx) / 1024;
      }),
    };
  }
}

/** Keep first/last and evenly spaced samples when over maxPoints. */
export function downsample<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints || maxPoints < 2) return points;
  const result: T[] = [];
  const lastIndex = points.length - 1;
  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round((i * lastIndex) / (maxPoints - 1));
    const point = points[index];
    if (point !== undefined) result.push(point);
  }
  return result;
}
