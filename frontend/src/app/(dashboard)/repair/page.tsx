"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  Table,
  Select,
  TextInput,
  Checkbox,
  Modal,
  ActionIcon,
  Pagination,

  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { SolarRepair, SolarPlus, SolarTrash, SolarPlay, SolarStop, SolarEye, SolarSearch, SolarRefresh } from "@/components/Icons";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import type { RepairJob, BrokenItem, ArrConfig } from "@/lib/types";

const JOB_COLORS: Record<string, string> = {
  pending: "yellow",
  started: "blue",
  processing: "blue",
  completed: "green",
  failed: "red",
  cancelled: "gray",
};

const ITEMS_PER_PAGE = 20;

export default function RepairPage() {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [arrs, setArrs] = useState<ArrConfig[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  // Form state
  const [selectedArr, setSelectedArr] = useState<string | null>(null);
  const [mediaIds, setMediaIds] = useState("");
  const [asyncMode, setAsyncMode] = useState(true);
  const [autoProcess, setAutoProcess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [currentJob, setCurrentJob] = useState<RepairJob | null>(null);
  const [brokenSearch, setBrokenSearch] = useState("");
  const [brokenPage, setBrokenPage] = useState(1);

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.getRepairJobs();
      setJobs(data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadJobs();
    api.getArrs().then(setArrs).catch(() => {});
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const allBrokenItems = useMemo(() => {
    if (!currentJob?.broken_items) return [];
    return Object.entries(currentJob.broken_items).flatMap(([arr, items]) =>
      (items || []).map((item) => ({ ...item, arr }))
    );
  }, [currentJob]);

  const filteredBroken = useMemo(() => {
    if (!brokenSearch) return allBrokenItems;
    const s = brokenSearch.toLowerCase();
    return allBrokenItems.filter(
      (item) => item.path.toLowerCase().includes(s) || item.arr.toLowerCase().includes(s)
    );
  }, [allBrokenItems, brokenSearch]);

  const brokenPages = Math.ceil(filteredBroken.length / ITEMS_PER_PAGE);
  const pagedBroken = filteredBroken.slice(
    (brokenPage - 1) * ITEMS_PER_PAGE,
    brokenPage * ITEMS_PER_PAGE
  );

  const handleSubmit = async () => {
    if (!selectedArr) {
      notifications.show({ message: "Select an Arr instance", color: "yellow" });
      return;
    }
    setSubmitting(true);
    try {
      const ids = mediaIds.trim()
        ? mediaIds.split(/[,\s]+/).filter(Boolean)
        : undefined;
      await api.createRepairJob({
        arr: selectedArr,
        mediaIds: ids,
        async: asyncMode,
        autoProcess,
      });
      notifications.show({ message: "Repair job created", color: "green" });
      setMediaIds("");
      loadJobs();
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const viewJob = (job: RepairJob) => {
    setCurrentJob(job);
    setBrokenSearch("");
    setBrokenPage(1);
    openModal();
  };

  const processJob = async (id: string) => {
    try {
      await api.processRepairJob(id);
      notifications.show({ message: "Processing started", color: "green" });
      loadJobs();
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    }
  };

  const stopJob = async (id: string) => {
    try {
      await api.stopRepairJob(id);
      notifications.show({ message: "Job stopped", color: "yellow" });
      loadJobs();
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    }
  };

  const deleteSelected = async () => {
    if (selectedJobs.size === 0) return;
    try {
      await api.deleteRepairJobs([...selectedJobs]);
      notifications.show({ message: `${selectedJobs.size} job(s) deleted`, color: "green" });
      setSelectedJobs(new Set());
      loadJobs();
    } catch (e) {
      notifications.show({ message: `Failed: ${e}`, color: "red" });
    }
  };

  return (
    <>
      <Box mb={24}>
        <Text size="lg" fw={600} c="dark.0" mb={2}>Repair</Text>
        <Text size="sm" c="dimmed">Find and repair missing or broken media files</Text>
      </Box>

      {/* Create Job */}
      <Paper
        p={20}
        mb={16}
        style={{
          background: "var(--mantine-color-dark-8)",
          border: "1px solid var(--mantine-color-dark-6)",
        }}
      >
        <Group gap={10} mb={16}>
          <Box style={{ width: 38, height: 38, borderRadius: "var(--mantine-radius-md)", background: "var(--mantine-color-dark-6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--mantine-color-orange-6)" }}>
            <SolarPlus size={20} />
          </Box>
          <Box>
            <Text size="sm" fw={600} c="dark.0">Create Repair Job</Text>
            <Text size="xs" c="dimmed">Scan for missing or broken files</Text>
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
            label="Arr Instance"
            placeholder="Select arr..."
            data={arrs.map((a) => ({ value: a.name, label: a.name }))}
            value={selectedArr}
            onChange={setSelectedArr}
            size="sm"
          />
          <TextInput
            label="Media IDs"
            placeholder="Optional, comma-separated"
            value={mediaIds}
            onChange={(e) => setMediaIds(e.currentTarget.value)}
            size="sm"
          />
        </Box>

        <Group mt={12} gap="lg">
          <Checkbox
            label="Async"
            checked={asyncMode}
            onChange={(e) => setAsyncMode(e.currentTarget.checked)}
            size="sm"
          />
          <Checkbox
            label="Auto Process"
            checked={autoProcess}
            onChange={(e) => setAutoProcess(e.currentTarget.checked)}
            size="sm"
          />
        </Group>

        <Group mt={16} justify="flex-end">
          <Button
            color="teal"
            leftSection={<SolarRepair size={16} />}
            loading={submitting}
            onClick={handleSubmit}
            size="sm"
          >
            Start Repair
          </Button>
        </Group>
      </Paper>

      {/* Jobs List */}
      <Paper
        style={{
          background: "var(--mantine-color-dark-8)",
          border: "1px solid var(--mantine-color-dark-6)",
          borderRadius: "var(--mantine-radius-md)",
          overflow: "hidden",
        }}
      >
        <Group px={20} py={16} gap={10} justify="space-between">
          <Group gap={10}>
            <SolarRepair size={18} color="var(--mantine-color-dark-2)" />
            <Text size="sm" fw={600} c="dark.0">Repair Jobs</Text>
            <Badge size="sm" variant="filled" color="dark.6" c="dimmed">{jobs.length}</Badge>
          </Group>
          <Group gap={8}>
            {selectedJobs.size > 0 && (
              <Button size="xs" color="red" variant="light" onClick={deleteSelected}>
                <SolarTrash size={14} style={{ marginRight: 4 }} />
                Delete ({selectedJobs.size})
              </Button>
            )}
            <ActionIcon variant="subtle" color="gray" onClick={loadJobs}>
              <SolarRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Box style={{ overflowX: "auto" }}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
                <Table.Th w={40}>
                  <Checkbox
                    size="xs"
                    checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                    indeterminate={selectedJobs.size > 0 && selectedJobs.size < jobs.length}
                    onChange={() => {
                      if (selectedJobs.size === jobs.length) setSelectedJobs(new Set());
                      else setSelectedJobs(new Set(jobs.map((j) => j.id)));
                    }}
                  />
                </Table.Th>
                <Table.Th style={thStyle}>ID</Table.Th>
                <Table.Th style={thStyle}>Status</Table.Th>
                <Table.Th style={thStyle}>Arrs</Table.Th>
                <Table.Th style={thStyle}>Created</Table.Th>
                <Table.Th style={thStyle}>Broken Items</Table.Th>
                <Table.Th style={thStyle}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Box py={48} style={{ textAlign: "center" }}>
                      <SolarRepair size={36} style={{ opacity: 0.15 }} />
                      <Text size="sm" c="dimmed" mt={8}>No repair jobs</Text>
                    </Box>
                  </Table.Td>
                </Table.Tr>
              ) : (
                jobs.map((job) => {
                  const totalBroken = Object.values(job.broken_items || {}).reduce(
                    (a, items) => a + (items?.length || 0), 0
                  );
                  return (
                    <Table.Tr key={job.id} style={{ borderBottom: "1px solid rgba(37,38,43,0.5)" }}>
                      <Table.Td>
                        <Checkbox
                          size="xs"
                          checked={selectedJobs.has(job.id)}
                          onChange={() => {
                            setSelectedJobs((prev) => {
                              const next = new Set(prev);
                              if (next.has(job.id)) next.delete(job.id);
                              else next.add(job.id);
                              return next;
                            });
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dark.1" style={{ fontFamily: "monospace" }}>
                          {job.id.substring(0, 8)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={JOB_COLORS[job.status] || "gray"} variant="light">
                          {job.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {job.arrs?.map((a) => (
                            <Badge key={a} size="xs" variant="light" color="cyan">{a}</Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(job.created_at).toLocaleString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={totalBroken > 0 ? "red" : "green"}>
                          {totalBroken}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => viewJob(job)}>
                            <SolarEye size={14} />
                          </ActionIcon>
                          {(job.status === "completed" || job.status === "pending") && (
                            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => processJob(job.id)}>
                              <SolarPlay size={14} />
                            </ActionIcon>
                          )}
                          {(job.status === "started" || job.status === "processing") && (
                            <ActionIcon size="sm" variant="subtle" color="yellow" onClick={() => stopJob(job.id)}>
                              <SolarStop size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      {/* Job Detail Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={
          <Group gap={8}>
            <SolarRepair size={18} />
            <Text fw={600}>Job Details</Text>
          </Group>
        }
        size="xl"
        styles={{
          content: { background: "var(--mantine-color-dark-8)" },
          header: { background: "var(--mantine-color-dark-8)" },
        }}
      >
        {currentJob && (
          <>
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
              }}
              mb={16}
            >
              <Box>
                <Text size="xs" c="dimmed">Status</Text>
                <Badge size="sm" color={JOB_COLORS[currentJob.status] || "gray"} variant="light">
                  {currentJob.status}
                </Badge>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm" c="dark.0">{new Date(currentJob.created_at).toLocaleString()}</Text>
              </Box>
              {currentJob.completed_at && (
                <Box>
                  <Text size="xs" c="dimmed">Completed</Text>
                  <Text size="sm" c="dark.0">{new Date(currentJob.completed_at).toLocaleString()}</Text>
                </Box>
              )}
              <Box>
                <Text size="xs" c="dimmed">Auto Process</Text>
                <Badge size="sm" color={currentJob.auto_process ? "green" : "gray"} variant="light">
                  {currentJob.auto_process ? "Yes" : "No"}
                </Badge>
              </Box>
            </Box>

            {currentJob.error && (
              <Paper p="sm" mb={16} style={{ background: "var(--mantine-color-red-9)", border: "1px solid var(--mantine-color-red-7)" }}>
                <Text size="sm" c="red.3">{currentJob.error}</Text>
              </Paper>
            )}

            <Divider my={16} color="dark.6" />

            <Group justify="space-between" mb={12}>
              <Text size="sm" fw={600} c="dark.0">
                Broken Items ({filteredBroken.length})
              </Text>
              <TextInput
                placeholder="Search paths..."
                leftSection={<SolarSearch size={14} />}
                value={brokenSearch}
                onChange={(e) => { setBrokenSearch(e.currentTarget.value); setBrokenPage(1); }}
                size="xs"
                w={250}
              />
            </Group>

            <Box style={{ overflowX: "auto" }}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={thStyle}>Path</Table.Th>
                    <Table.Th style={thStyle}>Arr</Table.Th>
                    <Table.Th style={thStyle}>Type</Table.Th>
                    <Table.Th style={thStyle}>Size</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pagedBroken.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text size="sm" c="dimmed" ta="center" py={20}>No broken items</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    pagedBroken.map((item, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>
                          <Text size="xs" c="dark.1" lineClamp={1} maw={400} style={{ fontFamily: "monospace" }}>
                            {item.path}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light" color="cyan">{item.arr}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="light" color="grape">{item.type}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{formatBytes(item.size)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            {brokenPages > 1 && (
              <Group justify="center" mt={12}>
                <Pagination total={brokenPages} value={brokenPage} onChange={setBrokenPage} size="xs" />
              </Group>
            )}
          </>
        )}
      </Modal>
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
