import { env } from '../../config/env.js';
import { hasDatabase } from '../../db/pool.js';
import { logger } from '../../utils/logger.js';
import type { MetricsService } from './metrics.service.js';
import type { SystemMetricsRepository } from './system-metrics.repository.js';
import type { ProjectMetricsCollector } from '../projects/project-metrics.collector.js';

/**
 * Periodic collector: Prometheus → MetricsService → PostgreSQL.
 * Does not block backend startup; recovers on next tick after failures.
 */
export class MetricsCollector {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private tickInFlight = false;
  private static activeInstance: MetricsCollector | null = null;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly systemRepo: SystemMetricsRepository,
    private readonly projectCollector: ProjectMetricsCollector | null,
    private readonly intervalSeconds: number = env.METRICS_COLLECTION_INTERVAL_SECONDS,
  ) {}

  start(): void {
    if (MetricsCollector.activeInstance && MetricsCollector.activeInstance !== this) {
      logger.warn('metrics collector already active in this process; skip duplicate start');
      return;
    }
    if (this.running) return;

    MetricsCollector.activeInstance = this;
    this.running = true;
    logger.info({ intervalSeconds: this.intervalSeconds }, 'metrics collector started');

    // Fire-and-forget first tick; failures must not crash the process.
    void this.safeTick();
    this.timer = setInterval(() => {
      void this.safeTick();
    }, this.intervalSeconds * 1000);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    if (MetricsCollector.activeInstance === this) {
      MetricsCollector.activeInstance = null;
    }
    logger.info('metrics collector stopped');
  }

  /** Exposed for tests. */
  async runOnce(): Promise<void> {
    await this.tick();
  }

  private async safeTick(): Promise<void> {
    try {
      await this.tick();
    } catch (error) {
      logger.warn(
        { message: error instanceof Error ? error.message : 'unknown' },
        'metrics collector tick failed',
      );
    }
  }

  private async tick(): Promise<void> {
    if (this.tickInFlight) return;
    this.tickInFlight = true;
    try {
      if (!hasDatabase()) {
        logger.warn('metrics collector skipped: DATABASE_URL not configured');
        return;
      }

      const summary = await this.metricsService.getSummary();
      await this.systemRepo.insertSummary(summary);

      if (this.projectCollector) {
        await this.projectCollector.collect();
      }
    } finally {
      this.tickInFlight = false;
    }
  }
}
