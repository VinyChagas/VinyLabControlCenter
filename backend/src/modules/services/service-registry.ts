/**
 * Logical services shown on the Dashboard "Serviços" table.
 * Container names discovered from the current VPS (cAdvisor / docker ps).
 * Hermes is listed but has no container in this environment yet.
 */
export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  port: number;
  /** Docker container names (cAdvisor label `name`). */
  containers: string[];
  /** Must all be available for status Online. Defaults to `containers`. */
  essentialContainers?: string[];
}

export const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    id: 'control-center',
    name: 'Control Center',
    description: 'Painel de controle',
    port: 8080,
    containers: ['vinylab-control-frontend', 'vinylab-control-backend'],
    essentialContainers: ['vinylab-control-frontend', 'vinylab-control-backend'],
  },
  {
    id: 'hermes',
    name: 'Hermes',
    description: 'Agente de IA',
    port: 3000,
    // Não inventar nome: Hermes ainda não está implantado nesta VPS.
    containers: [],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de fluxos',
    port: 5678,
    containers: ['vinylab-n8n'],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Banco de dados',
    port: 5432,
    containers: ['vinylab-postgres'],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Monitoramento',
    port: 3000,
    containers: ['grafana'],
  },
  {
    id: 'caddy',
    name: 'Caddy',
    description: 'Proxy/Reverse',
    port: 443,
    containers: ['vinylab-caddy'],
  },
];

export function getServiceDefinition(id: string): ServiceDefinition | undefined {
  return SERVICE_REGISTRY.find((s) => s.id === id);
}

export function allTrackedContainerNames(): string[] {
  const names = new Set<string>();
  for (const service of SERVICE_REGISTRY) {
    for (const name of service.containers) names.add(name);
  }
  return [...names];
}
