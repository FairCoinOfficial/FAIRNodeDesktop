import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { MasternodeConfEntry, NodePaths, NodeRole } from "./ipc.js";
import { NODE_ROLES } from "./ipc.js";
import { buildMasternodeConfLine } from "./node-manager.js";

const ROLE_FILE = "role.json";

type RoleFile = {
  role: NodeRole;
};

function isNodeRole(value: unknown): value is NodeRole {
  return typeof value === "string" && (NODE_ROLES as readonly string[]).includes(value);
}

/**
 * Persists the role the user selected on the welcome screen next to the node
 * config so it survives restarts. Returns null on first launch (no choice yet).
 * Shared by the Electron app and the CLI so both read/write the same file.
 */
export async function readPersistedRole(paths: NodePaths): Promise<NodeRole | null> {
  const file = path.join(paths.configDir, ROLE_FILE);
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "role" in parsed &&
      isNodeRole((parsed as { role: unknown }).role)
    ) {
      return (parsed as RoleFile).role;
    }
    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writePersistedRole(paths: NodePaths, role: NodeRole): Promise<void> {
  const file = path.join(paths.configDir, ROLE_FILE);
  await fs.mkdir(paths.configDir, { recursive: true });
  const payload: RoleFile = { role };
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}${os.EOL}`, { mode: 0o600 });
}

/**
 * Appends (or replaces, by alias) a masternode.conf entry. faircoind reads this
 * file to know which aliases it can `start-alias`.
 */
export async function upsertMasternodeConf(
  paths: NodePaths,
  entry: MasternodeConfEntry,
): Promise<void> {
  const file = path.join(paths.configDir, "masternode.conf");
  const line = buildMasternodeConfLine(entry);

  let existing = "";
  try {
    existing = await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const kept = existing
    .split(/\r?\n/)
    .filter((rawLine) => {
      const trimmed = rawLine.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        return false;
      }
      // Drop any prior entry that used the same alias.
      return trimmed.split(/\s+/)[0] !== entry.alias;
    })
    .map((rawLine) => rawLine.trim());

  const header = "# masternode.conf — managed by FAIRNode Desktop";
  const content = `${[header, ...kept, line].join(os.EOL)}${os.EOL}`;
  await fs.mkdir(paths.configDir, { recursive: true });
  await fs.writeFile(file, content, { mode: 0o600 });
}
