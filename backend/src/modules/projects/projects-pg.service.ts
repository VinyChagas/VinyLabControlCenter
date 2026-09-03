import { query } from '../../db/pool.js';
import {
  HISTORY_MAX_POINTS,
  HISTORY_RANGE_MS,
  type MetricsHistoryRange,
} from '../metrics/metrics.types.js';
import { downsample } from '../metrics/system-metrics.repository.js';
import type { AggregatedContainerMetrics } from '../metrics/metrics.types.js';
import type { ContainerMetricsService } from '../metrics/container-metrics.service.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';

export interface ProjectDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  monitoringEnabled: boolean;
  resources: Array<{
    id: string;
    resourceType: string;
    resourceIdentifier: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetricsSummary {
  projectId: string;
  timestamp: string;
  status: string;
  cpuUsagePercent: number | null;
  memoryUsageBytes: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
  containers: AggregatedContainerMetrics['containers'];
}

export interface ProjectHistoryPoint {
  timestamp: string;
  cpu: number | null;
  memoryBytes: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
  status: string | null;
}

export class ProjectsPgService {
  constructor(private readonly containers: ContainerMetricsService) {}

  async list(): Promise<ProjectDto[]> {
    const projects = await query<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      status: 'active' | 'inactive' | 'archived';
      monitoring_enabled: boolean;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT * FROM projects ORDER BY name ASC`);

    const resources = await query<{
      id: string;
      project_id: string;
      resource_type: string;
      resource_identifier: string;
    }>(`SELECT id, project_id, resource_type, resource_identifier FROM project_resources`);

    const byProject = new Map<string, ProjectDto['resources']>();
    for (const row of resources.rows) {
      const list = byProject.get(row.project_id) ?? [];
      list.push({
        id: row.id,
        resourceType: row.resource_type,
        resourceIdentifier: row.resource_identifier,
      });
      byProject.set(row.project_id, list);
    }

    return projects.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      status: p.status,
      monitoringEnabled: p.monitoring_enabled,
      resources: byProject.get(p.id) ?? [],
      createdAt: p.created_at.toISOString(),
      updatedAt: p.updated_at.toISOString(),
    }));
  }

  async getById(id: string): Promise<ProjectDto> {
    const projects = await this.list();
    const project = projects.find((p) => p.id === id || p.slug === id);
    if (!project) throw new AppError(ErrorCodes.NOT_FOUND, `Project '${id}' not found`, 404);
    return project;
  }

  async getMetricsSummary(id: string): Promise<ProjectMetricsSummary> {
    const project = await this.getById(id);
    const containerNames = project.resources
      .filter((r) => r.resourceType === 'docker_container')
      .map((r) => r.resourceIdentifier);

    const aggregated =
      containerNames.length > 0
        ? await this.containers.aggregate(containerNames, { essentialNames: containerNames })
        : {
            status: 'offline' as const,
            cpuUsagePercent: null,
            memoryUsageBytes: null,
            networkRxBps: null,
            networkTxBps: null,
            uptimeSeconds: null,
            startTime: null,
            containers: [],
          };

    return {
      projectId: project.id,
      timestamp: new Date().toISOString(),
      status: aggregated.status,
      cpuUsagePercent: aggregated.cpuUsagePercent,
      memoryUsageBytes: aggregated.memoryUsageBytes,
      networkRxBps: aggregated.networkRxBps,
      networkTxBps: aggregated.networkTxBps,
      containers: aggregated.containers,
    };
  }

  async getMetricsHistory(id: string, range: MetricsHistoryRange) {
    const project = await this.getById(id);
    const since = new Date(Date.now() - HISTORY_RANGE_MS[range]);
    const result = await query<{
      recorded_at: Date;
      cpu_usage_percent: number | null;
      memory_usage_bytes: number | null;
      network_rx_bps: number | null;
      network_tx_bps: number | null;
      status: string | null;
    }>(
      `SELECT recorded_at, cpu_usage_percent, memory_usage_bytes,
              network_rx_bps, network_tx_bps, status
       FROM project_metrics
       WHERE project_id = $1 AND recorded_at >= $2
       ORDER BY recorded_at ASC`,
      [project.id, since],
    );

    const points = downsample(
      result.rows.map(
        (row): ProjectHistoryPoint => ({
          timestamp: row.recorded_at.toISOString(),
          cpu: row.cpu_usage_percent,
          // pg returns BIGINT as string by default — coerce safely for JSON APIs
          memoryBytes: toFiniteNumber(row.memory_usage_bytes),
          networkRxBps: toFiniteNumber(row.network_rx_bps),
          networkTxBps: toFiniteNumber(row.network_tx_bps),
          status: row.status,
        }),
      ),
      HISTORY_MAX_POINTS[range],
    );

    return { range, points };
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
