export const APP_NAME = "FAIRNode Desktop";

export interface NodeInfo {
  id: string;
  version: string;
}

export {
  NodeProcessManager,
  resolveNodePaths,
  locateFaircoindBinary,
  buildFaircoinConf,
  buildFaircoindArgs,
  buildMasternodeConfLine,
  NETWORK_DEFAULTS,
  DEFAULT_ROLE,
} from "./node-manager.js";
export type { ResolvedNodeSettings } from "./node-manager.js";
export { readPersistedRole, writePersistedRole, upsertMasternodeConf } from "./role-store.js";
export {
  NODE_ROLES,
  MASTERNODE_COLLATERAL,
  MASTERNODE_COLLATERAL_CONFIRMATIONS,
  MAINNET_P2P_PORT,
} from "./ipc.js";
export type {
  Network,
  NodePaths,
  NodeRole,
  NodeSettings,
  NodeStatus,
  MasternodeConfig,
  MasternodeConfEntry,
  StakingInfo,
  MasternodeStatusInfo,
  MasternodeOutput,
  RpcCallRequest,
  WalletUnlockRequest,
  LogReadRequest,
  LogReadResult,
  IpcApi,
  LogLevel,
} from "./ipc.js";
