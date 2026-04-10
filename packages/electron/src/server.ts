import { randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { promises as fs, createWriteStream, type WriteStream } from "node:fs";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { App, IpcMain } from "electron";
import { z } from "zod";
import type { LogReadRequest, LogReadResult, Network, NodePaths, NodeSettings, NodeStatus } from "../../common/src/ipc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NETWORK_DEFAULTS: Record<Network, { rpcPort: number; p2pPort: number }> = {
  mainnet: { rpcPort: 46373, p2pPort: 46372 },
  testnet: { rpcPort: 46375, p2pPort: 46374 },
};

const nodeSettingsSchema = z.object({
  network: z.union([z.literal("mainnet"), z.literal("testnet")]).optional(),
  rpcPort: z.number().int().positive().optional(),
  p2pPort: z.number().int().positive().optional(),
  rpcUser: z.string().min(1).optional(),
  rpcPassword: z.string().min(1).optional(),
});

const logReadRequestSchema = z.object({
  sinceBytes: z.number().int().nonnegative().optional(),
});

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

export class NodeProcessManager {
  private child: ChildProcess | null = null;
  private logStream: WriteStream | null = null;
  private status: NodeStatus;

  constructor(private readonly paths: NodePaths, private readonly faircoindPath: string) {
    this.status = {
      running: false,
      pid: null,
      network: "mainnet",
      rpcPort: NETWORK_DEFAULTS.mainnet.rpcPort,
      p2pPort: NETWORK_DEFAULTS.mainnet.p2pPort,
      rpcUser: "",
      rpcPassword: "",
      paths,
    };
  }

  getStatus(): NodeStatus {
    return this.status;
  }

  async start(settingsInput: NodeSettings): Promise<NodeStatus> {
    const settings = nodeSettingsSchema.parse(settingsInput satisfies NodeSettings);
    if (this.child) {
      await this.stop();
    }

    const resolved = await this.resolveSettings(settings);
    await this.ensureDirectories();
    await this.writeConf(resolved);
    await this.openLogStream();

    const args = this.buildArgs(resolved);
    const child = spawn(this.faircoindPath, args, { stdio: ["ignore", "pipe", "pipe"] });

    this.child = child;
    this.status = {
      running: true,
      pid: child.pid ?? null,
      network: resolved.network,
      rpcPort: resolved.rpcPort,
      p2pPort: resolved.p2pPort,
      rpcUser: resolved.rpcUser,
      rpcPassword: resolved.rpcPassword,
      startedAt: new Date().toISOString(),
      exitedAt: undefined,
      lastError: undefined,
      paths: this.paths,
    };

    child.stdout.on("data", (data: Buffer) => this.writeLog(data));
    child.stderr.on("data", (data: Buffer) => this.writeLog(data));

    child.once("exit", (code, signal) => {
      this.writeLog(Buffer.from(`faircoind exited with code ${code ?? "unknown"} signal ${signal ?? "unknown"}${os.EOL}`));
      this.status = {
        ...this.status,
        running: false,
        pid: null,
        exitedAt: new Date().toISOString(),
        lastError: code === 0 || code === null ? undefined : `Exited with code ${code} signal ${signal ?? ""}`,
      };
      this.closeLogStream();
      this.child = null;
    });

    child.once("error", (error) => {
      this.writeLog(Buffer.from(`faircoind failed: ${error.message}${os.EOL}`));
      this.status = {
        ...this.status,
        running: false,
        pid: null,
        lastError: error.message,
        exitedAt: new Date().toISOString(),
      };
      this.closeLogStream();
      this.child = null;
    });

    return this.status;
  }

  async stop(): Promise<NodeStatus> {
    if (!this.child) {
      this.status = { ...this.status, running: false, pid: null };
      return this.status;
    }

    const childToStop = this.child;
    return new Promise<NodeStatus>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.writeLog(Buffer.from(`faircoind stop timeout; forcing kill${os.EOL}`));
        childToStop.kill("SIGKILL");
      }, 10000);

      childToStop.once("exit", () => {
        clearTimeout(timeout);
        this.status = {
          ...this.status,
          running: false,
          pid: null,
          exitedAt: new Date().toISOString(),
        };
        this.child = null;
        this.closeLogStream();
        resolve(this.status);
      });

      childToStop.once("error", (error) => {
        clearTimeout(timeout);
        this.status = {
          ...this.status,
          running: false,
          pid: null,
          lastError: error.message,
          exitedAt: new Date().toISOString(),
        };
        this.child = null;
        this.closeLogStream();
        reject(error);
      });

      childToStop.kill("SIGTERM");
    });
  }

  async readLogs(requestInput: LogReadRequest): Promise<LogReadResult> {
    const request = logReadRequestSchema.parse(requestInput satisfies LogReadRequest);
    try {
      const stat = await fs.stat(this.paths.logFile);
      const start = request.sinceBytes && request.sinceBytes < stat.size ? request.sinceBytes : 0;
      const length = stat.size - start;

      if (length <= 0) {
        return { from: stat.size, to: stat.size, content: "" };
      }

      const handle = await fs.open(this.paths.logFile, "r");
      try {
        const buffer = Buffer.alloc(Number(length));
        await handle.read(buffer, 0, Number(length), start);
        return { from: start, to: stat.size, content: buffer.toString("utf8") };
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { from: 0, to: 0, content: "" };
      }
      throw error;
    }
  }

  private async resolveSettings(settings: NodeSettings): Promise<Required<NodeSettings>> {
    const network = settings.network ?? this.status.network ?? "mainnet";
    const defaults = NETWORK_DEFAULTS[network];
    const existingCredentials = await this.readExistingCredentials();
    const rpcUser = settings.rpcUser ?? existingCredentials.rpcUser ?? (this.status.rpcUser || this.randomCredential());
    const rpcPassword = settings.rpcPassword ?? existingCredentials.rpcPassword ?? (this.status.rpcPassword || this.randomCredential());
    const rpcPort = settings.rpcPort ?? this.status.rpcPort ?? defaults.rpcPort;
    const p2pPort = settings.p2pPort ?? this.status.p2pPort ?? defaults.p2pPort;

    return { network, rpcPort, p2pPort, rpcUser, rpcPassword };
  }

  private async readExistingCredentials(): Promise<{ rpcUser?: string; rpcPassword?: string }> {
    try {
      const content = await fs.readFile(this.paths.confFile, "utf8");
      const lines = content.split(/\r?\n/);
      let rpcUser: string | undefined;
      let rpcPassword: string | undefined;
      for (const line of lines) {
        if (line.startsWith("rpcuser=")) {
          rpcUser = line.replace("rpcuser=", "").trim();
        }
        if (line.startsWith("rpcpassword=")) {
          rpcPassword = line.replace("rpcpassword=", "").trim();
        }
      }
      return { rpcUser, rpcPassword };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  private randomCredential(): string {
    return randomBytes(18).toString("base64url");
  }

  private async writeConf(settings: Required<NodeSettings>): Promise<void> {
    const lines = [
      `rpcuser=${settings.rpcUser}`,
      `rpcpassword=${settings.rpcPassword}`,
      `rpcport=${settings.rpcPort}`,
      `port=${settings.p2pPort}`,
      "server=1",
      "listen=1",
      "daemon=0",
      "rpcallowip=127.0.0.1",
      "rpcbind=127.0.0.1",
    ];

    if (settings.network === "testnet") {
      lines.push("testnet=1");
    }

    const confContent = `${lines.join(os.EOL)}${os.EOL}`;
    await fs.mkdir(path.dirname(this.paths.confFile), { recursive: true });
    await fs.writeFile(this.paths.confFile, confContent, { mode: 0o600 });
  }

  private buildArgs(settings: Required<NodeSettings>): string[] {
    const args = [
      `-conf=${this.paths.confFile}`,
      `-datadir=${this.paths.dataDir}`,
      "-server=1",
      "-printtoconsole",
      "-logtimestamps=1",
      `-rpcport=${settings.rpcPort}`,
      `-port=${settings.p2pPort}`,
    ];

    if (settings.network === "testnet") {
      args.push("-testnet");
    }

    return args;
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.paths.configDir, { recursive: true });
    await fs.mkdir(this.paths.dataDir, { recursive: true });
  }

  private async openLogStream(): Promise<void> {
    await fs.mkdir(path.dirname(this.paths.logFile), { recursive: true });
    this.logStream = createWriteStream(this.paths.logFile, { flags: "a" });
  }

  private closeLogStream(): void {
    if (this.logStream) {
      this.logStream.end();
    }
    this.logStream = null;
  }

  private writeLog(chunk: Buffer): void {
    if (!this.logStream) {
      return;
    }
    this.logStream.write(chunk);
  }
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
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    return false;
  }
}

type ElectronHandlers = {
  register: (ipc: IpcMain) => void;
};

export async function createElectronHandlers(app: App): Promise<ElectronHandlers> {
  const paths = await resolveNodePaths();
  const faircoindPath = await locateFaircoindBinary();
  const manager = new NodeProcessManager(paths, faircoindPath);

  const handleGetStatus = async (): Promise<NodeStatus> => manager.getStatus();
  const handleStart = async (_event: unknown, settings: NodeSettings): Promise<NodeStatus> => manager.start(settings);
  const handleStop = async (): Promise<NodeStatus> => manager.stop();
  const handleRestart = async (_event: unknown, settings: NodeSettings): Promise<NodeStatus> => manager.start(settings);
  const handleReadLogs = async (_event: unknown, request: LogReadRequest): Promise<LogReadResult> => manager.readLogs(request);

  return {
    register(ipc) {
      ipc.handle("node:getStatus", handleGetStatus);
      ipc.handle("node:start", handleStart);
      ipc.handle("node:restart", handleRestart);
      ipc.handle("node:stop", handleStop);
      ipc.handle("node:readLogs", handleReadLogs);

      app.on("before-quit", () => {
        void manager.stop();
      });
    },
  };
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
