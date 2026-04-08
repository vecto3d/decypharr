import type {
  Torrent,
  Config,
  RepairJob,
  SystemStats,
  AddTorrentResponse,
  ArrConfig,
  VersionInfo,
} from "./types";
import {
  mockTorrents,
  mockConfig,
  mockRepairJobs,
  mockStats,
  mockArrs,
  mockVersion,
} from "./mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO === "true";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
      const body = await res.clone().json().catch(() => null);
      if (body?.error?.includes("setup required")) {
        window.location.href = "/register";
      } else {
        window.location.href = "/login";
      }
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

const realApi = {
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
      body: new URLSearchParams({ username, password, confirmPassword: password }),
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
      body: JSON.stringify({ username, password, confirm_password: password }),
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

const demoApi: typeof realApi = {
  login: async () => "Ok.",
  register: async () => {},
  skipAuth: async () => {},
  getTorrents: async () => mockTorrents,
  deleteTorrent: async () => {},
  deleteTorrents: async () => {},
  addTorrents: async () => ({ results: [], errors: [] }),
  getConfig: async () => mockConfig,
  saveConfig: async () => {},
  updateAuth: async () => {},
  refreshToken: async () => ({ token: "demo-token-xxxxxxxxxxxx" }),
  getRepairJobs: async () => mockRepairJobs,
  createRepairJob: async () => mockRepairJobs[0],
  processRepairJob: async () => {},
  stopRepairJob: async () => {},
  deleteRepairJobs: async () => {},
  getArrs: async () => mockArrs,
  getStats: async () => mockStats,
  getVersion: async () => mockVersion,
};

export const api = DEMO_MODE ? demoApi : realApi;
