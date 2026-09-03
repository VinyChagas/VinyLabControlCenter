import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface PrometheusVectorSample {
  metric: Record<string, string>;
  value: [number, string];
}

export interface PrometheusQueryResult {
  resultType: 'vector' | 'matrix' | 'scalar' | 'string';
  result: PrometheusVectorSample[];
}

interface PrometheusApiResponse {
  status: 'success' | 'error';
  data?: PrometheusQueryResult;
  errorType?: string;
  error?: string;
}

export class PrometheusClient {
  constructor(
    private readonly baseUrl: string | undefined = env.PROMETHEUS_URL,
    private readonly timeoutMs: number = env.PROMETHEUS_TIMEOUT_MS,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async query(promql: string): Promise<PrometheusQueryResult> {
    if (!this.baseUrl) {
      throw new AppError(
        ErrorCodes.METRICS_UNAVAILABLE,
        'Prometheus não configurado (PROMETHEUS_URL)',
        503,
      );
    }

    const url = new URL('/api/v1/query', this.baseUrl);
    url.searchParams.set('query', promql);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError(
          ErrorCodes.METRICS_UNAVAILABLE,
          'Falha ao consultar Prometheus',
          503,
        );
      }

      const body = (await response.json()) as PrometheusApiResponse;
      if (body.status !== 'success' || !body.data) {
        logger.warn({ errorType: body.errorType }, 'prometheus query returned error');
        throw new AppError(
          ErrorCodes.METRICS_UNAVAILABLE,
          'Prometheus retornou erro na consulta',
          503,
        );
      }

      return body.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const aborted =
        error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'));
      logger.warn(
        { aborted, message: error instanceof Error ? error.message : 'unknown' },
        'prometheus query failed',
      );
      throw new AppError(
        ErrorCodes.METRICS_UNAVAILABLE,
        aborted ? 'Timeout ao consultar Prometheus' : 'Prometheus indisponível',
        503,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async queryScalar(promql: string): Promise<number | null> {
    const data = await this.query(promql);
    const first = data.result[0];
    if (!first) return null;
    const parsed = Number(first.value[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async queryVector(promql: string): Promise<PrometheusVectorSample[]> {
    const data = await this.query(promql);
    return data.result;
  }
}
