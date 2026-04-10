import React from "react";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import type { NodeStatus } from "../types";

type Props = {
  status: NodeStatus | null;
  logText: string;
  isHydrating: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
};

export function Dashboard({ status, logText, isHydrating, onStart, onStop }: Props) {
  const running = status?.running ?? false;
  const statusTone = running ? "success" : "danger";
  const statusLabel = isHydrating ? "Loading..." : running ? "Running" : "Stopped";

  const infoItems = [
    { label: "Network", value: status?.network ?? "—" },
    { label: "RPC port", value: status?.rpcPort ?? "—" },
    { label: "P2P port", value: status?.p2pPort ?? "—" },
    { label: "RPC user", value: status?.rpcUser ?? "—" },
    { label: "Data dir", value: status?.paths.dataDir ?? "—" },
    { label: "Config dir", value: status?.paths.configDir ?? "—" },
  ];

  const handleStart = async () => {
    await onStart();
  };

  const handleStop = async () => {
    await onStop();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card
        title="Node status"
        actions={<StatusPill label={statusLabel} tone={statusTone} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {infoItems.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</div>
              <div className="text-sm text-slate-100 mt-1">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <button className="btn-primary" onClick={handleStart} disabled={running}>
            Start
          </button>
          <button className="btn-ghost" onClick={handleStop} disabled={!running}>
            Stop
          </button>
        </div>
      </Card>

      <Card title="Logs" actions={<span className="muted">Live tail</span>}>
        <pre className="h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-200 whitespace-pre-wrap">
          {logText.trim().length === 0 ? "No logs yet." : logText}
        </pre>
      </Card>

      <Card title="Paths">
        <div className="flex flex-col gap-3 text-sm text-slate-200">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Data directory</div>
              <div className="text-slate-100 mt-1 break-all">{status?.paths.dataDir ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Config directory</div>
              <div className="text-slate-100 mt-1 break-all">{status?.paths.configDir ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Log file</div>
              <div className="text-slate-100 mt-1 break-all">{status?.paths.logFile ?? "—"}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
