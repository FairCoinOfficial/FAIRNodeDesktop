import React from "react";
import { RoleCard } from "./RoleCard";
import { ROLE_META, ROLE_ORDER } from "../roles";
import type { Network, NodeRole } from "../types";

type Props = {
  initialRole: NodeRole | null;
  network: Network;
  onNetworkChange: (network: Network) => void;
  onConfirm: (role: NodeRole) => Promise<void>;
  onCancel?: () => void;
};

export function WelcomeScreen({
  initialRole,
  network,
  onNetworkChange,
  onConfirm,
  onCancel,
}: Props): JSX.Element {
  const [selected, setSelected] = React.useState<NodeRole | null>(initialRole);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your choice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-fair-dark font-body">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-12">
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-fair-green">FAIR</span>
            <span className="text-2xl font-light tracking-widest text-fair-green">
              Node Desktop
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Welcome — what would you like to run?
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-fair-muted">
            Every option runs the same FairCoin node under the hood. Pick the one that matches what
            you want to get out of it. You can change this later.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          {ROLE_ORDER.map((role) => (
            <RoleCard
              key={role}
              meta={ROLE_META[role]}
              selected={selected === role}
              onSelect={() => {
                setSelected(role);
                setError(null);
              }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3 text-sm text-fair-muted">
            <span>Network</span>
            <div className="flex gap-2">
              {(["mainnet", "testnet"] as Network[]).map((net) => {
                const active = network === net;
                return (
                  <button
                    key={net}
                    type="button"
                    onClick={() => onNetworkChange(net)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      active
                        ? "border-fair-green bg-fair-green text-fair-dark"
                        : "border-fair-border bg-transparent text-fair-muted hover:text-white"
                    }`}
                  >
                    {net}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-600/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-fair-border px-6 py-3 text-sm font-semibold text-fair-muted transition-colors hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected || isSubmitting}
              className="rounded-full bg-fair-green px-10 py-3 text-sm font-semibold text-fair-dark transition-opacity disabled:opacity-40"
            >
              {isSubmitting
                ? "Setting up…"
                : selected
                  ? `Continue as ${ROLE_META[selected].title}`
                  : "Select an option to continue"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
