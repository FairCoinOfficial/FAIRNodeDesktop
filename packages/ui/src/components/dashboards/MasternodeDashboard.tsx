import React from "react";
import { Card } from "../Card";
import { StatusPill } from "../StatusPill";
import { InfoTile } from "../InfoTile";
import { NodeControlBar } from "../NodeControlBar";
import { LogsPanel } from "../LogsPanel";
import { MasternodeWizard } from "../MasternodeWizard";
import { ROLE_META } from "../../roles";
import { MASTERNODE_COLLATERAL } from "../../../../common/src/ipc";
import type { MasternodeStatusInfo, NodeStatus } from "../../types";

type Props = {
  status: NodeStatus | null;
  isHydrating: boolean;
  busy: boolean;
  logText: string;
  masternode: MasternodeStatusInfo | null;
  masternodeLoading: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onApplyConfig: (config: {
    alias: string;
    privKey: string;
    externalIp: string;
    txid: string;
    outputIndex: string;
  }) => Promise<void>;
};

export function MasternodeDashboard({
  status,
  isHydrating,
  busy,
  logText,
  masternode,
  masternodeLoading,
  onStart,
  onStop,
  onApplyConfig,
}: Props): JSX.Element {
  const meta = ROLE_META.masternode;
  const running = status?.running ?? false;
  const configured = status?.masternodeConfigured ?? false;
  const statusCode = masternode?.statusCode ?? "";
  const isEnabled = statusCode.toUpperCase().includes("ENABLED");

  return (
    <div className="flex flex-col gap-6">
      <Card title={meta.tagline}>
        <p className="text-sm leading-relaxed text-fair-muted">{meta.description}</p>
        <div className="mt-3 inline-flex rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          {MASTERNODE_COLLATERAL.toLocaleString()} FAIR collateral is a refundable deposit — it is
          never spent and stays in your control.
        </div>
      </Card>

      <NodeControlBar
        status={status}
        isHydrating={isHydrating}
        busy={busy}
        onStart={onStart}
        onStop={onStop}
      />

      {configured ? (
        <Card
          title="Masternode status"
          actions={
            <StatusPill
              label={isEnabled ? "ENABLED" : statusCode || (running ? "Starting…" : "Stopped")}
              tone={isEnabled ? "success" : running ? "warning" : "danger"}
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile
              label="Network masternodes"
              value={masternode?.networkCount ?? (masternodeLoading ? "…" : "—")}
            />
            <InfoTile
              label="Collateral balance"
              value={
                masternode?.balance === undefined
                  ? masternodeLoading
                    ? "…"
                    : "—"
                  : `${masternode.balance.toLocaleString()} FAIR`
              }
            />
            <InfoTile
              label="Peers"
              value={masternode?.connections ?? (masternodeLoading ? "…" : "—")}
            />
          </div>
          {masternode?.statusMessage && (
            <p className="mt-4 text-sm text-fair-muted">{masternode.statusMessage}</p>
          )}
          {!isEnabled && running && (
            <p className="mt-4 text-sm text-fair-muted">
              Waiting for the network to confirm your masternode. This can take a few minutes after
              starting.
            </p>
          )}
        </Card>
      ) : (
        <MasternodeWizard
          running={running}
          masternode={masternode}
          onApplyConfig={onApplyConfig}
          onStart={onStart}
        />
      )}

      <LogsPanel logText={logText} />
    </div>
  );
}
