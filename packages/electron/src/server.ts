import path from "node:path";
import { promises as fs } from "node:fs";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import type { App, IpcMain } from "electron";
import { z } from "zod";
import { NodeProcessManager } from "../../common/src/node-manager.js";
import type {
  LogReadRequest,
  LogReadResult,
  MasternodeConfEntry,
  MasternodeOutput,
  MasternodeStatusInfo,
  NodePaths,
  NodeRole,
  NodeSettings,
  NodeStatus,
  RpcCallRequest,
  StakingInfo,
  WalletUnlockRequest,
} from "../../common/src/ipc.js";
import {
  readPersistedRole,
  writePersistedRole,
  upsertMasternodeConf,
} from "../../common/src/role-store.js";
import { FaircoindRpcClient, RpcError } from "./rpc-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const masternodeConfigSchema = z
  .object({
    privKey: z.string().min(1),
    externalIp: z.string().min(1),
  })
  .nullable();

const nodeSettingsSchema = z.object({
  role: z.union([z.literal("node"), z.literal("staking"), z.literal("masternode")]).optional(),
  network: z.union([z.literal("mainnet"), z.literal("testnet")]).optional(),
  rpcPort: z.number().int().positive().optional(),
  p2pPort: z.number().int().positive().optional(),
  rpcUser: z.string().min(1).optional(),
  rpcPassword: z.string().min(1).optional(),
  masternode: masternodeConfigSchema.optional(),
});

const logReadRequestSchema = z.object({
  sinceBytes: z.number().int().nonnegative().optional(),
});

const roleSchema = z.union([z.literal("node"), z.literal("staking"), z.literal("masternode")]);

const rpcCallSchema = z.object({
  method: z.string().min(1),
  params: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const walletUnlockSchema = z.object({
  passphrase: z.string().min(1),
  timeout: z.number().int().nonnegative().optional(),
  stakingOnly: z.boolean().optional(),
});

const masternodeConfEntrySchema = z.object({
  alias: z.string().min(1),
  ip: z.string().min(1),
  port: z.number().int().positive(),
  privKey: z.string().min(1),
  txid: z.string().min(1),
  outputIndex: z.string().min(1),
});

type ElectronHandlers = {
  register: (ipc: IpcMain) => void;
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

export async function createElectronHandlers(app: App): Promise<ElectronHandlers> {
  const paths = await resolveNodePaths();
  const faircoindPath = await locateFaircoindBinary();
  const manager = new NodeProcessManager(paths, faircoindPath);

  const rpcClient = (): FaircoindRpcClient => {
    const status = manager.getStatus();
    return new FaircoindRpcClient({
      host: "127.0.0.1",
      port: status.rpcPort,
      user: status.rpcUser,
      password: status.rpcPassword,
    });
  };

  const handleGetStatus = async (): Promise<NodeStatus> => manager.getStatus();

  const handleStart = async (_event: unknown, settingsInput: NodeSettings): Promise<NodeStatus> => {
    const settings = nodeSettingsSchema.parse(settingsInput);
    if (settings.role) {
      await writePersistedRole(paths, settings.role);
    }
    return manager.start(settings);
  };

  const handleStop = async (): Promise<NodeStatus> => manager.stop();

  const handleRestart = async (
    _event: unknown,
    settingsInput: NodeSettings,
  ): Promise<NodeStatus> => {
    const settings = nodeSettingsSchema.parse(settingsInput);
    if (settings.role) {
      await writePersistedRole(paths, settings.role);
    }
    return manager.start(settings);
  };

  const handleReadLogs = async (
    _event: unknown,
    requestInput: LogReadRequest,
  ): Promise<LogReadResult> => {
    const request = logReadRequestSchema.parse(requestInput);
    return manager.readLogs(request);
  };

  const handleGetRole = async (): Promise<NodeRole | null> => readPersistedRole(paths);

  const handleSetRole = async (_event: unknown, roleInput: NodeRole): Promise<NodeRole> => {
    const role = roleSchema.parse(roleInput);
    await writePersistedRole(paths, role);
    return role;
  };

  const handleGetStakingInfo = async (): Promise<StakingInfo> => {
    if (!manager.getStatus().running) {
      return { rpcReady: false, message: "Node is not running." };
    }
    const client = rpcClient();
    try {
      const info: StakingInfo = { rpcReady: true };

      // getstakinginfo / getstakingstatus naming differs across forks; try both.
      const stakingStatus = await client
        .call<Record<string, unknown>>("getstakingstatus")
        .catch(() => null);

      if (stakingStatus) {
        info.stakingEnabled = toBoolean(
          stakingStatus["staking_enabled"] ?? stakingStatus["enabled"],
        );
        info.stakingActive =
          toBoolean(stakingStatus["staking_active"] ?? stakingStatus["staking status"]) ??
          toBoolean(stakingStatus["mintablecoins"]);
        info.walletUnlocked = toBoolean(stakingStatus["walletunlocked"]);
      }

      const walletInfo = await client
        .call<Record<string, unknown>>("getwalletinfo")
        .catch(() => null);
      if (walletInfo) {
        info.balance = toNumber(walletInfo["balance"]);
        const unlockedUntil = toNumber(walletInfo["unlocked_until"]);
        if (unlockedUntil !== undefined) {
          info.walletEncrypted = true;
          info.walletUnlocked = unlockedUntil > 0;
        } else {
          info.walletEncrypted = false;
        }
      }

      if (info.balance === undefined) {
        info.balance = await client.call<number>("getbalance").catch(() => undefined);
      }

      const peers = await client.call<number>("getconnectioncount").catch(() => undefined);
      if (peers !== undefined) {
        info.connections = peers;
      }

      info.blocks = await client.call<number>("getblockcount").catch(() => undefined);

      if (info.stakingActive === undefined && info.balance !== undefined) {
        info.stakingActive = false;
      }

      return info;
    } catch (error) {
      return {
        rpcReady: false,
        message: error instanceof RpcError ? error.message : "RPC not ready yet.",
      };
    }
  };

  const handleGetMasternodeStatus = async (): Promise<MasternodeStatusInfo> => {
    if (!manager.getStatus().running) {
      return { rpcReady: false };
    }
    const client = rpcClient();
    try {
      const info: MasternodeStatusInfo = { rpcReady: true };

      const status = await client
        .call<Record<string, unknown>>("masternode", ["status"])
        .catch(() => null);
      if (status) {
        const code = status["status"];
        info.statusCode = typeof code === "string" ? code : toNumber(code)?.toString();
        const message = status["message"];
        info.statusMessage = typeof message === "string" ? message : undefined;
      }

      info.networkCount = await client.call<number>("masternode", ["count"]).catch(() => undefined);
      info.balance = await client.call<number>("getbalance").catch(() => undefined);
      info.connections = await client.call<number>("getconnectioncount").catch(() => undefined);
      info.blocks = await client.call<number>("getblockcount").catch(() => undefined);

      return info;
    } catch {
      return { rpcReady: false };
    }
  };

  const handleGetNewAddress = async (_event: unknown, label?: string): Promise<string> => {
    const client = rpcClient();
    return client.call<string>("getnewaddress", label ? [label] : []);
  };

  const handleGetMasternodeOutputs = async (): Promise<MasternodeOutput[]> => {
    const client = rpcClient();
    const raw = await client.call<unknown>("masternode", ["outputs"]);
    // Older forks return a map { "txid-index": value }; newer return an array.
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            const record = item as Record<string, unknown>;
            const txid = record["txhash"] ?? record["txid"];
            const index = record["outputidx"] ?? record["outputIndex"] ?? record["vout"];
            if (typeof txid === "string") {
              return { txid, outputIndex: toNumber(index)?.toString() ?? "0" };
            }
          }
          return null;
        })
        .filter((value): value is MasternodeOutput => value !== null);
    }
    if (typeof raw === "object" && raw !== null) {
      return Object.entries(raw as Record<string, unknown>).map(([key, value]) => {
        const dash = key.indexOf("-");
        if (dash > -1) {
          return { txid: key.slice(0, dash), outputIndex: key.slice(dash + 1) };
        }
        return { txid: key, outputIndex: toNumber(value)?.toString() ?? "0" };
      });
    }
    return [];
  };

  const handleGenerateMasternodeKey = async (): Promise<string> => {
    const client = rpcClient();
    return client.call<string>("masternode", ["genkey"]);
  };

  const handleStartMasternodeAlias = async (
    _event: unknown,
    aliasInput: string,
  ): Promise<string> => {
    const alias = z.string().min(1).parse(aliasInput);
    const client = rpcClient();
    const result = await client.call<unknown>("masternode", ["start-alias", alias]);
    return JSON.stringify(result);
  };

  const handleSaveMasternodeConf = async (
    _event: unknown,
    entryInput: MasternodeConfEntry,
  ): Promise<void> => {
    const entry = masternodeConfEntrySchema.parse(entryInput);
    await upsertMasternodeConf(paths, entry);
  };

  const handleUnlockWallet = async (
    _event: unknown,
    requestInput: WalletUnlockRequest,
  ): Promise<void> => {
    const request = walletUnlockSchema.parse(requestInput);
    const client = rpcClient();
    const timeout = request.timeout ?? 0;
    const params: Array<string | number | boolean> = [request.passphrase, timeout];
    if (request.stakingOnly) {
      params.push(true);
    }
    await client.call<null>("walletpassphrase", params);
  };

  const handleRpcCall = async (_event: unknown, requestInput: RpcCallRequest): Promise<unknown> => {
    const request = rpcCallSchema.parse(requestInput);
    const client = rpcClient();
    return client.call<unknown>(request.method, request.params ?? []);
  };

  return {
    register(ipc) {
      ipc.handle("node:getStatus", handleGetStatus);
      ipc.handle("node:start", handleStart);
      ipc.handle("node:restart", handleRestart);
      ipc.handle("node:stop", handleStop);
      ipc.handle("node:readLogs", handleReadLogs);
      ipc.handle("node:getRole", handleGetRole);
      ipc.handle("node:setRole", handleSetRole);
      ipc.handle("node:getStakingInfo", handleGetStakingInfo);
      ipc.handle("node:getMasternodeStatus", handleGetMasternodeStatus);
      ipc.handle("node:getNewAddress", handleGetNewAddress);
      ipc.handle("node:getMasternodeOutputs", handleGetMasternodeOutputs);
      ipc.handle("node:generateMasternodeKey", handleGenerateMasternodeKey);
      ipc.handle("node:startMasternodeAlias", handleStartMasternodeAlias);
      ipc.handle("node:saveMasternodeConf", handleSaveMasternodeConf);
      ipc.handle("node:unlockWallet", handleUnlockWallet);
      ipc.handle("node:rpcCall", handleRpcCall);

      app.on("before-quit", () => {
        void manager.stop();
      });
    },
  };
}

export async function resolveNodePaths(): Promise<NodePaths> {
  const resourcesDir = process.resourcesPath;
  const portableBase = path.join(path.dirname(resourcesDir), ".config");
  if (await isWritableDirectory(portableBase)) {
    const dataDir = path.join(path.dirname(resourcesDir), "data");
    return {
      configDir: portableBase,
      dataDir,
      logFile: path.join(portableBase, "fairnode.log"),
      confFile: path.join(portableBase, "faircoin.conf"),
      portableMode: true,
    };
  }

  const home = os.homedir();
  let base: string;
  if (process.platform === "darwin") {
    base = path.join(home, "Library", "Application Support", "FairCoinNode");
  } else if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    base = path.join(appData, "FairCoinNode");
  } else {
    base = path.join(home, ".config", "FairCoinNode");
  }

  return {
    configDir: base,
    dataDir: path.join(base, "data"),
    logFile: path.join(base, "fairnode.log"),
    confFile: path.join(base, "faircoin.conf"),
    portableMode: false,
  };
}

async function isWritableDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return false;
    }
    await fs.access(dirPath, fsConstants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function locateFaircoindBinary(): Promise<string> {
  const platform = process.platform;
  const arch = process.arch;
  const filename = platform === "win32" ? "faircoind.exe" : "faircoind";

  const candidates: string[] = [];

  // Production: binaries inside app resources
  const resourcesDir = process.resourcesPath;
  candidates.push(path.join(resourcesDir, "bin", platform, arch, filename));
  candidates.push(path.join(resourcesDir, "bin", platform, filename));

  // Development: binaries in repo root resources/bin
  if (process.env.NODE_ENV === "development") {
    const repoRoot = path.resolve(__dirname, "../../..");
    candidates.push(path.join(repoRoot, "resources", "bin", platform, arch, filename));
    candidates.push(path.join(repoRoot, "resources", "bin", platform, filename));
  }

  return ensureExecutable(candidates);
}

async function ensureExecutable(candidatePaths: string[]): Promise<string> {
  for (const candidate of candidatePaths) {
    try {
      await fs.access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`faircoind executable not found in: ${candidatePaths.join(", ")}`);
}
