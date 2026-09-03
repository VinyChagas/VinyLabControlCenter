export function round(value: number | null | undefined, digits = 2): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function bytesToLabel(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '--';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${Math.round(bytes)} B`;
  if (abs < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (abs < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '--';
  }
  const totalHours = Math.floor(seconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  if (totalHours > 0) return `${totalHours}h ${mins}m`;
  return `${mins}m`;
}

export function formatBootDate(isoOrNull: string | null | undefined): string {
  if (!isoOrNull) return '--';
  const date = new Date(isoOrNull);
  if (Number.isNaN(date.getTime())) return '--';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTimePt(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/** Throughput: prefer Mbps when >= 0.1 Mbps, else KB/s / B/s. */
export function formatNetworkRate(bytesPerSecond: number | null | undefined): string {
  if (bytesPerSecond === null || bytesPerSecond === undefined || !Number.isFinite(bytesPerSecond)) {
    return '--';
  }
  const bitsPerSecond = bytesPerSecond * 8;
  const mbps = bitsPerSecond / 1_000_000;
  if (Math.abs(mbps) >= 0.1) return `${mbps.toFixed(1)} Mbps`;
  const kbps = bytesPerSecond / 1024;
  if (Math.abs(kbps) >= 1) return `${kbps.toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
}

export function percentOrNull(used: number | null, total: number | null): number | null {
  if (used === null || total === null || total <= 0) return null;
  return round((used / total) * 100, 1);
}
