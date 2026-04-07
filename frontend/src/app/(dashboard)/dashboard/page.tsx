"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Text,
  Group,
  Badge,
  Table,
  Select,
  TextInput,
  ActionIcon,
  Menu,
  Checkbox,
  Button,
  Pagination,
  Paper,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SolarDownload, SolarPlay, SolarChart, SolarFolder, SolarSearch, SolarTrash, SolarDots, SolarCopy, SolarRefresh } from "@/components/Icons";
import { api } from "@/lib/api";
import { formatBytes, formatSpeed, eta, getStateColor, getStateLabel } from "@/lib/utils";
import type { Torrent } from "@/lib/types";

const ITEMS_PER_PAGE = 20;

type TorrentStatus = "downloading" | "streaming" | "local";

function mapStatus(state: string, progress: number): TorrentStatus {
  if (state === "downloading" || state === "stalledDL" || state === "metaDL" || state === "queuedDL") return "downloading";
  if (progress >= 1 || state === "pausedUP" || state === "uploading") return "local";
  return "streaming";
}

function getStatusColor(status: TorrentStatus): string {
  switch (status) {
    case "downloading": return "blue";
    case "streaming": return "orange";
    case "local": return "green";
  }
}

function getTypeFromCategory(category: string): "movie" | "tv" {
  const c = category.toLowerCase();
  if (c.includes("movie") || c.includes("radarr") || c.includes("film")) return "movie";
  return "tv";
}

export default function DashboardPage() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("added_on");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const loadTorrents = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await api.getTorrents();
      setTorrents(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  useEffect(() => {
    loadTorrents();
    const interval = setInterval(loadTorrents, 5000);
    return () => clearInterval(interval);
  }, [loadTorrents]);

  const categories = useMemo(
    () => [...new Set(torrents.map((t) => t.category).filter(Boolean))],
    [torrents]
  );

  const states = useMemo(
    () => [...new Set(torrents.map((t) => t.state).filter(Boolean))],
    [torrents]
  );

  // Map torrents to RealFin-style statuses
  const enriched = useMemo(() =>
    torrents.map((t) => ({
      ...t,
      status: mapStatus(t.state, t.progress),
      mediaType: getTypeFromCategory(t.category),
      current: t.size * t.progress,
      total: t.size,
    })),
    [torrents]
  );

  const downloading = enriched.filter((t) => t.status === "downloading");
  const streaming = enriched.filter((t) => t.status === "streaming");
  const local = enriched.filter((t) => t.status === "local");
  const totalSpeed = downloading.reduce((a, t) => a + (t.dlspeed || 0), 0);

  // Filtering
  const filtered = useMemo(() => {
    let result = [...enriched];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(s));
    }
    if (stateFilter) result = result.filter((t) => t.status === stateFilter);
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter);
    // Sort: downloading first, then streaming, then local (like RealFin)
    const order: Record<string, number> = { downloading: 0, streaming: 1, local: 2 };
    if (sortBy === "added_on") {
      result.sort((a, b) => {
        const s = (order[a.status] ?? 9) - (order[b.status] ?? 9);
        return s !== 0 ? s : b.added_on - a.added_on;
      });
    } else if (sortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case "name": return a.name.localeCompare(b.name);
          case "size": return b.size - a.size;
          case "progress": return b.progress - a.progress;
          default: return 0;
        }
      });
    }
    return result;
  }, [enriched, search, stateFilter, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (hash: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((t) => t.hash)));
  };

  const deleteTorrent = async (hash: string, category: string, fromDebrid: boolean) => {
    try {
      await api.deleteTorrent(hash, category, fromDebrid);
      notifications.show({ message: "Torrent deleted", color: "green" });
      loadTorrents();
    } catch (e) {
      notifications.show({ message: `Delete failed: ${e}`, color: "red" });
    }
  };

  const deleteSelected = async (fromDebrid: boolean) => {
    if (selected.size === 0) return;
    try {
      await api.deleteTorrents([...selected], fromDebrid);
      notifications.show({ message: `${selected.size} torrents deleted`, color: "green" });
      setSelected(new Set());
      loadTorrents();
    } catch (e) {
      notifications.show({ message: `Delete failed: ${e}`, color: "red" });
    }
  };

  const movies = enriched.filter((t) => t.mediaType === "movie").length;
  const tv = enriched.filter((t) => t.mediaType === "tv").length;
  const localSize = local.reduce((a, t) => a + t.total, 0);

  return (
    <>
      {/* Page Header */}
      <Box mb={24}>
        <Text size="lg" fw={600} c="dark.0" mb={2}>Overview</Text>
        <Text size="sm" c="dimmed">Local cache download status and media overview</Text>
      </Box>

      {/* Stat Grid — RealFin style */}
      <Box
        mb={24}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <StatCard
          icon={<SolarDownload size={22} />}
          color="blue"
          value={downloading.length}
          label="Downloading"
          sub={totalSpeed > 0 ? `${formatSpeed(totalSpeed)} total` : undefined}
        />
        <StatCard
          icon={<SolarPlay size={22} />}
          color="orange"
          value={streaming.length}
          label="Streaming"
          sub="via Debrid"
        />
        <StatCard
          icon={<SolarChart size={22} />}
          color="green"
          value={local.length}
          label="Local Files"
          sub={localSize > 0 ? `${formatBytes(localSize)} on disk` : undefined}
        />
        <StatCard
          icon={<SolarFolder size={22} />}
          color="grape"
          value={enriched.length}
          label="Total Media"
          sub={`${movies} movies, ${tv} TV`}
        />
      </Box>

      {/* Disk Usage Bar */}
      <DiskUsage totalSize={enriched.reduce((a, t) => a + t.total, 0)} />

      {/* Filters */}
      <Box mb={16}>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search torrents..."
            leftSection={<SolarSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
          />
          <Select
            placeholder="Status"
            data={[
              { value: "downloading", label: "Downloading" },
              { value: "streaming", label: "Streaming" },
              { value: "local", label: "Local" },
            ]}
            value={stateFilter}
            onChange={(v) => { setStateFilter(v); setPage(1); }}
            clearable
            size="sm"
            w={140}
          />
          <Select
            placeholder="Category"
            data={categories}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            clearable
            size="sm"
            w={140}
          />
          <Select
            placeholder="Sort by"
            data={[
              { value: "added_on", label: "Status + Date" },
              { value: "name", label: "Name" },
              { value: "size", label: "Size" },
              { value: "progress", label: "Progress" },
            ]}
            value={sortBy}
            onChange={setSortBy}
            size="sm"
            w={140}
          />
          <ActionIcon variant="subtle" color="gray" onClick={() => loadTorrents(true)}>
            <SolarRefresh
              size={18}
              style={{
                animation: refreshing ? "spin 0.6s linear infinite" : "none",
              }}
            />
          </ActionIcon>
        </Group>
      </Box>

      {/* Batch Actions */}
      {selected.size > 0 && (
        <Group mb={12} gap="sm">
          <Text size="sm" c="dimmed">{selected.size} selected</Text>
          <Button size="xs" color="red" variant="light" onClick={() => deleteSelected(false)}>
            Delete Local
          </Button>
          <Button size="xs" color="red" onClick={() => deleteSelected(true)}>
            Delete + Debrid
          </Button>
        </Group>
      )}

      {/* Downloads Section — RealFin style */}
      <Paper
        style={{
          background: "var(--mantine-color-dark-8)",
          border: "1px solid var(--mantine-color-dark-6)",
          borderRadius: "var(--mantine-radius-md)",
          overflow: "hidden",
        }}
      >
        <Group px={20} py={16} gap={10}>
          <SolarDownload size={18} color="var(--mantine-color-dark-2)" />
          <Text size="sm" fw={600} c="dark.0">Downloads</Text>
          <Badge
            size="sm"
            variant="filled"
            styles={{ root: { background: "var(--mantine-color-dark-6)", color: "var(--mantine-color-dark-2)" } }}
          >
            {filtered.length}
          </Badge>
        </Group>

        <Box style={{ overflowX: "auto" }}>
          <Table>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
                <Table.Th w={40} style={thStyle}>
                  <Checkbox
                    size="xs"
                    checked={paged.length > 0 && selected.size === paged.length}
                    indeterminate={selected.size > 0 && selected.size < paged.length}
                    onChange={toggleAll}
                  />
                </Table.Th>
                <Table.Th style={thStyle}>Media</Table.Th>
                <Table.Th style={thStyle}>Type</Table.Th>
                <Table.Th style={thStyle}>Status</Table.Th>
                <Table.Th style={thStyle}>Progress</Table.Th>
                <Table.Th style={thStyle}>Size</Table.Th>
                <Table.Th style={thStyle}>Speed</Table.Th>
                <Table.Th w={50} style={thStyle} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paged.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Box py={48} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <SolarDownload size={36} style={{ opacity: 0.15 }} />
                      <Text size="sm" c="dimmed">
                        {loading ? "Loading..." : "No media files yet — request something via your Arr apps"}
                      </Text>
                    </Box>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paged.map((t) => {
                  const pct = t.total > 0 ? (t.current / t.total) * 100 : (t.status === "local" ? 100 : 0);
                  const sizeText = t.status === "downloading"
                    ? `${formatBytes(t.current)} / ${formatBytes(t.total)}`
                    : formatBytes(t.total || t.current);
                  const fileName = t.name.split("/").pop() || t.name;
                  const folderName = t.category || t.name.split("/")[0] || t.name;

                  return (
                    <Table.Tr
                      key={t.hash}
                      style={{ borderBottom: "1px solid rgba(37,38,43,0.5)" }}
                    >
                      {/* Checkbox */}
                      <Table.Td>
                        <Checkbox
                          size="xs"
                          checked={selected.has(t.hash)}
                          onChange={() => toggleSelect(t.hash)}
                        />
                      </Table.Td>

                      {/* Media — folder name + file name */}
                      <Table.Td>
                        <Box style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Text size="sm" fw={500} c="dark.0" lineClamp={1} maw={400}>
                            {folderName}
                          </Text>
                          <Text size="xs" c="dark.3" lineClamp={1} maw={400}>
                            {fileName}
                          </Text>
                        </Box>
                      </Table.Td>

                      {/* Type — movie/tv badge */}
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={t.mediaType === "movie" ? "grape" : "cyan"}
                          styles={{
                            root: {
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.3,
                            },
                          }}
                        >
                          {t.mediaType === "movie" ? "Movie" : "TV"}
                        </Badge>
                      </Table.Td>

                      {/* Status — downloading/streaming/local badge */}
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={getStatusColor(t.status)}
                          styles={{
                            root: {
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.3,
                            },
                          }}
                        >
                          {t.status}
                        </Badge>
                      </Table.Td>

                      {/* Progress — bar + percentage */}
                      <Table.Td>
                        <Box style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                          <Box
                            style={{
                              flex: 1,
                              height: 6,
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: 16,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 16,
                                background: `var(--mantine-color-${getStatusColor(t.status)}-6)`,
                                transition: "width 1s ease",
                              }}
                            />
                          </Box>
                          <Text size="xs" fw={600} c="dimmed" miw={42} ta="right">
                            {pct.toFixed(1)}%
                          </Text>
                        </Box>
                      </Table.Td>

                      {/* Size */}
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                          {sizeText}
                        </Text>
                      </Table.Td>

                      {/* Speed + ETA */}
                      <Table.Td>
                        {t.status === "downloading" && t.dlspeed > 0 ? (
                          <Box style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Text size="sm" fw={600} c="blue.6">{formatSpeed(t.dlspeed)}</Text>
                            <Text size="xs" c="dark.3">ETA {eta(t.current, t.total, t.dlspeed)}</Text>
                          </Box>
                        ) : (
                          <Text c="dark.3">&mdash;</Text>
                        )}
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td>
                        <Menu shadow="md" width={180} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                              <SolarDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<SolarCopy size={14} />}
                              onClick={() => {
                                navigator.clipboard.writeText(t.name);
                                notifications.show({ message: "Name copied", color: "teal" });
                              }}
                            >
                              Copy Name
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<SolarCopy size={14} />}
                              onClick={() => {
                                navigator.clipboard.writeText(t.hash);
                                notifications.show({ message: "Hash copied", color: "teal" });
                              }}
                            >
                              Copy Hash
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<SolarTrash size={14} />}
                              onClick={() => deleteTorrent(t.hash, t.category, false)}
                            >
                              Delete Local
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              leftSection={<SolarTrash size={14} />}
                              onClick={() => deleteTorrent(t.hash, t.category, true)}
                            >
                              Delete + Debrid
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Group justify="center" py={16}>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        )}
      </Paper>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--mantine-color-dark-3)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
  textAlign: "left",
};

function StatCard({
  icon,
  color,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  color: string;
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <Paper
      className="stat-card"
      p={16}
      style={{
        background: "var(--mantine-color-dark-8)",
        border: "1px solid var(--mantine-color-dark-6)",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <Box
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-dark-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: `var(--mantine-color-${color}-6)`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Text
          fw={700}
          lh={1}
          c="dark.0"
          mb={4}
          style={{ fontSize: "1.5rem" }}
        >
          {value}
        </Text>
        <Text size="xs" c="dimmed">{label}</Text>
        {sub && <Text size="xs" c="dark.3" mt={2}>{sub}</Text>}
      </Box>
    </Paper>
  );
}

function DiskUsage({ totalSize }: { totalSize: number }) {
  // Estimate disk as total media size (since we can't read OS disk info from the frontend)
  // This shows the total media footprint
  const displayUsed = totalSize;
  const displayTotal = totalSize > 0 ? totalSize : 1;
  const pct = totalSize > 0 ? 100 : 0;
  const colorClass = pct > 90 ? "red" : pct > 75 ? "yellow" : "teal";

  if (totalSize <= 0) return null;

  return (
    <Box mb={24}>
      <Group justify="space-between" mb={6}>
        <Text size="xs" c="dimmed">Total Media Size</Text>
        <Text size="xs" c="dark.3">
          {formatBytes(displayUsed)}
        </Text>
      </Group>
      <Box
        style={{
          height: 4,
          background: "var(--mantine-color-dark-6)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            height: "100%",
            width: `${Math.min(pct, 100)}%`,
            borderRadius: 16,
            background: `var(--mantine-color-${colorClass}-6)`,
            transition: "width 1s ease",
          }}
        />
      </Box>
    </Box>
  );
}
