import { contextBridge, ipcRenderer } from "electron";
import { z } from "zod";
import type { IpcApi, LogReadRequest, LogReadResult, NodeSettings, NodeStatus } from "../../common/src/ipc.js";

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
};

contextBridge.exposeInMainWorld("api", api);
