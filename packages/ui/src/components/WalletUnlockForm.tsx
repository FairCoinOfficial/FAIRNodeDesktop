import React from "react";
import { Field } from "./Field";

type Props = {
  onUnlock: (passphrase: string) => Promise<void>;
};

/**
 * Prompts for the wallet passphrase and unlocks it for staking only
 * (walletpassphrase <pass> 0 true) — this never allows spending.
 */
export function WalletUnlockForm({ onUnlock }: Props): JSX.Element {
  const [passphrase, setPassphrase] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passphrase.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUnlock(passphrase);
      setDone(true);
      setPassphrase("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock the wallet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <p className="text-sm text-fair-muted">
        Your wallet is encrypted. To stake, unlock it for staking only — this lets it create blocks
        but never lets it spend your coins.
      </p>
      <Field label="Wallet passphrase">
        <input
          className="rounded-xl border border-fair-border bg-fair-dark-light px-4 py-3 text-white placeholder:text-fair-muted focus:border-fair-green focus:outline-none"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter passphrase"
          autoComplete="current-password"
        />
      </Field>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || passphrase.length === 0}
          className="rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Unlock for staking"}
        </button>
        {done && <span className="text-sm text-fair-green">Wallet unlocked for staking.</span>}
      </div>
      {error && (
        <div className="rounded-xl border border-red-600/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}
