import React from "react";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { InfoTile } from "./InfoTile";
import type { NodeStatus } from "../types";

type Props = {
  status: NodeStatus | null;
  isHydrating: boolean;
  busy: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
};

export function NodeControlBar({ status, isHydrating, busy, onStart, onStop }: Props): JSX.Element {
  const running = status?.running ?? false;
  const tone = running ? "success" : status?.lastError ? "danger" : "warning";
  const label = isHydrating
    ? "Loading…"
    : running
      ? "Running"
      : status?.lastError
        ? "Error"
        : "Stopped";

  const tiles = [
    { label: "Network", value: status?.network ?? "—" },
    { label: "P2P port", value: status?.p2pPort ?? "—" },
    { label: "RPC port", value: status?.rpcPort ?? "—" },
    { label: "Data dir", value: status?.paths.dataDir ?? "—", breakAll: true },
  ];

  return (
    <Card title="Node status" actions={<StatusPill label={label} tone={tone} />}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <InfoTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            breakAll={tile.breakAll}
          />
        ))}
      </div>

      {status?.lastError && (
        <div className="mt-4 rounded-xl border border-red-600/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {status.lastError}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
          onClick={() => void onStart()}
          disabled={running || busy}
        >
          {busy && !running ? "Starting…" : "Start"}
        </button>
        <button
          type="button"
          className="rounded-full border border-fair-green bg-transparent px-6 py-2 font-semibold text-fair-green transition-opacity disabled:opacity-50"
          onClick={() => void onStop()}
          disabled={!running || busy}
        >
          Stop
        </button>
      </div>
    </Card>
  );
}
