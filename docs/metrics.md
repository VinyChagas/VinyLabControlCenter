# Métricas — VinyLab Control Center

## Arquitetura atual

```
Node Exporter ──┐
                ├──► Prometheus ──► MetricsService (backend)
cAdvisor ───────┘         │              ├── realtime (API)
                          │              └── MetricsCollector (60s) ──► PostgreSQL
                          │
Frontend ──► Backend API only (nunca consulta Prometheus diretamente)
```

## Variáveis

| Variável | Exemplo VPS | Notas |
|---|---|---|
| `PROMETHEUS_URL` | `http://prometheus:9090` | Rede Docker `monitoring` |
| `PROMETHEUS_TIMEOUT_MS` | `5000` | Timeout por query |
| `METRICS_COLLECTION_INTERVAL_SECONDS` | `60` | Persistência no Postgres |
| `SYSTEM_HOSTNAME` | `vinylab` | Opcional (node-exporter pode reportar hostname do container) |
| `SYSTEM_PRIMARY_IP` | IP público | Opcional (não há métrica de IP no Node Exporter atual) |

## Rede Docker

O backend precisa estar na rede externa `monitoring` além de `vinylab_internal`, para resolver o hostname `prometheus`.

## Descoberta futura por labels Docker

Hoje os recursos monitorados vêm de:

1. `SERVICE_REGISTRY` (serviços da Dashboard)
2. Tabela `project_resources` (métricas por projeto)

**Não** há acesso a `/var/run/docker.sock` nesta fase.

No futuro, um job de descoberta poderá:

1. Ler labels via API Docker **ou** via labels já expostas pelo cAdvisor no Prometheus
2. Mapear containers com:
   - `vinylab.project=<slug>`
   - `vinylab.monitor=true`
3. Sincronizar `project_resources` (upsert idempotente)

Até lá, o cadastro é explícito (seed + registry).

## Retenção / downsampling (futuro — NÃO implementado)

Histórico completo é mantido nesta fase. Plano sugerido:

| Faixa | Resolução |
|---|---|
| 0–7 dias | 1 minuto |
| 7–30 dias | 5 minutos |
| 30+ dias | agregados (média/max) |

## Hermes

Na auditoria da VPS (2026-09-03) **não havia container Hermes**. O serviço aparece na tabela como Offline até existir um container real mapeado no registry.
