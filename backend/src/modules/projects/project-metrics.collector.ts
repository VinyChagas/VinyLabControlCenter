import { query } from '../../db/pool.js';
import type { AggregatedContainerMetrics } from '../metrics/metrics.types.js';
import type { ContainerMetricsService } from '../metrics/container-metrics.service.js';
import { logger } from '../../utils/logger.js';

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  monitoring_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectResourceRow {
  id: string;
  project_id: string;
  resource_type: string;
  resource_identifier: string;
  created_at: Date;
}

export class ProjectMetricsCollector {
  constructor(private readonly containers: ContainerMetricsService) {}

  async collect(): Promise<void> {
    const projects = await query<ProjectRow>(
      `SELECT id, name, slug, description, status, monitoring_enabled, created_at, updated_at
       FROM projects
       WHERE monitoring_enabled = true`,
    );

    for (const project of projects.rows) {
      try {
        await this.collectProject(project);
      } catch (error) {
        logger.warn(
          {
            projectId: project.id,
            slug: project.slug,
            message: error instanceof Error ? error.message : 'unknown',
          },
          'project metrics collect failed',
        );
      }
    }
  }

  private async collectProject(project: ProjectRow): Promise<void> {
    const resources = await query<ProjectResourceRow>(
      `SELECT id, project_id, resource_type, resource_identifier, created_at
       FROM project_resources
       WHERE project_id = $1 AND resource_type = 'docker_container'`,
      [project.id],
    );

    const names = resources.rows.map((r) => r.resource_identifier);
    const aggregated =
      names.length > 0
        ? await this.containers.aggregate(names, { essentialNames: names })
        : emptyAggregate();

    await query(
      `INSERT INTO project_metrics (
        project_id, recorded_at, cpu_usage_percent, memory_usage_bytes,
        network_rx_bps, network_tx_bps, status
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6)`,
      [
        project.id,
        aggregated.cpuUsagePercent,
        aggregated.memoryUsageBytes,
        aggregated.networkRxBps,
        aggregated.networkTxBps,
        aggregated.status,
      ],
    );
  }
}

function emptyAggregate(): AggregatedContainerMetrics {
  return {
    status: 'offline',
    cpuUsagePercent: null,
    memoryUsageBytes: null,
    networkRxBps: null,
    networkTxBps: null,
    uptimeSeconds: null,
    startTime: null,
    containers: [],
  };
}
