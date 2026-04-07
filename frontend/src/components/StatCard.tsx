"use client";

import { memo } from "react";
import { Box, Text, Paper } from "@mantine/core";

interface StatCardProps {
  icon: React.ReactNode;
  color: string;
  value: string | number;
  label: string;
  sub?: string;
}

export const StatCard = memo(function StatCard({ icon, color, value, label, sub }: StatCardProps) {
  return (
    <Paper
      className="stat-card"
      p={16}
      style={cardStyle}
    >
      <Box
        style={{
          ...iconBoxBase,
          color: `var(--mantine-color-${color}-6)`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Text fw={700} lh={1} c="dark.0" mb={4} style={valueStyle}>
          {value}
        </Text>
        <Text size="xs" c="dimmed">{label}</Text>
        {sub && <Text size="xs" c="dark.3" mt={2}>{sub}</Text>}
      </Box>
    </Paper>
  );
});

const cardStyle: React.CSSProperties = {
  background: "var(--mantine-color-dark-8)",
  border: "1px solid var(--mantine-color-dark-6)",
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
};

const iconBoxBase: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "var(--mantine-radius-md)",
  background: "var(--mantine-color-dark-6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = { fontSize: "1.5rem" };

export const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--mantine-color-dark-3)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
  textAlign: "left",
};
