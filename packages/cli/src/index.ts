#!/usr/bin/env bun
import {
  createCliRenderer,
  Box,
  Text,
  ScrollBox,
  t,
  bold,
  dim,
  fg,
  type KeyEvent,
} from "@opentui/core";
import path from "node:path";
import {
  NodeProcessManager,
  resolveNodePaths,
  locateFaircoindBinary,
  NETWORK_DEFAULTS,
} from "../../common/src/node-manager.js";
import type { NodeStatus, Network } from "../../common/src/ipc.js";

// ── Theme ────────────────────────────────────────────────────────────────────

const C = {
  green: "#9ffb50",
  greenDim: "#7cc940",
  dark: "#1b1e09",
  darkLight: "#2a2e14",
  darkLighter: "#333820",
  border: "#3a3f1e",
  muted: "#6b7280",
  white: "#ffffff",
  red: "#e06c75",
  yellow: "#f5a742",
  cyan: "#56b6c2",
} as const;

// ── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let currentNetwork: Network = args.includes("--testnet") ? "testnet" : "mainnet";
const autoStart = args.includes("--start");

// ── Node Manager ─────────────────────────────────────────────────────────────

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const searchDirs: string[] = [];
if (typeof process.resourcesPath === "string") {
  searchDirs.push(path.join(process.resourcesPath, "bin"));
}
searchDirs.push(path.join(repoRoot, "resources", "bin"));

const nodePaths = await resolveNodePaths();

let faircoindPath: string;
try {
  faircoindPath = await locateFaircoindBinary(searchDirs);
} catch {
  console.error("Could not find faircoind binary. Place it in resources/bin/<platform>/<arch>/");
  process.exit(1);
}

const manager = new NodeProcessManager(nodePaths, faircoindPath);
let status: NodeStatus = manager.getStatus();
let logOffset = 0;
let logContent = "";

// ── Renderer ─────────────────────────────────────────────────────────────────

const renderer = await createCliRenderer({ exitOnCtrlC: false });

// ── Header ───────────────────────────────────────────────────────────────────

const networkBadge = Text({ content: "" });
const uptimeText = Text({ content: "", fg: C.muted });

const header = Box(
  {
    width: "100%",
    height: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 1,
    paddingRight: 1,
    backgroundColor: C.darkLight,
  },
  Box(
    { flexDirection: "row", gap: 1, alignItems: "center" },
    Text({ content: t`${bold(fg(C.green)("FAIR"))}${dim(fg(C.greenDim)("Node"))}` }),
    Text({ content: t`${dim(fg(C.muted)("v0.1.0"))}` }),
  ),
  Box(
    { flexDirection: "row", gap: 2, alignItems: "center" },
    uptimeText,
    networkBadge,
  ),
);

// ── Status Panel ─────────────────────────────────────────────────────────────

const statusDot = Text({ content: "" });
const statusLabel = Text({ content: "" });

const pidValue = Text({ content: "-", fg: C.white });
const rpcValue = Text({ content: "-", fg: C.white });
const p2pValue = Text({ content: "-", fg: C.white });

function infoRow(label: string, valueEl: ReturnType<typeof Text>) {
  return Box(
    { flexDirection: "row", gap: 1 },
    Text({ content: t`${dim(fg(C.muted)(label))}` }),
    valueEl,
  );
}

const statusPanel = Box(
  {
    width: "100%",
    borderStyle: "rounded",
    borderColor: C.border,
    title: " Status ",
    backgroundColor: C.darkLight,
    padding: 1,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "column",
    gap: 0,
  },
  Box(
    { flexDirection: "row", gap: 1, alignItems: "center", height: 1 },
    statusDot,
    statusLabel,
  ),
  Box(
    { flexDirection: "row", gap: 3, height: 1 },
    infoRow("PID", pidValue),
    infoRow("RPC", rpcValue),
    infoRow("P2P", p2pValue),
  ),
);

// ── Paths Panel ──────────────────────────────────────────────────────────────

const dataDirValue = Text({ content: nodePaths.dataDir, fg: C.white });
const configDirValue = Text({ content: nodePaths.configDir, fg: C.white });

const pathsPanel = Box(
  {
    width: "100%",
    borderStyle: "rounded",
    borderColor: C.border,
    title: " Paths ",
    backgroundColor: C.darkLight,
    paddingLeft: 1,
    paddingRight: 1,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "column",
    gap: 0,
  },
  Box(
    { flexDirection: "row", gap: 1, height: 1 },
    Text({ content: t`${dim(fg(C.muted)("data  "))}` }),
    dataDirValue,
  ),
  Box(
    { flexDirection: "row", gap: 1, height: 1 },
    Text({ content: t`${dim(fg(C.muted)("config"))}` }),
    configDirValue,
  ),
);

// ── Logs Panel ───────────────────────────────────────────────────────────────

const logText = Text({ content: t`${dim(fg(C.muted)("Waiting for logs..."))}` });

const logsPanel = Box(
  {
    flexGrow: 1,
    width: "100%",
    borderStyle: "rounded",
    borderColor: C.border,
    title: " Logs ",
    backgroundColor: C.dark,
    flexDirection: "column",
  },
  ScrollBox(
    {
      width: "100%",
      flexGrow: 1,
      stickyScroll: true,
      stickyStart: "bottom",
      rootOptions: { backgroundColor: C.dark },
      viewportOptions: { backgroundColor: C.dark },
      contentOptions: { backgroundColor: C.dark },
      scrollbarOptions: {
        trackOptions: {
          foregroundColor: C.greenDim,
          backgroundColor: C.border,
        },
      },
    },
    logText,
  ),
);

// ── Footer / Hotkey Bar ──────────────────────────────────────────────────────

function hotkey(key: string, label: string) {
  return Box(
    { flexDirection: "row", gap: 0 },
    Text({ content: t`${bold(fg(C.green)(key))}` }),
    Text({ content: t`${dim(fg(C.muted)(` ${label}`))}` }),
  );
}

const footer = Box(
  {
    width: "100%",
    height: 1,
    flexDirection: "row",
    gap: 2,
    paddingLeft: 1,
    paddingRight: 1,
    alignItems: "center",
    backgroundColor: C.darkLight,
  },
  hotkey("s", "start"),
  hotkey("x", "stop"),
  hotkey("r", "restart"),
  hotkey("t", "network"),
  hotkey("q", "quit"),
  hotkey("^C", "force quit"),
);

// ── Root Layout ──────────────────────────────────────────────────────────────

renderer.root.add(
  Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      backgroundColor: C.dark,
    },
    header,
    Box(
      {
        flexGrow: 1,
        flexDirection: "column",
        padding: 1,
        paddingTop: 0,
        paddingBottom: 0,
        gap: 0,
      },
      statusPanel,
      pathsPanel,
      logsPanel,
    ),
    footer,
  ),
);

// ── UI Updates ───────────────────────────────────────────────────────────────

function formatUptime(startedAt: string | undefined): string {
  if (!startedAt) return "";
  const ms = Date.now() - new Date(startedAt).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60) % 60;
  const h = Math.floor(s / 3600) % 24;
  const d = Math.floor(s / 86400);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function updateUI() {
  const running = status.running;

  // Status dot + label
  statusDot.content = running
    ? t`${fg(C.green)("●")}`
    : t`${fg(C.red)("●")}`;
  statusLabel.content = running
    ? t`${bold(fg(C.green)("Running"))}`
    : t`${bold(fg(C.red)("Stopped"))}`;

  // Info values
  pidValue.content = status.pid ? String(status.pid) : "-";
  rpcValue.content = String(status.rpcPort);
  p2pValue.content = String(status.p2pPort);

  // Network badge
  const net = status.network ?? currentNetwork;
  networkBadge.content = net === "testnet"
    ? t`${bold(fg(C.yellow)("[TESTNET]"))}`
    : t`${dim(fg(C.greenDim)("[MAINNET]"))}`;

  // Uptime
  const up = formatUptime(status.startedAt);
  uptimeText.content = up ? t`${dim(fg(C.muted)(`up ${up}`))}` : "";

  // Error
  if (status.lastError) {
    statusLabel.content = t`${bold(fg(C.red)("Error:"))} ${fg(C.red)(status.lastError)}`;
  }
}

async function refreshLogs() {
  try {
    const result = await manager.readLogs({ sinceBytes: logOffset });
    if (result.content.length > 0) {
      logContent += result.content;
      const lines = logContent.split("\n");
      if (lines.length > 800) {
        logContent = lines.slice(-800).join("\n");
      }
      logOffset = result.to;
      logText.content = logContent;
      logText.fg = C.white;
    }
  } catch {
    // Log file may not exist yet
  }
}

function refreshStatus() {
  status = manager.getStatus();
  updateUI();
}

// ── Keyboard ─────────────────────────────────────────────────────────────────

renderer.keyInput.on("keypress", (key: KeyEvent) => {
  if (key.ctrl && key.name === "c") {
    void manager.stop().then(() => process.exit(0));
    return;
  }

  switch (key.name) {
    case "s": {
      if (!status.running) {
        statusLabel.content = t`${dim(fg(C.cyan)("Starting..."))}`;
        void manager.start({ network: currentNetwork }).then(() => {
          refreshStatus();
        });
      }
      break;
    }
    case "x": {
      if (status.running) {
        statusLabel.content = t`${dim(fg(C.yellow)("Stopping..."))}`;
        void manager.stop().then(() => {
          refreshStatus();
        });
      }
      break;
    }
    case "r": {
      statusLabel.content = t`${dim(fg(C.cyan)("Restarting..."))}`;
      void manager.stop().then(() => {
        logOffset = 0;
        logContent = "";
        logText.content = t`${dim(fg(C.muted)("Waiting for logs..."))}`;
        return manager.start({ network: currentNetwork });
      }).then(() => {
        refreshStatus();
      });
      break;
    }
    case "t": {
      if (!status.running) {
        currentNetwork = currentNetwork === "mainnet" ? "testnet" : "mainnet";
        const defaults = NETWORK_DEFAULTS[currentNetwork];
        status = { ...status, network: currentNetwork, rpcPort: defaults.rpcPort, p2pPort: defaults.p2pPort };
        updateUI();
      }
      break;
    }
    case "q": {
      void manager.stop().then(() => process.exit(0));
      break;
    }
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

updateUI();

setInterval(() => {
  refreshStatus();
  void refreshLogs();
}, 1500);

if (autoStart) {
  statusLabel.content = t`${dim(fg(C.cyan)("Starting..."))}`;
  void manager.start({ network: currentNetwork }).then(() => {
    refreshStatus();
  });
}
