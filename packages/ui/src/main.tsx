import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { DashboardHeader } from "./components/DashboardHeader";
import { NodeDashboard } from "./components/dashboards/NodeDashboard";
import { StakingDashboard } from "./components/dashboards/StakingDashboard";
import { MasternodeDashboard } from "./components/dashboards/MasternodeDashboard";
import { useNodeData } from "./hooks/useNodeData";
import { useRole } from "./hooks/useRole";
import { useStakingInfo, useMasternodeStatus } from "./hooks/usePolledRpc";
import { MAINNET_P2P_PORT } from "../../common/src/ipc";
import type { Network, NodeRole } from "./types";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

const App = (): JSX.Element => {
  const { role, isLoading, chooseRole, reopenWelcome, showWelcome } = useRole();
  const {
    status,
    isHydrating,
    logText,
    logSize,
    start,
    restart,
    stop,
    refreshStatus,
    readLogs,
    unlockWallet,
  } = useNodeData();
  const [network, setNetwork] = React.useState<Network>("mainnet");
  const [busy, setBusy] = React.useState(false);

  // Only poll role-specific RPC while that role's dashboard is active and running.
  const running = status?.running ?? false;
  const stakingPoll = useStakingInfo(!showWelcome && role === "staking" && running);
  const masternodePoll = useMasternodeStatus(!showWelcome && role === "masternode" && running);

  const effectiveNetwork = status?.network ?? network;

  const startWithRole = React.useCallback(
    async (nextRole: NodeRole) => {
      setBusy(true);
      try {
        await start({ role: nextRole, network: effectiveNetwork });
        await refreshStatus();
        await readLogs(0);
      } finally {
        setBusy(false);
      }
    },
    [start, refreshStatus, readLogs, effectiveNetwork],
  );

  const handleStart = React.useCallback(async () => {
    if (!role) {
      return;
    }
    await startWithRole(role);
  }, [role, startWithRole]);

  const handleStop = React.useCallback(async () => {
    setBusy(true);
    try {
      await stop();
    } finally {
      setBusy(false);
    }
  }, [stop]);

  // Welcome confirmation: persist the role and immediately launch the node for it.
  const handleConfirmRole = React.useCallback(
    async (chosen: NodeRole) => {
      await chooseRole(chosen);
      await startWithRole(chosen);
    },
    [chooseRole, startWithRole],
  );

  const handleUnlock = React.useCallback(
    async (passphrase: string) => {
      await unlockWallet({ passphrase, timeout: 0, stakingOnly: true });
      await stakingPoll.refresh();
    },
    [unlockWallet, stakingPoll],
  );

  const handleApplyMasternodeConfig = React.useCallback(
    async (config: {
      alias: string;
      privKey: string;
      externalIp: string;
      txid: string;
      outputIndex: string;
    }) => {
      await window.api.saveMasternodeConf({
        alias: config.alias,
        ip: config.externalIp,
        port: MAINNET_P2P_PORT,
        privKey: config.privKey,
        txid: config.txid,
        outputIndex: config.outputIndex,
      });
      setBusy(true);
      try {
        await restart({
          role: "masternode",
          network: effectiveNetwork,
          masternode: { privKey: config.privKey, externalIp: config.externalIp },
        });
        await refreshStatus();
        await readLogs(0);
      } finally {
        setBusy(false);
      }
    },
    [restart, refreshStatus, readLogs, effectiveNetwork],
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fair-dark font-body">
        <span className="text-fair-muted">Loading…</span>
      </main>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        initialRole={role}
        network={network}
        onNetworkChange={setNetwork}
        onConfirm={handleConfirmRole}
        onCancel={role ? reopenWelcome : undefined}
      />
    );
  }

  const activeRole = role ?? "node";

  return (
    <main className="min-h-screen bg-fair-dark font-body">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <DashboardHeader role={activeRole} logSize={logSize} onChangeRole={reopenWelcome} />

        {activeRole === "node" && (
          <NodeDashboard
            status={status}
            isHydrating={isHydrating}
            busy={busy}
            logText={logText}
            onStart={handleStart}
            onStop={handleStop}
          />
        )}

        {activeRole === "staking" && (
          <StakingDashboard
            status={status}
            isHydrating={isHydrating}
            busy={busy}
            logText={logText}
            staking={stakingPoll.data}
            stakingLoading={stakingPoll.isInitialLoading}
            onStart={handleStart}
            onStop={handleStop}
            onUnlock={handleUnlock}
          />
        )}

        {activeRole === "masternode" && (
          <MasternodeDashboard
            status={status}
            isHydrating={isHydrating}
            busy={busy}
            logText={logText}
            masternode={masternodePoll.data}
            masternodeLoading={masternodePoll.isInitialLoading}
            onStart={handleStart}
            onStop={handleStop}
            onApplyConfig={handleApplyMasternodeConfig}
          />
        )}
      </div>
    </main>
  );
};

root.render(<App />);
