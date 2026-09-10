import React from "react";
import { Card } from "../Card";
import { NodeControlBar } from "../NodeControlBar";
import { LogsPanel } from "../LogsPanel";
import { ROLE_META } from "../../roles";
import type { NodeStatus } from "../../types";

type Props = {
  status: NodeStatus | null;
  isHydrating: boolean;
  busy: boolean;
  logText: string;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
};

export function NodeDashboard({
  status,
  isHydrating,
  busy,
  logText,
  onStart,
  onStop,
}: Props): JSX.Element {
  const meta = ROLE_META.node;
  return (
    <div className="flex flex-col gap-6">
      <Card title={meta.tagline}>
        <p className="text-sm leading-relaxed text-fair-muted">{meta.description}</p>
        <div className="mt-3 inline-flex rounded-lg border border-fair-green/30 bg-fair-green/10 px-3 py-2 text-sm text-fair-green">
          {meta.reward}
        </div>
      </Card>

      <NodeControlBar
        status={status}
        isHydrating={isHydrating}
        busy={busy}
        onStart={onStart}
        onStop={onStop}
      />

      <LogsPanel logText={logText} />
    </div>
  );
}
