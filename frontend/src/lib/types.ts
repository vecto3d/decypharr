// Torrent types
export interface Torrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  category: string;
  debrid: string;
  num_seeds: number;
  state: string;
  added_on: number;
  id: string;
}

// Config types
export interface DebridDirectory {
  filters: Record<string, string>;
}

export interface DebridConfig {
  name: string;
  api_key: string;
  download_api_keys: string[];
  folder: string;
  use_webdav: boolean;
  directories: Record<string, DebridDirectory>;
  rate_limit: string;
}

export interface ArrConfig {
  name: string;
  host: string;
  token: string;
  enabled: boolean;
}

export interface QBitConfig {
  username: string;
  password: string;
  download_folder: string;
  categories: string[];
  refresh_interval: number;
  max_downloads: number;
  skip_pre_cache: boolean;
  always_rm_tracker_urls: boolean;
}

export interface RepairConfig {
  enabled: boolean;
  interval: string;
  zurg_url: string;
  auto_process: boolean;
  use_webdav: boolean;
  workers: number;
  re_insert: boolean;
  strategy: string;
}

export interface RcloneConfig {
  enabled: boolean;
  mount_path: string;
  rc_port: string;
  cache_dir: string;
  transfers: number;
  vfs_cache_mode: string;
  vfs_cache_max_size: string;
  log_level: string;
  bandwidth_limit: string;
  mount_per_provider: boolean;
}

export interface WebDavConfig {
  enabled: boolean;
  port: string;
}

export interface Config {
  log_level: string;
  url_base: string;
  bind_address: string;
  port: string;
  use_auth: boolean;
  min_file_size: string;
  max_file_size: string;
  remove_stalled_after: string;
  allowed_ext: string[];
  discord_webhook: string;
  callback_url: string;
  qbittorrent: QBitConfig;
  debrids: DebridConfig[];
  arrs: ArrConfig[];
  repair: RepairConfig;
  rclone: RcloneConfig;
  webdav: WebDavConfig;
}

// Repair types
export interface BrokenItem {
  path: string;
  type: string;
  size: number;
  arr: string;
}

export interface RepairJob {
  id: string;
  status: string;
  created_at: string;
  completed_at: string;
  arrs: string[];
  media_ids: string[];
  auto_process: boolean;
  broken_items: Record<string, BrokenItem[]>;
  error: string;
}

// Stats types
export interface DebridProfile {
  name: string;
  username: string;
  points: number;
  type: string;
  expiration: string;
}

export interface DebridAccount {
  order: number;
  username: string;
  token_masked: string;
  disabled: boolean;
  in_use: boolean;
  traffic_used: number;
  links_count: number;
}

export interface DebridLibrary {
  total: number;
  bad: number;
  active_links: number;
}

export interface DebridStats {
  profile: DebridProfile;
  library: DebridLibrary;
  accounts: DebridAccount[];
}

export interface RcloneTransfer {
  name: string;
  bytes: number;
  size: number;
  speed: number;
  eta: number;
}

export interface RcloneMount {
  config_name: string;
  provider: string;
  local_path: string;
  mounted: boolean;
  mounted_at: string;
}

export interface RcloneStats {
  enabled: boolean;
  server_ready: boolean;
  version: { version: string; os: string; arch: string };
  core: {
    bytes: number;
    speed: number;
    transfers: number;
    errors: number;
    checks: number;
    totalChecks: number;
    elapsedTime: number;
    transferTime: number;
    transferring: RcloneTransfer[];
  };
  memory: { Sys: number; TotalAlloc: number };
  mounts: Record<string, RcloneMount>;
  bandwidth: { rate: string; bytesPerSecond: number };
}

export interface SystemStats {
  memory_used: string;
  heap_alloc_mb: string;
  goroutines: number;
  gc_cycles: number;
  num_cpu: number;
  arch: string;
  os: string;
  go_version: string;
  debrids: DebridStats[];
  rclone: RcloneStats;
}

// Add torrent response
export interface AddTorrentResult {
  magnet: string;
  debrid: string;
  action: string;
  download_folder: string;
}

export interface AddTorrentResponse {
  results: AddTorrentResult[];
  errors: string[];
}

// Version
export interface VersionInfo {
  version: string;
  channel: string;
  commit: string;
}
