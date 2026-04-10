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
            <div
              key={item.label}
              className="bg-fair-dark border border-fair-border rounded-xl px-4 py-3"
            >
              <div className="text-fair-muted text-xs uppercase tracking-wide">
                {item.label}
              </div>
              <div className="text-white text-sm mt-1">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          <button
            className="rounded-full bg-fair-green text-fair-dark font-semibold py-2 px-6 transition-opacity disabled:opacity-50"
            onClick={handleStart}
            disabled={running}
          >
            Start
          </button>
          <button
            className="rounded-full border border-fair-green bg-transparent text-fair-green font-semibold py-2 px-6 transition-opacity disabled:opacity-50"
            onClick={handleStop}
            disabled={!running}
          >
            Stop
          </button>
        </div>
      </Card>

      <Card title="Logs" actions={<span className="text-fair-muted text-xs">Live tail</span>}>
        <pre className="h-64 overflow-y-auto rounded-xl border border-fair-border bg-fair-dark px-4 py-3 font-mono text-xs text-white whitespace-pre-wrap">
          {logText.trim().length === 0 ? "No logs yet." : logText}
        </pre>
      </Card>

      <Card title="Paths">
        <div className="flex flex-col gap-3">
          <div className="bg-fair-dark border border-fair-border rounded-xl px-4 py-3">
            <div className="text-fair-muted text-xs uppercase tracking-wide">Data directory</div>
            <div className="text-white text-sm mt-1 break-all">{status?.paths.dataDir ?? "—"}</div>
          </div>
          <div className="bg-fair-dark border border-fair-border rounded-xl px-4 py-3">
            <div className="text-fair-muted text-xs uppercase tracking-wide">Config directory</div>
            <div className="text-white text-sm mt-1 break-all">{status?.paths.configDir ?? "—"}</div>
          </div>
          <div className="bg-fair-dark border border-fair-border rounded-xl px-4 py-3">
            <div className="text-fair-muted text-xs uppercase tracking-wide">Log file</div>
            <div className="text-white text-sm mt-1 break-all">{status?.paths.logFile ?? "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
