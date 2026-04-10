import React from "react";
import { Card } from "./Card";
import { Field } from "./Field";
import type { LogLevel, NodeSettings, NodeStatus } from "../types";

type Props = {
  status: NodeStatus | null;
  onUpdate: (settings: NodeSettings) => Promise<void>;
};

const logLevels: LogLevel[] = ["trace", "debug", "info", "warn", "error"];

export function Settings({ status, onUpdate }: Props) {
  const [pending, setPending] = React.useState<Partial<NodeSettings>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const merged: Partial<NodeSettings> & { network?: NodeStatus["network"] } = {
    network: status?.network,
    p2pPort: status?.p2pPort,
    rpcPort: status?.rpcPort,
    rpcUser: status?.rpcUser,
    rpcPassword: status?.rpcPassword,
    ...pending,
  };

  const updateField = <K extends keyof NodeSettings>(key: K, value: NodeSettings[K]) => {
    setPending((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
    setError(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const nextErrors: Record<string, string> = {};
    if (merged.p2pPort && (merged.p2pPort < 1 || merged.p2pPort > 65535)) {
      nextErrors.p2pPort = "Port must be between 1 and 65535";
    }
    if (merged.rpcPort && (merged.rpcPort < 1 || merged.rpcPort > 65535)) {
      nextErrors.rpcPort = "Port must be between 1 and 65535";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onUpdate({ ...merged, ...pending });
      setMessage("Settings saved");
      setPending({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings");
    }
  };

  const hasChanges = Object.keys(pending).length > 0;

  return (
    <Card title="Settings">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Network">
            <div className="flex gap-2">
              {["mainnet", "testnet"].map((network) => {
                const active = merged.network === network;
                return (
                  <button
                    key={network}
                    type="button"
                    className={`rounded-full font-semibold py-2 px-6 w-full transition-colors ${
                      active
                        ? "bg-fair-green text-fair-dark"
                        : "border border-fair-green bg-transparent text-fair-green"
                    }`}
                    onClick={() => updateField("network", network as NodeSettings["network"])}
                  >
                    {network}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="P2P port" error={errors.p2pPort}>
            <input
              className="bg-fair-dark-light border border-fair-border rounded-xl px-4 py-3 text-white placeholder:text-fair-muted focus:border-fair-green focus:outline-none"
              type="number"
              value={merged.p2pPort ?? ""}
              onChange={(e) => updateField("p2pPort", Number(e.target.value))}
              min={1}
              max={65535}
              required
            />
          </Field>

          <Field label="RPC port" error={errors.rpcPort}>
            <input
              className="bg-fair-dark-light border border-fair-border rounded-xl px-4 py-3 text-white placeholder:text-fair-muted focus:border-fair-green focus:outline-none"
              type="number"
              value={merged.rpcPort ?? ""}
              onChange={(e) => updateField("rpcPort", Number(e.target.value))}
              min={1}
              max={65535}
              required
            />
          </Field>

          <Field label="RPC user">
            <input
              className="bg-fair-dark-light border border-fair-border rounded-xl px-4 py-3 text-white placeholder:text-fair-muted focus:border-fair-green focus:outline-none"
              type="text"
              value={merged.rpcUser ?? ""}
              onChange={(e) => updateField("rpcUser", e.target.value)}
              placeholder="auto-generate if empty"
            />
          </Field>

          <Field label="RPC password">
            <input
              className="bg-fair-dark-light border border-fair-border rounded-xl px-4 py-3 text-white placeholder:text-fair-muted focus:border-fair-green focus:outline-none"
              type="text"
              value={merged.rpcPassword ?? ""}
              onChange={(e) => updateField("rpcPassword", e.target.value)}
              placeholder="auto-generate if empty"
            />
          </Field>

          <Field label="Log level">
            <select
              className="bg-fair-dark-light border border-fair-border rounded-xl px-4 py-3 text-white focus:border-fair-green focus:outline-none disabled:opacity-50"
              value={merged.network === "mainnet" ? "info" : "debug"}
              onChange={() => undefined}
              disabled
            >
              {logLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <span className="text-fair-muted text-sm">Log level is set via faircoind flags.</span>
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-fair-green text-fair-dark font-semibold py-3 px-6 transition-opacity disabled:opacity-50"
            disabled={!hasChanges}
          >
            Save changes
          </button>
          {!hasChanges && (
            <span className="text-fair-muted text-sm">No pending changes</span>
          )}
        </div>

        {message && (
          <div className="bg-green-900/30 border border-green-600/50 rounded-xl p-4 text-fair-green text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </Card>
  );
}
