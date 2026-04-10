import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Dashboard } from "./components/Dashboard";
import { Setup } from "./components/Setup";
import { Settings } from "./components/Settings";
import { useNodeData } from "./hooks/useNodeData";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const App = (): JSX.Element => {
  const { status, isHydrating, logText, logSize, start, restart, stop, refreshStatus, readLogs } = useNodeData();

  const handleSetup = async (settings: { network: "mainnet" | "testnet"; rpcPort: number; p2pPort: number }) => {
    await start({
      network: settings.network,
      rpcPort: settings.rpcPort,
      p2pPort: settings.p2pPort,
    });
    await refreshStatus();
    await readLogs(0);
  };

  const handleSaveSettings = async (settings: { network?: "mainnet" | "testnet"; rpcPort?: number; p2pPort?: number; rpcUser?: string; rpcPassword?: string }) => {
    if (!status) return;
    await restart({
      network: settings.network ?? status.network,
      rpcPort: settings.rpcPort ?? status.rpcPort,
      p2pPort: settings.p2pPort ?? status.p2pPort,
      rpcUser: settings.rpcUser ?? status.rpcUser,
      rpcPassword: settings.rpcPassword ?? status.rpcPassword,
    });
    await refreshStatus();
    await readLogs();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">FAIRNode Desktop</p>
            <h1 className="text-2xl font-semibold">Node control</h1>
          </div>
          <div className="text-xs text-slate-400">Log size: {logSize.toLocaleString()} bytes</div>
        </header>

        <Setup
          initialState={{
            network: status?.network ?? "mainnet",
            p2pPort: status?.p2pPort ?? 46372,
            rpcPort: status?.rpcPort ?? 46373,
          }}
          paths={status?.paths ?? null}
          onSubmit={handleSetup}
          isBusy={isHydrating}
        />

        <div className="space-y-4">
          <Dashboard
            status={status}
            logText={logText}
            isHydrating={isHydrating}
            onStart={async () => {
              if (!status) return;
              await start({ network: status.network, rpcPort: status.rpcPort, p2pPort: status.p2pPort });
              await refreshStatus();
              await readLogs(0);
            }}
            onStop={stop}
          />

          <Settings
            status={status}
            onUpdate={handleSaveSettings}
          />
        </div>
      </div>
    </main>
  );
};

root.render(<App />);
