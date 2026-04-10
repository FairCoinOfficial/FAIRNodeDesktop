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
              {["mainnet", "testnet"].map((network) => (
                <button
                  key={network}
                  type="button"
                  className={`btn ${merged.network === network ? "btn-primary" : "btn-ghost"} w-full`}
                  onClick={() => updateField("network", network as NodeSettings["network"])}
                >
                  {network}
                </button>
              ))}
            </div>
          </Field>

          <Field label="P2P port" error={errors.p2pPort}>
            <input
              className="input"
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
              className="input"
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
              className="input"
              type="text"
              value={merged.rpcUser ?? ""}
              onChange={(e) => updateField("rpcUser", e.target.value)}
              placeholder="auto-generate if empty"
            />
          </Field>

          <Field label="RPC password">
            <input
              className="input"
              type="text"
              value={merged.rpcPassword ?? ""}
              onChange={(e) => updateField("rpcPassword", e.target.value)}
              placeholder="auto-generate if empty"
            />
          </Field>

          <Field label="Log level">
            <select
              className="input"
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
            <div className="muted">Log level is set via faircoind flags.</div>
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary px-4" disabled={!hasChanges}>
            Save changes
          </button>
          {!hasChanges && <div className="muted">No pending changes</div>}
        </div>

        {message && <div className="text-emerald-300 text-sm">{message}</div>}
        {error && <div className="text-rose-300 text-sm">{error}</div>}
      </form>
    </Card>
  );
}
