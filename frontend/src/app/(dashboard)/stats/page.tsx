"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Text,
  Paper,
  Group,
  Badge,
  Table,
  Progress,

  Divider,
} from "@mantine/core";
import { SolarCpu, SolarMonitor, SolarCloud, SolarFolderOpen, SolarActivity, SolarDatabase, SolarTransfer } from "@/components/Icons";
import { api } from "@/lib/api";
import { formatBytes, formatSpeed, formatDuration } from "@/lib/utils";
import type { SystemStats } from "@/lib/types";

export default function StatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (!stats) {
    return (
      <Box py={48} style={{ textAlign: "center" }}>
        <Text c="dimmed">Loading stats...</Text>
      </Box>
    );
  }

  return (
    <>
      <Box mb={24}>
        <Text size="lg" fw={600} c="dark.0" mb={2}>System Stats</Text>
        <Text size="sm" c="dimmed">System overview and service status</Text>
      </Box>

      {/* System Overview */}
      <Box
        mb={24}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <StatCard icon={<SolarCpu size={22} />} color="blue" label="Memory" value={stats.memory_used} sub={`Heap: ${stats.heap_alloc_mb} MB`} />
        <StatCard icon={<SolarActivity size={22} />} color="orange" label="Goroutines" value={stats.goroutines} sub={`GC Cycles: ${stats.gc_cycles}`} />
        <StatCard icon={<SolarMonitor size={22} />} color="green" label="CPU Cores" value={stats.num_cpu} sub={`${stats.os} / ${stats.arch}`} />
        <StatCard icon={<SolarDatabase size={22} />} color="grape" label="Go Version" value={stats.go_version} />
      </Box>

      {/* Debrid Services */}
      {stats.debrids?.map((debrid, i) => (
        <Paper
          key={i}
          p={20}
          mb={16}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
          }}
        >
          <Group gap={10} mb={16}>
            <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-grape-6)" }}>
              <SolarCloud size={20} />
            </Box>
            <Box>
              <Text size="sm" fw={600} c="dark.0">{debrid.profile?.name || `Debrid ${i + 1}`}</Text>
              <Text size="xs" c="dimmed">{debrid.profile?.username}</Text>
            </Box>
            <Badge ml="auto" variant="light" color={debrid.profile?.type === "premium" ? "teal" : "gray"}>
              {debrid.profile?.type}
            </Badge>
          </Group>

          {debrid.profile?.expiration && (
            <Text size="xs" c="dimmed" mb={8}>
              Expires: {new Date(debrid.profile.expiration).toLocaleDateString()}
            </Text>
          )}

          {debrid.library && (
            <Box
              mb={16}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              <MiniStat label="Total Items" value={debrid.library.total} />
              <MiniStat label="Bad Items" value={debrid.library.bad} color="red" />
              <MiniStat label="Active Links" value={debrid.library.active_links} color="blue" />
              {debrid.profile?.points != null && (
                <MiniStat label="Points" value={debrid.profile.points} color="teal" />
              )}
            </Box>
          )}

          {debrid.accounts?.length > 0 && (
            <>
              <Divider my={12} color="dark.6" />
              <Text size="xs" fw={600} c="dark.3" tt="uppercase" mb={8}>Accounts</Text>
              <Box style={{ overflowX: "auto" }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={thStyle}>Username</Table.Th>
                      <Table.Th style={thStyle}>Status</Table.Th>
                      <Table.Th style={thStyle}>Traffic Used</Table.Th>
                      <Table.Th style={thStyle}>Links</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {debrid.accounts.map((acc, j) => (
                      <Table.Tr key={j}>
                        <Table.Td>
                          <Text size="xs" c="dark.1">{acc.username}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {acc.in_use && <Badge size="xs" variant="light" color="green">Active</Badge>}
                            {acc.disabled && <Badge size="xs" variant="light" color="red">Disabled</Badge>}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{formatBytes(acc.traffic_used)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{acc.links_count}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </>
          )}
        </Paper>
      ))}

      {/* Rclone Stats */}
      {stats.rclone?.enabled && (
        <Paper
          p={20}
          mb={16}
          style={{
            background: "var(--mantine-color-dark-8)",
            border: "1px solid var(--mantine-color-dark-6)",
          }}
        >
          <Group gap={10} mb={16}>
            <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-green-6)" }}>
              <SolarFolderOpen size={20} />
            </Box>
            <Box>
              <Text size="sm" fw={600} c="dark.0">Rclone</Text>
              <Text size="xs" c="dimmed">
                {stats.rclone.version?.version || "Unknown"} &middot; {stats.rclone.server_ready ? "Ready" : "Not Ready"}
              </Text>
            </Box>
            <Badge ml="auto" variant="light" color={stats.rclone.server_ready ? "green" : "red"}>
              {stats.rclone.server_ready ? "Connected" : "Disconnected"}
            </Badge>
          </Group>

          {stats.rclone.core && (
            <Box
              mb={16}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              <MiniStat label="Transferred" value={formatBytes(stats.rclone.core.bytes)} color="blue" />
              <MiniStat label="Speed" value={formatSpeed(stats.rclone.core.speed)} color="teal" />
              <MiniStat label="Transfers" value={stats.rclone.core.transfers} />
              <MiniStat label="Errors" value={stats.rclone.core.errors} color={stats.rclone.core.errors > 0 ? "red" : "green"} />
              <MiniStat label="Elapsed" value={formatDuration(stats.rclone.core.elapsedTime)} />
            </Box>
          )}

          {stats.rclone.bandwidth && (
            <Text size="xs" c="dimmed" mb={12}>
              Bandwidth Limit: {stats.rclone.bandwidth.rate || "None"}{" "}
              ({formatSpeed(stats.rclone.bandwidth.bytesPerSecond)})
            </Text>
          )}

          {/* Active Transfers */}
          {stats.rclone.core?.transferring?.length > 0 && (
            <>
              <Divider my={12} color="dark.6" />
              <Group gap={10} mb={8}>
                <SolarTransfer size={16} color="var(--mantine-color-dark-2)" />
                <Text size="xs" fw={600} c="dark.3" tt="uppercase">Active Transfers</Text>
              </Group>
              <Box style={{ overflowX: "auto" }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={thStyle}>File</Table.Th>
                      <Table.Th style={thStyle}>Progress</Table.Th>
                      <Table.Th style={thStyle}>Speed</Table.Th>
                      <Table.Th style={thStyle}>ETA</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats.rclone.core.transferring.map((t, i) => {
                      const pct = t.size > 0 ? (t.bytes / t.size) * 100 : 0;
                      return (
                        <Table.Tr key={i}>
                          <Table.Td>
                            <Text size="xs" c="dark.1" lineClamp={1} maw={300}>
                              {t.name.split("/").pop()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={8} wrap="nowrap" miw={150}>
                              <Progress value={pct} color="blue" size={6} style={{ flex: 1 }} />
                              <Text size="xs" c="dimmed" miw={40} ta="right">
                                {pct.toFixed(1)}%
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="blue.6" fw={600}>{formatSpeed(t.speed)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{formatDuration(t.eta)}</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            </>
          )}

          {/* Mounts */}
          {stats.rclone.mounts && Object.keys(stats.rclone.mounts).length > 0 && (
            <>
              <Divider my={12} color="dark.6" />
              <Text size="xs" fw={600} c="dark.3" tt="uppercase" mb={8}>Mounts</Text>
              <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8 }}>
                {Object.entries(stats.rclone.mounts).map(([key, mount]) => (
                  <Paper
                    key={key}
                    p={12}
                    style={{ background: "var(--mantine-color-dark-7)", border: "1px solid var(--mantine-color-dark-5)" }}
                  >
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" fw={600} c="dark.0">{mount.config_name}</Text>
                      <Badge size="xs" variant="light" color={mount.mounted ? "green" : "red"}>
                        {mount.mounted ? "Mounted" : "Unmounted"}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">{mount.local_path}</Text>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </Paper>
      )}
    </>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--mantine-color-dark-3)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
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
        <Text size="xl" fw={700} lh={1} c="dark.0" mb={4}>{value}</Text>
        <Text size="xs" c="dimmed">{label}</Text>
        {sub && <Text size="xs" c="dark.3" mt={2}>{sub}</Text>}
      </Box>
    </Paper>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={600} c={color ? `${color}.6` : "dark.0"}>{value}</Text>
    </Box>
  );
}
