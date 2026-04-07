"use client";

import { Icon, type IconProps } from "@iconify/react";

interface SolarIconProps extends Omit<IconProps, "icon"> {
  size?: number;
}

function solar(name: string) {
  return function SolarIcon({ size = 18, ...props }: SolarIconProps) {
    return <Icon icon={name} width={size} height={size} {...props} />;
  };
}

// ── Navigation & Layout ─────────────────────────────────────
export const SolarDashboard = solar("solar:widget-5-bold");
export const SolarDownload = solar("solar:download-minimalistic-bold");
export const SolarUpload = solar("solar:upload-minimalistic-bold");
export const SolarSettings = solar("solar:settings-bold");
export const SolarChart = solar("solar:chart-bold");
export const SolarRepair = solar("solar:tuning-2-bold");
export const SolarFolder = solar("solar:folder-bold");
export const SolarFolderOpen = solar("solar:folder-with-files-bold");
export const SolarLayers = solar("solar:layers-bold");
export const SolarServer = solar("solar:server-bold");
export const SolarCloud = solar("solar:cloud-bold");

// ── Status & Media ──────────────────────────────────────────
export const SolarPlay = solar("solar:play-bold");
export const SolarDatabase = solar("solar:database-bold");
export const SolarCpu = solar("solar:cpu-bolt-bold");
export const SolarMonitor = solar("solar:monitor-bold");
export const SolarActivity = solar("solar:pulse-2-bold");
export const SolarTransfer = solar("solar:transfer-vertical-bold");

// ── Actions ─────────────────────────────────────────────────
export const SolarSearch = solar("solar:minimalistic-magnifer-bold");
export const SolarTrash = solar("solar:trash-bin-trash-bold");
export const SolarCopy = solar("solar:copy-bold");
export const SolarRefresh = solar("solar:refresh-bold");
export const SolarPlus = solar("solar:add-circle-bold");
export const SolarEye = solar("solar:eye-bold");
export const SolarLink = solar("solar:link-minimalistic-bold");
export const SolarCheck = solar("solar:check-circle-bold");
export const SolarClose = solar("solar:close-circle-bold");
export const SolarDots = solar("solar:menu-dots-bold");
export const SolarStop = solar("solar:stop-bold");
export const SolarFileUpload = solar("solar:file-send-bold");
export const SolarSave = solar("solar:diskette-bold");
export const SolarArrowRight = solar("solar:arrow-right-bold");

// ── Theme ───────────────────────────────────────────────────
export const SolarSun = solar("solar:sun-bold");
export const SolarMoon = solar("solar:moon-bold");

// ── Auth ────────────────────────────────────────────────────
export const SolarLogin = solar("solar:login-3-bold");
export const SolarUserPlus = solar("solar:user-plus-bold");
