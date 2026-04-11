export const APP_NAME = "FAIRNode Desktop";

export interface NodeInfo {
  id: string;
  version: string;
}

export { NodeProcessManager, resolveNodePaths, locateFaircoindBinary, NETWORK_DEFAULTS } from "./node-manager.js";
export type { Network, NodePaths, NodeSettings, NodeStatus, LogReadRequest, LogReadResult, IpcApi, LogLevel } from "./ipc.js";
