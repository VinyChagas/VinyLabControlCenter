-- Projects + resource mapping + project metrics history
-- Future discovery via Docker labels (vinylab.project / vinylab.monitor) is documented
-- in docs/metrics.md — this migration only uses explicit project_resources rows.

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
CREATE INDEX IF NOT EXISTS projects_monitoring_enabled_idx
  ON projects (monitoring_enabled)
  WHERE monitoring_enabled = true;

CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  resource_type VARCHAR(64) NOT NULL,
  resource_identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_resources_unique UNIQUE (project_id, resource_type, resource_identifier),
  CONSTRAINT project_resources_type_check CHECK (
    resource_type IN ('docker_container', 'database', 'domain', 'api', 'service')
  )
);

CREATE INDEX IF NOT EXISTS project_resources_project_id_idx ON project_resources (project_id);

CREATE TABLE IF NOT EXISTS project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  cpu_usage_percent DOUBLE PRECISION,
  memory_usage_bytes BIGINT,
  network_rx_bps DOUBLE PRECISION,
  network_tx_bps DOUBLE PRECISION,
  status VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_metrics_project_recorded_idx
  ON project_metrics (project_id, recorded_at DESC);

-- Idempotent seed: Control Center as first monitored project
INSERT INTO projects (name, slug, description, status, monitoring_enabled)
VALUES (
  'Control Center',
  'control-center',
  'Painel de controle VinyLab (frontend + backend)',
  'active',
  true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_resources (project_id, resource_type, resource_identifier)
SELECT p.id, 'docker_container', r.resource_identifier
FROM projects p
CROSS JOIN (
  VALUES
    ('vinylab-control-frontend'),
    ('vinylab-control-backend')
) AS r(resource_identifier)
WHERE p.slug = 'control-center'
ON CONFLICT (project_id, resource_type, resource_identifier) DO NOTHING;
