export type Network = "mainnet" | "testnet";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

/**
 * The role a user chooses on first launch. All roles run the SAME faircoind
 * daemon; only the generated faircoin.conf and runtime expectations differ.
 *
 * - node       — plain relay/validate node, supports the network. No wallet actions.
 * - staking    — node + wallet with coins + staking enabled (produces PoS blocks).
 * - masternode — node + 5,000 FAIR collateral + masternode config (services + rewards).
 */
export type NodeRole = "node" | "staking" | "masternode";

export const NODE_ROLES: readonly NodeRole[] = ["node", "staking", "masternode"] as const;

/** Exact masternode collateral required by FairCoin v3. */
export const MASTERNODE_COLLATERAL = 5000;

/** Confirmations the collateral transaction needs before a masternode can start. */
export const MASTERNODE_COLLATERAL_CONFIRMATIONS = 15;

/** Default P2P port; collateral / masternodeaddr advertise this port. */
export const MAINNET_P2P_PORT = 46372;

export type NodePaths = {
  configDir: string;
  dataDir: string;
  logFile: string;
  confFile: string;
  portableMode: boolean;
};

/**
 * Masternode-specific configuration written into faircoin.conf when the role is
 * "masternode". Collected through the guided wizard.
 */
export type MasternodeConfig = {
  /** masternodeprivkey from `masternode genkey`. */
  privKey: string;
  /** Public IP the masternode advertises (externalip / masternodeaddr host). */
  externalIp: string;
};

export type NodeSettings = {
  role?: NodeRole;
  network?: Network;
  rpcPort?: number;
  p2pPort?: number;
  rpcUser?: string;
  rpcPassword?: string;
  /** Only meaningful for the masternode role; ignored otherwise. */
  masternode?: MasternodeConfig | null;
};

export type NodeStatus = {
  running: boolean;
  pid: number | null;
  role: NodeRole;
  network: Network;
  rpcPort: number;
  p2pPort: number;
  rpcUser: string;
  rpcPassword: string;
  /** Reflects whether the masternode config block was written. */
  masternodeConfigured: boolean;
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

/**
 * Snapshot of wallet + staking state for the staking dashboard. Populated from
 * faircoind RPC; every field is optional so the UI can render partial data while
 * the daemon is still syncing.
 */
export type StakingInfo = {
  /** Daemon reachable over RPC. */
  rpcReady: boolean;
  /** Total wallet balance in FAIR. */
  balance?: number;
  /** Whether the wallet currently meets the conditions to stake. */
  stakingEnabled?: boolean;
  /** True once the node is actively searching for stake (kernel scanning). */
  stakingActive?: boolean;
  /** True if the wallet is encrypted (so it may need an unlock to stake). */
  walletEncrypted?: boolean;
  /** True if the wallet is currently unlocked. */
  walletUnlocked?: boolean;
  /** True if the wallet is unlocked for staking only. */
  unlockedForStakingOnly?: boolean;
  /** Number of connected peers. */
  connections?: number;
  /** Current block height of the local chain. */
  blocks?: number;
  /** Free-form human readable reason staking is not active, if any. */
  message?: string;
};

export type MasternodeStatusInfo = {
  rpcReady: boolean;
  /** Raw status string from `masternode status` (e.g. ENABLED, PRE_ENABLED). */
  statusCode?: string;
  /** Human readable status message. */
  statusMessage?: string;
  /** Total enabled masternodes on the network (`masternode count`). */
  networkCount?: number;
  /** Wallet balance in FAIR (to confirm collateral is present). */
  balance?: number;
  connections?: number;
  blocks?: number;
};

/** A single unspent output reported by `masternode outputs`. */
export type MasternodeOutput = {
  txid: string;
  outputIndex: string;
};

export type RpcCallRequest = {
  method: string;
  params?: ReadonlyArray<string | number | boolean>;
};

export type WalletUnlockRequest = {
  passphrase: string;
  /** Seconds to stay unlocked; 0 means until manually locked. */
  timeout?: number;
  /** Unlock for staking/anonymization only (does not allow spending). */
  stakingOnly?: boolean;
};

export interface IpcApi {
  getStatus: () => Promise<NodeStatus>;
  startNode: (settings: NodeSettings) => Promise<NodeStatus>;
  restartNode: (settings: NodeSettings) => Promise<NodeStatus>;
  stopNode: () => Promise<NodeStatus>;
  readLogs: (request: LogReadRequest) => Promise<LogReadResult>;

  /** Persisted role chosen on the welcome screen (null until chosen). */
  getRole: () => Promise<NodeRole | null>;
  setRole: (role: NodeRole) => Promise<NodeRole>;

  /** Staking dashboard data (safe to call even when stopped). */
  getStakingInfo: () => Promise<StakingInfo>;
  /** Masternode dashboard data. */
  getMasternodeStatus: () => Promise<MasternodeStatusInfo>;

  /** Wizard helpers backed by faircoind RPC. */
  getNewAddress: (label?: string) => Promise<string>;
  getMasternodeOutputs: () => Promise<MasternodeOutput[]>;
  generateMasternodeKey: () => Promise<string>;
  startMasternodeAlias: (alias: string) => Promise<string>;
  saveMasternodeConf: (entry: MasternodeConfEntry) => Promise<void>;

  /** Unlock the wallet (e.g. for staking). */
  unlockWallet: (request: WalletUnlockRequest) => Promise<void>;

  /** Escape hatch for advanced/manual RPC; returns the JSON result. */
  rpcCall: (request: RpcCallRequest) => Promise<unknown>;
}

/** One line of masternode.conf: `<alias> <ip>:<port> <privkey> <txid> <index>`. */
export type MasternodeConfEntry = {
  alias: string;
  ip: string;
  port: number;
  privKey: string;
  txid: string;
  outputIndex: string;
};

declare global {
  interface Window {
    api: IpcApi;
  }
}

export {};
