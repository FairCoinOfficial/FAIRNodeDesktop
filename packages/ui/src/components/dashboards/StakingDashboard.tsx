import React from "react";
import { Card } from "../Card";
import { StatusPill } from "../StatusPill";
import { InfoTile } from "../InfoTile";
import { NodeControlBar } from "../NodeControlBar";
import { LogsPanel } from "../LogsPanel";
import { WalletUnlockForm } from "../WalletUnlockForm";
import { ROLE_META } from "../../roles";
import type { NodeStatus, StakingInfo } from "../../types";

type Props = {
  status: NodeStatus | null;
  isHydrating: boolean;
  busy: boolean;
  logText: string;
  staking: StakingInfo | null;
  stakingLoading: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onUnlock: (passphrase: string) => Promise<void>;
};

type StakeView = {
  tone: "success" | "warning" | "danger" | "info";
  label: string;
  detail: string;
};

function deriveStakeView(running: boolean, staking: StakingInfo | null): StakeView {
  if (!running) {
    return { tone: "danger", label: "Stopped", detail: "Start the node to begin staking." };
  }
  if (!staking || !staking.rpcReady) {
    return {
      tone: "info",
      label: "Connecting…",
      detail: staking?.message ?? "Waiting for the wallet to come online.",
    };
  }
  if (staking.walletEncrypted && staking.walletUnlocked === false) {
    return {
      tone: "warning",
      label: "Locked",
      detail: "Unlock your wallet for staking below.",
    };
  }
  if ((staking.balance ?? 0) <= 0) {
    return {
      tone: "warning",
      label: "No coins",
      detail: "Receive some FAIR into this wallet to start staking.",
    };
  }
  if (staking.stakingActive) {
    return {
      tone: "success",
      label: "Staking active",
      detail: "Your node is staking. Keep it online to earn rewards.",
    };
  }
  return {
    tone: "warning",
    label: "Searching",
    detail: "Coins are maturing. Staking begins once they have been online long enough.",
  };
}

export function StakingDashboard({
  status,
  isHydrating,
  busy,
  logText,
  staking,
  stakingLoading,
  onStart,
  onStop,
  onUnlock,
}: Props): JSX.Element {
  const meta = ROLE_META.staking;
  const running = status?.running ?? false;
  const view = deriveStakeView(running, staking);
  const showUnlock =
    running &&
    staking?.rpcReady === true &&
    staking.walletEncrypted === true &&
    staking.walletUnlocked === false;

  const balance = staking?.balance;
  const balanceText =
    balance === undefined ? (stakingLoading ? "…" : "—") : `${balance.toLocaleString()} FAIR`;

  return (
    <div className="flex flex-col gap-6">
      <Card title={meta.tagline}>
        <p className="text-sm leading-relaxed text-fair-muted">{meta.description}</p>
      </Card>

      <NodeControlBar
        status={status}
        isHydrating={isHydrating}
        busy={busy}
        onStart={onStart}
        onStop={onStop}
      />

      <Card title="Staking" actions={<StatusPill label={view.label} tone={view.tone} />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Wallet balance" value={balanceText} />
          <InfoTile label="Peers" value={staking?.connections ?? (stakingLoading ? "…" : "—")} />
          <InfoTile label="Block height" value={staking?.blocks ?? (stakingLoading ? "…" : "—")} />
        </div>

        <p className="mt-4 text-sm text-fair-muted">{view.detail}</p>

        <div className="mt-4 rounded-xl border border-fair-green/30 bg-fair-green/10 px-4 py-3 text-sm text-fair-green">
          Tip: your coins must stay online and mature (about 2 hours) before they can stake. Keep
          this app running and your wallet unlocked for staking.
        </div>

        {showUnlock && (
          <div className="mt-4 border-t border-fair-border pt-4">
            <WalletUnlockForm onUnlock={onUnlock} />
          </div>
        )}
      </Card>

      <LogsPanel logText={logText} />
    </div>
  );
}
