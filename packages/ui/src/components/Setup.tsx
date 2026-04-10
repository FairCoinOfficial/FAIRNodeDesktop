import React from "react";
import { Card } from "./Card";
import { Field } from "./Field";
import { Switch } from "./Switch";
import type { Network, NodePaths, NodeSettings } from "../types";

type Props = {
  initialState: NodeSettings;
  paths: NodePaths | null;
  onSubmit: (options: NodeSettings) => Promise<void>;
  isBusy: boolean;
};

export function Setup({ initialState, paths, onSubmit, isBusy }: Props) {
  const [form, setForm] = React.useState<NodeSettings>(initialState);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleChange = <K extends keyof NodeSettings>(key: K, value: NodeSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const nextErrors: Record<string, string> = {};
    if (form.p2pPort !== undefined && (form.p2pPort < 1 || form.p2pPort > 65535)) {
      nextErrors.p2pPort = "Port must be between 1 and 65535";
    }
    if (form.rpcPort !== undefined && (form.rpcPort < 1 || form.rpcPort > 65535)) {
      nextErrors.rpcPort = "Port must be between 1 and 65535";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    try {
      await onSubmit(form);
      setSuccess("Configuration applied. Starting node...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply setup");
    }
  };

  const networkLabel = (network: Network) => (network === "mainnet" ? "Mainnet" : "Testnet");

  const renderPath = (label: string, value: string | undefined) => (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-100 mt-1 break-all">{value ?? "—"}</div>
    </div>
  );

  return (
    <Card title="First-time setup">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Network">
            <div className="flex gap-2">
              {["mainnet", "testnet"].map((net) => {
                const value = net as Network;
                const active = form.network === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`btn ${active ? "btn-primary" : "btn-ghost"} w-full`}
                    onClick={() => handleChange("network", value)}
                  >
                    {networkLabel(value)}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="P2P port" hint="Network listening port" error={fieldErrors.p2pPort}>
            <input
              className="input"
              type="number"
              value={form.p2pPort}
              onChange={(e) => handleChange("p2pPort", Number(e.target.value))}
              min={1}
              max={65535}
              required
            />
          </Field>

          <Field label="RPC port" hint="Local control port" error={fieldErrors.rpcPort}>
            <input
              className="input"
              type="number"
              value={form.rpcPort}
              onChange={(e) => handleChange("rpcPort", Number(e.target.value))}
              min={1}
              max={65535}
              required
            />
          </Field>

          <Field label="Portable mode" hint="Keep data within app folder">
            <Switch
              checked={Boolean(paths?.portableMode)}
              onChange={() => undefined}
              disabled
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary px-4" disabled={isBusy}>
            {isBusy ? "Applying..." : "Start node"}
          </button>
          <div className="muted">Apply your choices and launch the daemon.</div>
        </div>

        {paths && (
          <div className="grid gap-3 md:grid-cols-2">
            {renderPath("Data directory", paths.dataDir)}
            {renderPath("Config directory", paths.configDir)}
            {renderPath("Log file", paths.logFile)}
            {renderPath("Config file", paths.confFile)}
          </div>
        )}

        {error && <div className="text-rose-300 text-sm">{error}</div>}
        {success && <div className="text-emerald-300 text-sm">{success}</div>}
      </form>
    </Card>
  );
}
