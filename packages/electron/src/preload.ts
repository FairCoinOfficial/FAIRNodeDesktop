import { contextBridge, ipcRenderer } from "electron";
import { z } from "zod";
import type {
  IpcApi,
  LogReadRequest,
  LogReadResult,
  MasternodeConfEntry,
  MasternodeOutput,
  MasternodeStatusInfo,
  NodeRole,
  NodeSettings,
  NodeStatus,
  RpcCallRequest,
  StakingInfo,
  WalletUnlockRequest,
} from "../../common/src/ipc.js";

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

const api: IpcApi = {
  async getStatus(): Promise<NodeStatus> {
    const status = await ipcRenderer.invoke("node:getStatus");
    return status as NodeStatus;
  },
  async startNode(settings: NodeSettings): Promise<NodeStatus> {
    const parsed = nodeSettingsSchema.parse(settings satisfies NodeSettings);
    const status = await ipcRenderer.invoke("node:start", parsed);
    return status as NodeStatus;
  },
  async restartNode(settings: NodeSettings): Promise<NodeStatus> {
    const parsed = nodeSettingsSchema.parse(settings satisfies NodeSettings);
    const status = await ipcRenderer.invoke("node:restart", parsed);
    return status as NodeStatus;
  },
  async stopNode(): Promise<NodeStatus> {
    const status = await ipcRenderer.invoke("node:stop");
    return status as NodeStatus;
  },
  async readLogs(request: LogReadRequest): Promise<LogReadResult> {
    const parsed = logReadRequestSchema.parse(request satisfies LogReadRequest);
    const result = await ipcRenderer.invoke("node:readLogs", parsed);
    return result as LogReadResult;
  },
  async getRole(): Promise<NodeRole | null> {
    const role = await ipcRenderer.invoke("node:getRole");
    return role as NodeRole | null;
  },
  async setRole(role: NodeRole): Promise<NodeRole> {
    const parsed = roleSchema.parse(role);
    const result = await ipcRenderer.invoke("node:setRole", parsed);
    return result as NodeRole;
  },
  async getStakingInfo(): Promise<StakingInfo> {
    const info = await ipcRenderer.invoke("node:getStakingInfo");
    return info as StakingInfo;
  },
  async getMasternodeStatus(): Promise<MasternodeStatusInfo> {
    const info = await ipcRenderer.invoke("node:getMasternodeStatus");
    return info as MasternodeStatusInfo;
  },
  async getNewAddress(label?: string): Promise<string> {
    const parsed = label === undefined ? undefined : z.string().min(1).parse(label);
    const address = await ipcRenderer.invoke("node:getNewAddress", parsed);
    return address as string;
  },
  async getMasternodeOutputs(): Promise<MasternodeOutput[]> {
    const outputs = await ipcRenderer.invoke("node:getMasternodeOutputs");
    return outputs as MasternodeOutput[];
  },
  async generateMasternodeKey(): Promise<string> {
    const key = await ipcRenderer.invoke("node:generateMasternodeKey");
    return key as string;
  },
  async startMasternodeAlias(alias: string): Promise<string> {
    const parsed = z.string().min(1).parse(alias);
    const result = await ipcRenderer.invoke("node:startMasternodeAlias", parsed);
    return result as string;
  },
  async saveMasternodeConf(entry: MasternodeConfEntry): Promise<void> {
    const parsed = masternodeConfEntrySchema.parse(entry satisfies MasternodeConfEntry);
    await ipcRenderer.invoke("node:saveMasternodeConf", parsed);
  },
  async unlockWallet(request: WalletUnlockRequest): Promise<void> {
    const parsed = walletUnlockSchema.parse(request satisfies WalletUnlockRequest);
    await ipcRenderer.invoke("node:unlockWallet", parsed);
  },
  async rpcCall(request: RpcCallRequest): Promise<unknown> {
    const parsed = rpcCallSchema.parse(request satisfies RpcCallRequest);
    return ipcRenderer.invoke("node:rpcCall", parsed);
  },
};

contextBridge.exposeInMainWorld("api", api);
