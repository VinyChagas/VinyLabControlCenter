/** PromQL helpers — Node Exporter + cAdvisor via Prometheus */

const PSEUDO_FS = 'tmpfs|overlay|squashfs|proc|sysfs|nsfs|cgroup|cgroup2|devtmpfs|devpts|mqueue|rpc_pipefs';
const IGNORE_IFACES = 'lo|docker.*|veth.*|br-.*';

export const PromQL = {
  // --- Host (node-exporter) ---
  cpuUsagePercent: `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)`,
  cpuCores: `count(count(node_cpu_seconds_total) by (cpu))`,
  load1: `node_load1`,
  load5: `node_load5`,
  load15: `node_load15`,

  memoryTotal: `node_memory_MemTotal_bytes`,
  memoryAvailable: `node_memory_MemAvailable_bytes`,

  diskSizeRoot: `node_filesystem_size_bytes{mountpoint="/",fstype!~"${PSEUDO_FS}"}`,
  diskAvailRoot: `node_filesystem_avail_bytes{mountpoint="/",fstype!~"${PSEUDO_FS}"}`,

  networkReceiveBps: `sum(rate(node_network_receive_bytes_total{device!~"${IGNORE_IFACES}"}[1m]))`,
  networkTransmitBps: `sum(rate(node_network_transmit_bytes_total{device!~"${IGNORE_IFACES}"}[1m]))`,

  uptimeSeconds: `node_time_seconds - node_boot_time_seconds`,
  bootTimeSeconds: `node_boot_time_seconds`,

  unameInfo: `node_uname_info`,
  osInfo: `node_os_info`,

  // --- Containers (cAdvisor) ---
  containerCpuCoresUsed: (namesRegex: string) =>
    `sum by (name) (rate(container_cpu_usage_seconds_total{name=~"${namesRegex}"}[1m]))`,

  containerMemoryBytes: (namesRegex: string) =>
    `sum by (name) (container_memory_working_set_bytes{name=~"${namesRegex}"})`,

  containerNetworkRxBps: (namesRegex: string) =>
    `sum by (name) (rate(container_network_receive_bytes_total{name=~"${namesRegex}"}[1m]))`,

  containerNetworkTxBps: (namesRegex: string) =>
    `sum by (name) (rate(container_network_transmit_bytes_total{name=~"${namesRegex}"}[1m]))`,

  containerStartTime: (namesRegex: string) =>
    `container_start_time_seconds{name=~"${namesRegex}"}`,

  containerLastSeen: (namesRegex: string) =>
    `container_last_seen{name=~"${namesRegex}"}`,
} as const;

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function namesToRegex(names: string[]): string {
  if (names.length === 0) return '^$';
  return `^(${names.map(escapeRegex).join('|')})$`;
}
