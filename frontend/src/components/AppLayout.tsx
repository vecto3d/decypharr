"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Burger,
  Group,
  Text,
  UnstyledButton,
  Badge,
  Box,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { SolarDashboard, SolarDownload, SolarRepair, SolarSettings, SolarChart, SolarLayers } from "@/components/Icons";
import { LastUpdated } from "@/components/LastUpdated";
import { api } from "@/lib/api";
import type { VersionInfo } from "@/lib/types";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: SolarDashboard },
];

const downloadItems = [
  { label: "Torrents", href: "/download", icon: SolarDownload },
];

const managementItems = [
  { label: "Repair", href: "/repair", icon: SolarRepair },
  { label: "Settings", href: "/settings", icon: SolarSettings },
  { label: "Stats", href: "/stats", icon: SolarChart },
];

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
}

function NavLinkItem({ href, icon: Icon, label, active, badge, onClick }: NavLinkProps) {
  return (
    <UnstyledButton
      component={Link}
      href={href}
      onClick={onClick}
      py={8}
      px={12}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: "var(--mantine-radius-md)",
        color: active ? "var(--mantine-color-dark-0)" : "var(--mantine-color-dark-2)",
        background: active ? "var(--mantine-color-dark-8)" : "transparent",
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        transition: "background 150ms ease, color 150ms ease",
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge}
    </UnstyledButton>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size="xs"
      fw={600}
      c="dark.3"
      tt="uppercase"
      style={{ letterSpacing: 0.5, padding: "8px 12px 4px" }}
    >
      {children}
    </Text>
  );
}

const HEADER_H = 56;
const SIDEBAR_W = 260;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    api.getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <Box style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--mantine-color-dark-9)" }}>
      {/* Sidebar */}
      <Box
        component="aside"
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--mantine-color-dark-6)",
          overflow: "hidden",
        }}
        visibleFrom="sm"
      >
        {/* Brand — same height as header */}
        <Group
          h={HEADER_H}
          px={16}
          gap={10}
          style={{ borderBottom: "1px solid var(--mantine-color-dark-6)", flexShrink: 0 }}
        >
          <SolarLayers size={22} color="var(--mantine-color-teal-6)" />
          <Text size="md" fw={700} c="dark.0" style={{ letterSpacing: -0.3 }}>
            Decypharr
          </Text>
        </Group>

        {/* Navigation */}
        <Box p={8} style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => (
            <NavLinkItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={close}
            />
          ))}

          <Divider my={8} color="dark.6" />
          <SectionLabel>Downloads</SectionLabel>

          {downloadItems.map((item) => (
            <NavLinkItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={close}
            />
          ))}

          <Divider my={8} color="dark.6" />
          <SectionLabel>Management</SectionLabel>

          {managementItems.map((item) => (
            <NavLinkItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={close}
            />
          ))}
        </Box>
      </Box>

      {/* Main area */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header — aligned with sidebar brand */}
        <Group
          h={HEADER_H}
          px={16}
          justify="space-between"
          style={{
            borderBottom: "1px solid var(--mantine-color-dark-6)",
            flexShrink: 0,
          }}
        >
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group gap={8} ml="auto">
            <LastUpdated />
            {version && (
              <Badge variant="light" color="teal" size="sm">
                v{version.version}
              </Badge>
            )}
          </Group>
        </Group>

        {/* Content */}
        <Box
          p={24}
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile sidebar overlay */}
      {opened && (
        <Box
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
          }}
          hiddenFrom="sm"
        >
          <Box
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={close}
          />
          <Box
            style={{
              position: "relative",
              width: SIDEBAR_W,
              background: "var(--mantine-color-dark-9)",
              borderRight: "1px solid var(--mantine-color-dark-6)",
              display: "flex",
              flexDirection: "column",
              zIndex: 201,
            }}
          >
            <Group
              h={HEADER_H}
              px={16}
              gap={10}
              style={{ borderBottom: "1px solid var(--mantine-color-dark-6)", flexShrink: 0 }}
            >
              <SolarLayers size={22} color="var(--mantine-color-teal-6)" />
              <Text size="md" fw={700} c="dark.0" style={{ letterSpacing: -0.3 }}>
                Decypharr
              </Text>
            </Group>
            <Box p={8} style={{ flex: 1, overflowY: "auto" }}>
              {navItems.map((item) => (
                <NavLinkItem key={item.href} {...item} active={pathname === item.href} onClick={close} />
              ))}
              <Divider my={8} color="dark.6" />
              <SectionLabel>Downloads</SectionLabel>
              {downloadItems.map((item) => (
                <NavLinkItem key={item.href} {...item} active={pathname === item.href} onClick={close} />
              ))}
              <Divider my={8} color="dark.6" />
              <SectionLabel>Management</SectionLabel>
              {managementItems.map((item) => (
                <NavLinkItem key={item.href} {...item} active={pathname === item.href} onClick={close} />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
