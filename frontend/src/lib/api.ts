import type {
  Torrent,
  Config,
  RepairJob,
  SystemStats,
  AddTorrentResponse,
  ArrConfig,
  VersionInfo,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res.text() as unknown as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<string>("/api/v2/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    }),

  register: (username: string, password: string) =>
    request<void>("/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    }),

  skipAuth: () =>
    request<void>("/skip-auth", { method: "POST" }),

  // Torrents
  getTorrents: () => request<Torrent[]>("/api/torrents"),

  deleteTorrent: (hash: string, category: string, removeFromDebrid = false) =>
    request<void>(`/api/torrents/${category}/${hash}${removeFromDebrid ? "?removeFromDebrid=true" : ""}`, {
      method: "DELETE",
    }),

  deleteTorrents: (hashes: string[], removeFromDebrid = false) =>
    request<void>(`/api/torrents?hashes=${hashes.join(",")}&removeFromDebrid=${removeFromDebrid}`, {
      method: "DELETE",
    }),

  // Add torrents
  addTorrents: (formData: FormData) =>
    request<AddTorrentResponse>("/api/add", {
      method: "POST",
      body: formData,
    }),

  // Config
  getConfig: () => request<Config>("/api/config"),

  saveConfig: (config: Config) =>
    request<void>("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),

  updateAuth: (username: string, password: string) =>
    request<void>("/api/update-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  refreshToken: () =>
    request<{ token: string }>("/api/refresh-token", { method: "POST" }),

  // Repair
  getRepairJobs: () => request<RepairJob[]>("/api/repair/jobs"),

  createRepairJob: (data: { arr: string; mediaIds?: string[]; async: boolean; autoProcess: boolean }) =>
    request<RepairJob>("/api/repair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  processRepairJob: (id: string) =>
    request<void>(`/api/repair/jobs/${id}/process`, { method: "POST" }),

  stopRepairJob: (id: string) =>
    request<void>(`/api/repair/jobs/${id}/stop`, { method: "POST" }),

  deleteRepairJobs: (ids: string[]) =>
    request<void>("/api/repair/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }),

  // Arrs
  getArrs: () => request<ArrConfig[]>("/api/arrs"),

  // Stats
  getStats: () => request<SystemStats>("/debug/stats"),

  // Version
  getVersion: () => request<VersionInfo>("/version"),
};
