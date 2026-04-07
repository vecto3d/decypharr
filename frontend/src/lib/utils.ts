export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes >= 1099511627776) return (bytes / 1099511627776).toFixed(2) + " TB";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
}

export function formatSpeed(speed: number): string {
  if (!speed || speed <= 0) return "\u2014";
  if (speed >= 1073741824) return (speed / 1073741824).toFixed(1) + " GB/s";
  if (speed >= 1048576) return (speed / 1048576).toFixed(1) + " MB/s";
  if (speed >= 1024) return (speed / 1024).toFixed(0) + " KB/s";
  return "\u2014";
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "\u2014";
  if (seconds > 86400) return Math.floor(seconds / 86400) + "d " + Math.floor((seconds % 86400) / 3600) + "h";
  if (seconds > 3600) return Math.floor(seconds / 3600) + "h " + Math.floor((seconds % 3600) / 60) + "m";
  if (seconds > 60) return Math.floor(seconds / 60) + "m " + Math.floor(seconds % 60) + "s";
  return Math.floor(seconds) + "s";
}

export function eta(current: number, total: number, speed: number): string {
  if (!speed || speed <= 0 || current >= total) return "\u2014";
  return formatDuration((total - current) / speed);
}

export function getStateColor(state: string): string {
  switch (state) {
    case "downloading":
      return "blue";
    case "pausedUP":
    case "completed":
      return "green";
    case "error":
      return "red";
    case "stalledDL":
    case "stalled":
      return "yellow";
    case "queuedDL":
    case "queued":
      return "grape";
    case "streaming":
      return "orange";
    default:
      return "gray";
  }
}

// Map torrent state to simplified status
export type TorrentStatus = "downloading" | "streaming" | "local";

export function mapStatus(state: string, progress: number): TorrentStatus {
  if (state === "downloading" || state === "stalledDL" || state === "metaDL" || state === "queuedDL") return "downloading";
  if (progress >= 1 || state === "pausedUP" || state === "uploading") return "local";
  return "streaming";
}

export function getStatusColor(status: TorrentStatus): string {
  switch (status) {
    case "downloading": return "blue";
    case "streaming": return "orange";
    case "local": return "green";
  }
}

export function getTypeFromCategory(category: string): "movie" | "tv" {
  const c = category.toLowerCase();
  if (c.includes("movie") || c.includes("radarr") || c.includes("film")) return "movie";
  return "tv";
}

export function getStateLabel(state: string): string {
  switch (state) {
    case "downloading":
      return "Downloading";
    case "pausedUP":
      return "Completed";
    case "error":
      return "Error";
    case "stalledDL":
      return "Stalled";
    case "queuedDL":
      return "Queued";
    case "metaDL":
      return "Metadata";
    case "uploading":
      return "Seeding";
    default:
      return state;
  }
}
