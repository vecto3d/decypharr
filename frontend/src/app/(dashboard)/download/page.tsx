"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Paper,
  Textarea,
  Select,
  TextInput,
  Checkbox,
  Button,
  Group,
  FileInput,
  Badge,
  List,
  Table,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SolarUpload, SolarLink, SolarFileUpload, SolarSettings, SolarDownload, SolarCheck, SolarClose, SolarRefresh } from "@/components/Icons";
import { api } from "@/lib/api";
import { formatBytes, formatSpeed, eta } from "@/lib/utils";
import type { Config, Torrent, AddTorrentResult } from "@/lib/types";

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

export default function DownloadPage() {
  const [magnets, setMagnets] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [action, setAction] = useState<string | null>("symlink");
  const [downloadFolder, setDownloadFolder] = useState("");
  const [arrCategory, setArrCategory] = useState<string | null>(null);
  const [debridService, setDebridService] = useState<string | null>(null);
  const [downloadUncached, setDownloadUncached] = useState(false);
  const [skipMultiSeason, setSkipMultiSeason] = useState(false);
  const [rmTrackerUrls, setRmTrackerUrls] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  // Submission results
  const [lastResults, setLastResults] = useState<AddTorrentResult[]>([]);
  const [lastErrors, setLastErrors] = useState<string[]>([]);

  // Recent torrents (live status)
  const [recentTorrents, setRecentTorrents] = useState<Torrent[]>([]);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      setDownloadFolder(c.qbittorrent.download_folder || "");
      if (c.debrids?.length === 1) {
        setDebridService(c.debrids[0].name);
      }
    }).catch(() => {});
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const data = await api.getTorrents();
      if (data) {
        // Show 10 most recently added
        const sorted = [...data].sort((a, b) => b.added_on - a.added_on);
        setRecentTorrents(sorted.slice(0, 10));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadRecent();
    const interval = setInterval(loadRecent, 5000);
    return () => clearInterval(interval);
  }, [loadRecent]);

  const debrids = config?.debrids?.map((d) => d.name) || [];
  const categories = config?.qbittorrent?.categories || [];

  const handleSubmit = async () => {
    if (!magnets.trim() && files.length === 0) {
      notifications.show({ message: "Add magnet links or torrent files", color: "yellow" });
      return;
    }

    setSubmitting(true);
    setLastResults([]);
    setLastErrors([]);
    try {
      const formData = new FormData();
      if (magnets.trim()) formData.append("urls", magnets.trim());
      if (action) formData.append("action", action);
      formData.append("downloadFolder", downloadFolder);
      if (arrCategory) formData.append("arr", arrCategory);
      if (debridService) formData.append("debrid", debridService);
      formData.append("downloadUncached", String(downloadUncached));
      formData.append("skipMultiSeason", String(skipMultiSeason));
      formData.append("rmTrackerUrls", String(rmTrackerUrls));
      files.forEach((f) => formData.append("files", f));

      const res = await api.addTorrents(formData);

      setLastResults(res.results || []);
      setLastErrors(res.errors || []);

      if (res.errors?.length) {
        res.errors.forEach((err) =>
          notifications.show({ message: err, color: "red" })
        );
      }
      if (res.results?.length) {
        notifications.show({
          message: `${res.results.length} torrent(s) added successfully`,
          color: "green",
        });
        setMagnets("");
        setFiles([]);
        // Refresh recent torrents
        setTimeout(loadRecent, 2000);
      }
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Box mb={24}>
        <Text size="lg" fw={600} c="dark.0" mb={2}>Add Torrents</Text>
        <Text size="sm" c="dimmed">Add magnet links or upload torrent files for download</Text>
      </Box>

      {/* Stat cards for recent activity */}
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
          value={recentTorrents.filter((t) => mapStatus(t.state, t.progress) === "downloading").length}
          label="Downloading"
          sub={(() => {
            const speed = recentTorrents
              .filter((t) => mapStatus(t.state, t.progress) === "downloading")
              .reduce((a, t) => a + (t.dlspeed || 0), 0);
            return speed > 0 ? `${formatSpeed(speed)} total` : undefined;
          })()}
        />
        <StatCard
          icon={<SolarCheck size={22} />}
          color="green"
          value={lastResults.length}
          label="Last Added"
          sub={lastResults.length > 0 ? `via ${lastResults[0]?.debrid || "debrid"}` : undefined}
        />
        <StatCard
          icon={<SolarClose size={22} />}
          color="red"
          value={lastErrors.length}
          label="Errors"
          sub={lastErrors.length > 0 ? "Check details below" : "None"}
        />
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 16,
        }}
      >
        {/* Magnet Links */}
        <Paper
          p={20}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
          }}
        >
          <Group gap={10} mb={16}>
            <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-blue-6)" }}>
              <SolarLink size={20} />
            </Box>
            <Box>
              <Text size="sm" fw={600} c="dark.0">Magnet Links</Text>
              <Text size="xs" c="dimmed">One per line</Text>
            </Box>
          </Group>
          <Textarea
            placeholder="magnet:?xt=urn:btih:..."
            minRows={8}
            maxRows={12}
            autosize
            value={magnets}
            onChange={(e) => setMagnets(e.currentTarget.value)}
            styles={{
              input: {
                background: "var(--mantine-color-dark-7)",
                border: "1px solid var(--mantine-color-dark-5)",
                fontFamily: "monospace",
                fontSize: 12,
              },
            }}
          />
        </Paper>

        {/* File Upload */}
        <Paper
          p={20}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
          }}
        >
          <Group gap={10} mb={16}>
            <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-orange-6)" }}>
              <SolarFileUpload size={20} />
            </Box>
            <Box>
              <Text size="sm" fw={600} c="dark.0">Torrent Files</Text>
              <Text size="xs" c="dimmed">Upload .torrent files</Text>
            </Box>
          </Group>
          <FileInput
            placeholder="Click to select or drag and drop"
            accept=".torrent"
            multiple
            value={files}
            onChange={setFiles}
            leftSection={<SolarUpload size={16} />}
            styles={{
              input: {
                background: "var(--mantine-color-dark-7)",
                border: "1px solid var(--mantine-color-dark-5)",
                minHeight: 100,
              },
            }}
          />
          {files.length > 0 && (
            <Box mt={8}>
              <Text size="xs" c="dimmed" mb={4}>{files.length} file(s) selected:</Text>
              <List size="xs" spacing={2}>
                {files.map((f, i) => (
                  <List.Item key={i}>
                    <Text size="xs" c="dark.1">{f.name}</Text>
                  </List.Item>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Options */}
      <Paper
        mt={16}
        p={20}
        style={{
          background: "var(--mantine-color-dark-8)",
          border: "1px solid var(--mantine-color-dark-6)",
        }}
      >
        <Group gap={10} mb={16}>
          <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-teal-6)" }}>
            <SolarSettings size={20} />
          </Box>
          <Box>
            <Text size="sm" fw={600} c="dark.0">Options</Text>
            <Text size="xs" c="dimmed">Configure download settings</Text>
          </Box>
        </Group>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <Select
            label="Action"
            data={[
              { value: "symlink", label: "Symlink" },
              { value: "download", label: "Download" },
              { value: "none", label: "None" },
            ]}
            value={action}
            onChange={setAction}
            size="sm"
          />
          <TextInput
            label="Download Folder"
            placeholder="/downloads"
            value={downloadFolder}
            onChange={(e) => setDownloadFolder(e.currentTarget.value)}
            size="sm"
          />
          {categories.length > 0 && (
            <Select
              label="Arr Category"
              data={categories}
              value={arrCategory}
              onChange={setArrCategory}
              clearable
              size="sm"
            />
          )}
          {debrids.length > 1 && (
            <Select
              label="Debrid Service"
              data={debrids}
              value={debridService}
              onChange={setDebridService}
              clearable
              size="sm"
            />
          )}
        </Box>

        <Group mt={16} gap="lg">
          <Checkbox
            label="Download Uncached"
            checked={downloadUncached}
            onChange={(e) => setDownloadUncached(e.currentTarget.checked)}
            size="sm"
          />
          <Checkbox
            label="Skip Multi-Season"
            checked={skipMultiSeason}
            onChange={(e) => setSkipMultiSeason(e.currentTarget.checked)}
            size="sm"
          />
          <Checkbox
            label="Remove Tracker URLs"
            checked={rmTrackerUrls}
            onChange={(e) => setRmTrackerUrls(e.currentTarget.checked)}
            size="sm"
          />
        </Group>
      </Paper>

      {/* Submit */}
      <Group mt={20} justify="flex-end">
        <Button
          size="md"
          color="teal"
          leftSection={<SolarUpload size={18} />}
          loading={submitting}
          onClick={handleSubmit}
        >
          Add Torrents
        </Button>
      </Group>

      {/* Submission Results */}
      {(lastResults.length > 0 || lastErrors.length > 0) && (
        <Paper
          mt={20}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Group px={20} py={16} gap={10}>
            <SolarCheck size={18} color="var(--mantine-color-dark-2)" />
            <Text size="sm" fw={600} c="dark.0">Submission Results</Text>
            <Badge
              size="sm"
              variant="filled"
              styles={{ root: { background: "var(--mantine-color-dark-6)", color: "var(--mantine-color-dark-2)" } }}
            >
              {lastResults.length + lastErrors.length}
            </Badge>
          </Group>

          {lastErrors.length > 0 && (
            <Box px={20} pb={12}>
              {lastErrors.map((err, i) => (
                <Group key={i} gap={8} mb={4}>
                  <SolarClose size={14} color="var(--mantine-color-red-6)" />
                  <Text size="xs" c="red.4">{err}</Text>
                </Group>
              ))}
            </Box>
          )}

          {lastResults.length > 0 && (
            <Box style={{ overflowX: "auto" }}>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
                    <Table.Th style={thStyle}>Magnet</Table.Th>
                    <Table.Th style={thStyle}>Debrid</Table.Th>
                    <Table.Th style={thStyle}>Action</Table.Th>
                    <Table.Th style={thStyle}>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lastResults.map((r, i) => (
                    <Table.Tr key={i} style={{ borderBottom: "1px solid rgba(37,38,43,0.5)" }}>
                      <Table.Td>
                        <Text size="xs" c="dark.1" lineClamp={1} maw={300} style={{ fontFamily: "monospace" }}>
                          {r.magnet?.substring(0, 60)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="grape">{r.debrid}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="cyan">{r.action}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="green">Added</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}
        </Paper>
      )}

      {/* Recent Downloads — RealFin-style live status table */}
      {recentTorrents.length > 0 && (
        <Paper
          mt={20}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Group px={20} py={16} gap={10}>
            <SolarDownload size={18} color="var(--mantine-color-dark-2)" />
            <Text size="sm" fw={600} c="dark.0">Recent Downloads</Text>
            <Badge
              size="sm"
              variant="filled"
              styles={{ root: { background: "var(--mantine-color-dark-6)", color: "var(--mantine-color-dark-2)" } }}
            >
              {recentTorrents.length}
            </Badge>
          </Group>

          <Box style={{ overflowX: "auto" }}>
            <Table>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
                  <Table.Th style={thStyle}>Media</Table.Th>
                  <Table.Th style={thStyle}>Status</Table.Th>
                  <Table.Th style={thStyle}>Progress</Table.Th>
                  <Table.Th style={thStyle}>Size</Table.Th>
                  <Table.Th style={thStyle}>Speed</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentTorrents.map((t) => {
                  const status = mapStatus(t.state, t.progress);
                  const current = t.size * t.progress;
                  const pct = t.size > 0 ? (current / t.size) * 100 : (status === "local" ? 100 : 0);
                  const sizeText = status === "downloading"
                    ? `${formatBytes(current)} / ${formatBytes(t.size)}`
                    : formatBytes(t.size);
                  const fileName = t.name.split("/").pop() || t.name;

                  return (
                    <Table.Tr key={t.hash} style={{ borderBottom: "1px solid rgba(37,38,43,0.5)" }}>
                      <Table.Td>
                        <Box style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Text size="sm" fw={500} c="dark.0" lineClamp={1} maw={400}>
                            {t.name}
                          </Text>
                          <Text size="xs" c="dark.3" lineClamp={1} maw={400}>
                            {fileName}
                          </Text>
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={getStatusColor(status)}
                          styles={{ root: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 } }}
                        >
                          {status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Box style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                          <Box
                            style={{
                              flex: 1, height: 6,
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: 16, overflow: "hidden",
                            }}
                          >
                            <Box
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 16,
                                background: `var(--mantine-color-${getStatusColor(status)}-6)`,
                                transition: "width 1s ease",
                              }}
                            />
                          </Box>
                          <Text size="xs" fw={600} c="dimmed" miw={42} ta="right">
                            {pct.toFixed(1)}%
                          </Text>
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>{sizeText}</Text>
                      </Table.Td>
                      <Table.Td>
                        {status === "downloading" && t.dlspeed > 0 ? (
                          <Box style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Text size="sm" fw={600} c="blue.6">{formatSpeed(t.dlspeed)}</Text>
                            <Text size="xs" c="dark.3">ETA {eta(current, t.size, t.dlspeed)}</Text>
                          </Box>
                        ) : (
                          <Text c="dark.3">&mdash;</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}
    </>
  );
}

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
      <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: `var(--mantine-color-${color}-6)` }}>
        {icon}
      </Box>
      <Box>
        <Text fw={700} lh={1} c="dark.0" mb={4} style={{ fontSize: "1.5rem" }}>
          {value}
        </Text>
        <Text size="xs" c="dimmed">{label}</Text>
        {sub && <Text size="xs" c="dark.3" mt={2}>{sub}</Text>}
      </Box>
    </Paper>
  );
}
