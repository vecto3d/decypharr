"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Paper,
  Group,
  Tabs,
  TextInput,
  Select,
  Checkbox,
  Button,
  PasswordInput,
  NumberInput,
  ActionIcon,
  Divider,
  Badge,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SolarSettings, SolarCloud, SolarServer, SolarRepair, SolarFolderOpen, SolarPlus, SolarTrash, SolarCopy, SolarRefresh, SolarSave } from "@/components/Icons";
import { api } from "@/lib/api";
import type { Config, DebridConfig, ArrConfig } from "@/lib/types";

const defaultDebrid: DebridConfig = {
  name: "",
  api_key: "",
  download_api_keys: [],
  folder: "",
  use_webdav: false,
  directories: {},
  rate_limit: "",
};

const defaultArr: ArrConfig = {
  name: "",
  host: "",
  token: "",
  enabled: true,
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    api.getConfig().then(setConfig).catch((e) => {
      notifications.show({ message: `Failed to load config: ${e}`, color: "red" });
    });
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.saveConfig(config);
      notifications.show({ message: "Configuration saved", color: "green" });
    } catch (e) {
      notifications.show({ message: `Save failed: ${e}`, color: "red" });
    } finally {
      setSaving(false);
    }
  };

  const refreshToken = async () => {
    try {
      const res = await api.refreshToken();
      setApiToken(res.token);
      notifications.show({ message: "Token refreshed", color: "green" });
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    }
  };

  const update = (path: string, value: unknown) => {
    if (!config) return;
    const clone = JSON.parse(JSON.stringify(config));
    const keys = path.split(".");
    let obj = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(clone);
  };

  if (!config) {
    return (
      <Box py={48} style={{ textAlign: "center" }}>
        <Text c="dimmed">Loading configuration...</Text>
      </Box>
    );
  }

  return (
    <>
      <Group mb={24} justify="space-between" align="flex-start">
        <Box>
          <Text size="lg" fw={600} c="dark.0" mb={2}>Settings</Text>
          <Text size="sm" c="dimmed">Configure Decypharr services and integrations</Text>
        </Box>
        <Button
          color="teal"
          leftSection={<SolarSave size={16} />}
          loading={saving}
          onClick={save}
        >
          Save Changes
        </Button>
      </Group>

      <Tabs defaultValue="general" styles={{ tab: { fontWeight: 500 } }}>
        <Paper
          mb={16}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Tabs.List px={16}>
            <Tabs.Tab value="general" leftSection={<SolarSettings size={14} />}>General</Tabs.Tab>
            <Tabs.Tab value="debrid" leftSection={<SolarCloud size={14} />}>Debrid</Tabs.Tab>
            <Tabs.Tab value="qbit" leftSection={<SolarServer size={14} />}>QBittorrent</Tabs.Tab>
            <Tabs.Tab value="arrs" leftSection={<SolarFolderOpen size={14} />}>Arrs</Tabs.Tab>
            <Tabs.Tab value="repair" leftSection={<SolarRepair size={14} />}>Repair</Tabs.Tab>
            <Tabs.Tab value="rclone" leftSection={<SolarFolderOpen size={14} />}>Rclone</Tabs.Tab>
          </Tabs.List>
        </Paper>

        {/* General Tab */}
        <Tabs.Panel value="general">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <SectionHeader icon={SolarSettings} color="blue" title="General Settings" />
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
              <Select
                label="Log Level"
                data={["trace", "debug", "info", "warn", "error"]}
                value={config.log_level}
                onChange={(v) => update("log_level", v || "info")}
                size="sm"
              />
              <TextInput label="URL Base" value={config.url_base} onChange={(e) => update("url_base", e.currentTarget.value)} size="sm" />
              <TextInput label="Bind Address" value={config.bind_address} onChange={(e) => update("bind_address", e.currentTarget.value)} size="sm" />
              <TextInput label="Port" value={config.port} onChange={(e) => update("port", e.currentTarget.value)} size="sm" />
              <TextInput label="Min File Size" value={config.min_file_size} onChange={(e) => update("min_file_size", e.currentTarget.value)} size="sm" />
              <TextInput label="Max File Size" value={config.max_file_size} onChange={(e) => update("max_file_size", e.currentTarget.value)} size="sm" />
              <TextInput label="Remove Stalled After" value={config.remove_stalled_after} onChange={(e) => update("remove_stalled_after", e.currentTarget.value)} size="sm" />
              <TextInput label="Discord Webhook" value={config.discord_webhook} onChange={(e) => update("discord_webhook", e.currentTarget.value)} size="sm" />
              <TextInput label="Callback URL" value={config.callback_url || ""} onChange={(e) => update("callback_url", e.currentTarget.value)} size="sm" />
            </Box>

            <Divider my={20} color="dark.6" />

            <Text size="sm" fw={600} c="dark.0" mb={8}>Allowed File Extensions</Text>
            <Textarea
              placeholder="mkv, mp4, avi (comma-separated)"
              value={config.allowed_ext?.join(", ") || ""}
              onChange={(e) => update("allowed_ext", e.currentTarget.value.split(",").map((s) => s.trim()).filter(Boolean))}
              size="sm"
              minRows={2}
            />

            <Divider my={20} color="dark.6" />

            <Text size="sm" fw={600} c="dark.0" mb={12}>Authentication</Text>
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
              <Checkbox
                label="Enable Authentication"
                checked={config.use_auth}
                onChange={(e) => update("use_auth", e.currentTarget.checked)}
              />
            </Box>
            {config.use_auth && (
              <Box mt={12}>
                <Group gap={8} align="flex-end">
                  <TextInput
                    label="API Token"
                    value={apiToken}
                    readOnly
                    style={{ flex: 1 }}
                    size="sm"
                    placeholder="Click refresh to generate"
                  />
                  <ActionIcon variant="light" color="teal" onClick={refreshToken} size="lg">
                    <SolarRefresh size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="lg"
                    onClick={() => {
                      if (apiToken) {
                        navigator.clipboard.writeText(apiToken);
                        notifications.show({ message: "Token copied", color: "teal" });
                      }
                    }}
                  >
                    <SolarCopy size={16} />
                  </ActionIcon>
                </Group>
              </Box>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Debrid Tab */}
        <Tabs.Panel value="debrid">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <Group justify="space-between" mb={16}>
              <SectionHeader icon={SolarCloud} color="grape" title="Debrid Services" />
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<SolarPlus size={14} />}
                onClick={() => update("debrids", [...(config.debrids || []), { ...defaultDebrid }])}
              >
                Add Service
              </Button>
            </Group>

            {config.debrids?.map((debrid, i) => (
              <Paper
                key={i}
                p={16}
                mb={12}
                style={{ background: "var(--mantine-color-dark-7)", border: "1px solid var(--mantine-color-dark-5)" }}
              >
                <Group justify="space-between" mb={12}>
                  <Badge variant="light" color="grape">{debrid.name || `Service ${i + 1}`}</Badge>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => update("debrids", config.debrids.filter((_, j) => j !== i))}
                  >
                    <SolarTrash size={14} />
                  </ActionIcon>
                </Group>
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <Select
                    label="Service"
                    data={["realdebrid", "torbox", "debridlink", "alldebrid"]}
                    value={debrid.name}
                    onChange={(v) => { const d = [...config.debrids]; d[i] = { ...d[i], name: v || "" }; update("debrids", d); }}
                    size="sm"
                  />
                  <PasswordInput
                    label="API Key"
                    value={debrid.api_key}
                    onChange={(e) => { const d = [...config.debrids]; d[i] = { ...d[i], api_key: e.currentTarget.value }; update("debrids", d); }}
                    size="sm"
                  />
                  <TextInput
                    label="Folder"
                    value={debrid.folder}
                    onChange={(e) => { const d = [...config.debrids]; d[i] = { ...d[i], folder: e.currentTarget.value }; update("debrids", d); }}
                    size="sm"
                  />
                  <TextInput
                    label="Rate Limit"
                    value={debrid.rate_limit}
                    onChange={(e) => { const d = [...config.debrids]; d[i] = { ...d[i], rate_limit: e.currentTarget.value }; update("debrids", d); }}
                    size="sm"
                  />
                </Box>
                <Textarea
                  label="Download API Keys"
                  placeholder="One per line"
                  mt={12}
                  value={debrid.download_api_keys?.join("\n") || ""}
                  onChange={(e) => {
                    const d = [...config.debrids];
                    d[i] = { ...d[i], download_api_keys: e.currentTarget.value.split("\n").filter(Boolean) };
                    update("debrids", d);
                  }}
                  size="sm"
                  minRows={2}
                />
              </Paper>
            ))}
          </Paper>
        </Tabs.Panel>

        {/* QBittorrent Tab */}
        <Tabs.Panel value="qbit">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <SectionHeader icon={SolarServer} color="blue" title="QBittorrent Settings" />
            <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
              <TextInput
                label="Username"
                value={config.qbittorrent.username}
                onChange={(e) => update("qbittorrent.username", e.currentTarget.value)}
                size="sm"
              />
              <PasswordInput
                label="Password"
                value={config.qbittorrent.password}
                onChange={(e) => update("qbittorrent.password", e.currentTarget.value)}
                size="sm"
              />
              <TextInput
                label="Download Folder"
                value={config.qbittorrent.download_folder}
                onChange={(e) => update("qbittorrent.download_folder", e.currentTarget.value)}
                size="sm"
              />
              <NumberInput
                label="Refresh Interval (s)"
                value={config.qbittorrent.refresh_interval}
                onChange={(v) => update("qbittorrent.refresh_interval", v)}
                size="sm"
                min={1}
              />
              <NumberInput
                label="Max Downloads"
                value={config.qbittorrent.max_downloads}
                onChange={(v) => update("qbittorrent.max_downloads", v)}
                size="sm"
                min={0}
              />
            </Box>
            <Group mt={16} gap="lg">
              <Checkbox
                label="Skip Pre-Cache"
                checked={config.qbittorrent.skip_pre_cache}
                onChange={(e) => update("qbittorrent.skip_pre_cache", e.currentTarget.checked)}
              />
              <Checkbox
                label="Always Remove Tracker URLs"
                checked={config.qbittorrent.always_rm_tracker_urls}
                onChange={(e) => update("qbittorrent.always_rm_tracker_urls", e.currentTarget.checked)}
              />
            </Group>

            <Divider my={20} color="dark.6" />
            <Text size="sm" fw={600} c="dark.0" mb={8}>Categories</Text>
            <Textarea
              placeholder="tv, movies, music (comma-separated)"
              value={config.qbittorrent.categories?.join(", ") || ""}
              onChange={(e) => update("qbittorrent.categories", e.currentTarget.value.split(",").map((s) => s.trim()).filter(Boolean))}
              size="sm"
              minRows={2}
            />
          </Paper>
        </Tabs.Panel>

        {/* Arrs Tab */}
        <Tabs.Panel value="arrs">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <Group justify="space-between" mb={16}>
              <SectionHeader icon={SolarFolderOpen} color="cyan" title="Arr Instances" />
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<SolarPlus size={14} />}
                onClick={() => update("arrs", [...(config.arrs || []), { ...defaultArr }])}
              >
                Add Arr
              </Button>
            </Group>

            {config.arrs?.map((arr, i) => (
              <Paper
                key={i}
                p={16}
                mb={12}
                style={{ background: "var(--mantine-color-dark-7)", border: "1px solid var(--mantine-color-dark-5)" }}
              >
                <Group justify="space-between" mb={12}>
                  <Badge variant="light" color="cyan">{arr.name || `Arr ${i + 1}`}</Badge>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => update("arrs", config.arrs.filter((_, j) => j !== i))}
                  >
                    <SolarTrash size={14} />
                  </ActionIcon>
                </Group>
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <TextInput
                    label="Name"
                    value={arr.name}
                    onChange={(e) => { const a = [...config.arrs]; a[i] = { ...a[i], name: e.currentTarget.value }; update("arrs", a); }}
                    size="sm"
                  />
                  <TextInput
                    label="Host"
                    value={arr.host}
                    onChange={(e) => { const a = [...config.arrs]; a[i] = { ...a[i], host: e.currentTarget.value }; update("arrs", a); }}
                    size="sm"
                  />
                  <PasswordInput
                    label="API Token"
                    value={arr.token}
                    onChange={(e) => { const a = [...config.arrs]; a[i] = { ...a[i], token: e.currentTarget.value }; update("arrs", a); }}
                    size="sm"
                  />
                  <Checkbox
                    label="Enabled"
                    checked={arr.enabled}
                    onChange={(e) => { const a = [...config.arrs]; a[i] = { ...a[i], enabled: e.currentTarget.checked }; update("arrs", a); }}
                    mt={24}
                  />
                </Box>
              </Paper>
            ))}
          </Paper>
        </Tabs.Panel>

        {/* Repair Tab */}
        <Tabs.Panel value="repair">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <SectionHeader icon={SolarRepair} color="orange" title="Repair Settings" />
            <Checkbox
              label="Enable Repair Worker"
              checked={config.repair.enabled}
              onChange={(e) => update("repair.enabled", e.currentTarget.checked)}
              mb={16}
            />
            {config.repair.enabled && (
              <>
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                  <TextInput
                    label="Interval"
                    value={config.repair.interval}
                    onChange={(e) => update("repair.interval", e.currentTarget.value)}
                    size="sm"
                  />
                  <NumberInput
                    label="Workers"
                    value={config.repair.workers}
                    onChange={(v) => update("repair.workers", v)}
                    size="sm"
                    min={1}
                  />
                  <Select
                    label="Strategy"
                    data={["per_file", "per_torrent"]}
                    value={config.repair.strategy}
                    onChange={(v) => update("repair.strategy", v || "per_torrent")}
                    size="sm"
                  />
                  <TextInput
                    label="Zurg URL"
                    value={config.repair.zurg_url}
                    onChange={(e) => update("repair.zurg_url", e.currentTarget.value)}
                    size="sm"
                  />
                </Box>
                <Group mt={16} gap="lg">
                  <Checkbox
                    label="Auto Process"
                    checked={config.repair.auto_process}
                    onChange={(e) => update("repair.auto_process", e.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Use WebDAV"
                    checked={config.repair.use_webdav}
                    onChange={(e) => update("repair.use_webdav", e.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Re-insert"
                    checked={config.repair.re_insert}
                    onChange={(e) => update("repair.re_insert", e.currentTarget.checked)}
                  />
                </Group>
              </>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Rclone Tab */}
        <Tabs.Panel value="rclone">
          <Paper p={20} style={{ background: "var(--mantine-color-dark-8)", border: "1px solid var(--mantine-color-dark-6)" }}>
            <SectionHeader icon={SolarFolderOpen} color="green" title="Rclone Settings" />
            <Checkbox
              label="Enable Rclone"
              checked={config.rclone.enabled}
              onChange={(e) => update("rclone.enabled", e.currentTarget.checked)}
              mb={16}
            />
            {config.rclone.enabled && (
              <>
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                  <TextInput
                    label="Mount Path"
                    value={config.rclone.mount_path}
                    onChange={(e) => update("rclone.mount_path", e.currentTarget.value)}
                    size="sm"
                  />
                  <TextInput
                    label="RC Port"
                    value={config.rclone.rc_port}
                    onChange={(e) => update("rclone.rc_port", e.currentTarget.value)}
                    size="sm"
                  />
                  <TextInput
                    label="Cache Dir"
                    value={config.rclone.cache_dir}
                    onChange={(e) => update("rclone.cache_dir", e.currentTarget.value)}
                    size="sm"
                  />
                  <NumberInput
                    label="Transfers"
                    value={config.rclone.transfers}
                    onChange={(v) => update("rclone.transfers", v)}
                    size="sm"
                    min={1}
                  />
                  <Select
                    label="VFS Cache Mode"
                    data={["off", "minimal", "writes", "full"]}
                    value={config.rclone.vfs_cache_mode}
                    onChange={(v) => update("rclone.vfs_cache_mode", v || "writes")}
                    size="sm"
                  />
                  <TextInput
                    label="VFS Cache Max Size"
                    value={config.rclone.vfs_cache_max_size}
                    onChange={(e) => update("rclone.vfs_cache_max_size", e.currentTarget.value)}
                    size="sm"
                  />
                  <Select
                    label="Log Level"
                    data={["DEBUG", "INFO", "NOTICE", "ERROR"]}
                    value={config.rclone.log_level}
                    onChange={(v) => update("rclone.log_level", v || "NOTICE")}
                    size="sm"
                  />
                  <TextInput
                    label="Bandwidth Limit"
                    value={config.rclone.bandwidth_limit}
                    onChange={(e) => update("rclone.bandwidth_limit", e.currentTarget.value)}
                    size="sm"
                  />
                </Box>
                <Group mt={16}>
                  <Checkbox
                    label="Mount Per Provider"
                    checked={config.rclone.mount_per_provider}
                    onChange={(e) => update("rclone.mount_per_provider", e.currentTarget.checked)}
                  />
                </Group>
              </>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

function SectionHeader({ icon: Icon, color, title }: { icon: React.ElementType; color: string; title: string }) {
  return (
    <Group gap={10} mb={16}>
      <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: `var(--mantine-color-${color}-6)` }}>
        <Icon size={20} />
      </Box>
      <Text size="sm" fw={600} c="dark.0">{title}</Text>
    </Group>
  );
}
