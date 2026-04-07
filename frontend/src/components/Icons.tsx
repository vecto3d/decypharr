"use client";

import { Icon, addIcon } from "@iconify/react/offline";
import type { IconifyIcon } from "@iconify/react/offline";

// Import icon data at build time — no CDN fetches at runtime
import widget5Bold from "@iconify-icons/solar/widget-5-bold";
import downloadMinimalisticBold from "@iconify-icons/solar/download-minimalistic-bold";
import uploadMinimalisticBold from "@iconify-icons/solar/upload-minimalistic-bold";
import settingsBold from "@iconify-icons/solar/settings-bold";
import chartBold from "@iconify-icons/solar/chart-bold";
import tuning2Bold from "@iconify-icons/solar/tuning-2-bold";
import folderBold from "@iconify-icons/solar/folder-bold";
import folderWithFilesBold from "@iconify-icons/solar/folder-with-files-bold";
import layersBold from "@iconify-icons/solar/layers-bold";
import serverBold from "@iconify-icons/solar/server-bold";
import cloudBold from "@iconify-icons/solar/cloud-bold";
import playBold from "@iconify-icons/solar/play-bold";
import databaseBold from "@iconify-icons/solar/database-bold";
import cpuBoltBold from "@iconify-icons/solar/cpu-bolt-bold";
import monitorBold from "@iconify-icons/solar/monitor-bold";
import pulse2Bold from "@iconify-icons/solar/pulse-2-bold";
import transferVerticalBold from "@iconify-icons/solar/transfer-vertical-bold";
import minimalisticMagniferBold from "@iconify-icons/solar/minimalistic-magnifer-bold";
import trashBinTrashBold from "@iconify-icons/solar/trash-bin-trash-bold";
import copyBold from "@iconify-icons/solar/copy-bold";
import refreshBold from "@iconify-icons/solar/refresh-bold";
import addCircleBold from "@iconify-icons/solar/add-circle-bold";
import eyeBold from "@iconify-icons/solar/eye-bold";
import linkMinimalisticBold from "@iconify-icons/solar/link-minimalistic-bold";
import checkCircleBold from "@iconify-icons/solar/check-circle-bold";
import closeCircleBold from "@iconify-icons/solar/close-circle-bold";
import menuDotsBold from "@iconify-icons/solar/menu-dots-bold";
import stopBold from "@iconify-icons/solar/stop-bold";
import fileSendBold from "@iconify-icons/solar/file-send-bold";
import disketteBold from "@iconify-icons/solar/diskette-bold";
import arrowRightBold from "@iconify-icons/solar/arrow-right-bold";
import sunBold from "@iconify-icons/solar/sun-bold";
import moonBold from "@iconify-icons/solar/moon-bold";
import login3Bold from "@iconify-icons/solar/login-3-bold";
import userPlusBold from "@iconify-icons/solar/user-plus-bold";

interface SolarIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

function solar(data: IconifyIcon) {
  return function SolarIcon({ size = 18, ...props }: SolarIconProps) {
    return <Icon icon={data} width={size} height={size} {...props} />;
  };
}

// ── Navigation & Layout ─────────────────────────────────────
export const SolarDashboard = solar(widget5Bold);
export const SolarDownload = solar(downloadMinimalisticBold);
export const SolarUpload = solar(uploadMinimalisticBold);
export const SolarSettings = solar(settingsBold);
export const SolarChart = solar(chartBold);
export const SolarRepair = solar(tuning2Bold);
export const SolarFolder = solar(folderBold);
export const SolarFolderOpen = solar(folderWithFilesBold);
export const SolarLayers = solar(layersBold);
export const SolarServer = solar(serverBold);
export const SolarCloud = solar(cloudBold);

// ── Status & Media ──────────────────────────────────────────
export const SolarPlay = solar(playBold);
export const SolarDatabase = solar(databaseBold);
export const SolarCpu = solar(cpuBoltBold);
export const SolarMonitor = solar(monitorBold);
export const SolarActivity = solar(pulse2Bold);
export const SolarTransfer = solar(transferVerticalBold);

// ── Actions ─────────────────────────────────────────────────
export const SolarSearch = solar(minimalisticMagniferBold);
export const SolarTrash = solar(trashBinTrashBold);
export const SolarCopy = solar(copyBold);
export const SolarRefresh = solar(refreshBold);
export const SolarPlus = solar(addCircleBold);
export const SolarEye = solar(eyeBold);
export const SolarLink = solar(linkMinimalisticBold);
export const SolarCheck = solar(checkCircleBold);
export const SolarClose = solar(closeCircleBold);
export const SolarDots = solar(menuDotsBold);
export const SolarStop = solar(stopBold);
export const SolarFileUpload = solar(fileSendBold);
export const SolarSave = solar(disketteBold);
export const SolarArrowRight = solar(arrowRightBold);

// ── Theme ───────────────────────────────────────────────────
export const SolarSun = solar(sunBold);
export const SolarMoon = solar(moonBold);

// ── Auth ────────────────────────────────────────────────────
export const SolarLogin = solar(login3Bold);
export const SolarUserPlus = solar(userPlusBold);
