-- Host metrics history persisted by MetricsCollector (Prometheus → PostgreSQL)

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ NOT NULL,
  cpu_usage_percent DOUBLE PRECISION,
  cpu_cores INTEGER,
  load_1 DOUBLE PRECISION,
  load_5 DOUBLE PRECISION,
  load_15 DOUBLE PRECISION,
  memory_used_bytes BIGINT,
  memory_total_bytes BIGINT,
  memory_usage_percent DOUBLE PRECISION,
  disk_used_bytes BIGINT,
  disk_total_bytes BIGINT,
  disk_usage_percent DOUBLE PRECISION,
  network_rx_bps DOUBLE PRECISION,
  network_tx_bps DOUBLE PRECISION,
  uptime_seconds BIGINT,
  boot_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_metrics_recorded_at_idx ON system_metrics (recorded_at DESC);
