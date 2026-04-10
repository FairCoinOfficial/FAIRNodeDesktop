export type Network = "mainnet" | "testnet";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export type NodePaths = {
  configDir: string;
  dataDir: string;
  logFile: string;
  confFile: string;
  portableMode: boolean;
};

export type NodeSettings = {
  network?: Network;
  rpcPort?: number;
  p2pPort?: number;
  rpcUser?: string;
  rpcPassword?: string;
};

export type NodeStatus = {
  running: boolean;
  pid: number | null;
  network: Network;
  rpcPort: number;
  p2pPort: number;
  rpcUser: string;
  rpcPassword: string;
  startedAt?: string;
  exitedAt?: string;
  lastError?: string;
  paths: NodePaths;
};

export type LogReadRequest = {
  sinceBytes?: number;
};

export type LogReadResult = {
  from: number;
  to: number;
  content: string;
};

export interface IpcApi {
  getStatus: () => Promise<NodeStatus>;
  startNode: (settings: NodeSettings) => Promise<NodeStatus>;
  restartNode: (settings: NodeSettings) => Promise<NodeStatus>;
  stopNode: () => Promise<NodeStatus>;
  readLogs: (request: LogReadRequest) => Promise<LogReadResult>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}

export {};
