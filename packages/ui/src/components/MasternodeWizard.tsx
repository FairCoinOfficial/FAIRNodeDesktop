import React from "react";
import { Card } from "./Card";
import { Field } from "./Field";
import { Stepper } from "./Stepper";
import { CopyField } from "./CopyField";
import { StatusPill } from "./StatusPill";
import {
  MASTERNODE_COLLATERAL,
  MASTERNODE_COLLATERAL_CONFIRMATIONS,
  MAINNET_P2P_PORT,
} from "../../../common/src/ipc";
import type { MasternodeStatusInfo } from "../types";

type WizardStep = "address" | "confirmations" | "identity" | "register" | "activate" | "complete";

const STEP_LABELS = ["Collateral", "Confirm", "Identity", "Register", "Activate"];
const STEP_INDEX: Record<WizardStep, number> = {
  address: 0,
  confirmations: 1,
  identity: 2,
  register: 3,
  activate: 4,
  complete: 5,
};

type Unspent = {
  txid: string;
  vout: number;
  amount: number;
  confirmations: number;
};

type Props = {
  /** Whether faircoind is running (RPC available). */
  running: boolean;
  masternode: MasternodeStatusInfo | null;
  /** Persist the masternode config and restart the node with it applied. */
  onApplyConfig: (config: {
    alias: string;
    privKey: string;
    externalIp: string;
    txid: string;
    outputIndex: string;
  }) => Promise<void>;
  onStart: () => Promise<void>;
};

function isUnspent(value: unknown): value is Unspent {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.txid === "string" &&
    typeof record.vout === "number" &&
    typeof record.amount === "number" &&
    typeof record.confirmations === "number"
  );
}

export function MasternodeWizard({
  running,
  masternode,
  onApplyConfig,
  onStart,
}: Props): JSX.Element {
  const [step, setStep] = React.useState<WizardStep>("address");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [alias, setAlias] = React.useState("mn1");
  const [address, setAddress] = React.useState<string | null>(null);
  const [collateral, setCollateral] = React.useState<Unspent | null>(null);
  const [privKey, setPrivKey] = React.useState<string | null>(null);
  const [externalIp, setExternalIp] = React.useState("");
  const [startResult, setStartResult] = React.useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleGetAddress = () =>
    run(async () => {
      const next = await window.api.getNewAddress("masternode-collateral");
      setAddress(next);
      setStep("confirmations");
    });

  const findCollateral = async (): Promise<Unspent[]> => {
    const raw = await window.api.rpcCall({ method: "listunspent", params: [0, 9_999_999] });
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .filter(isUnspent)
      .filter((utxo) => Math.abs(utxo.amount - MASTERNODE_COLLATERAL) < 0.0001);
  };

  const handleCheckConfirmations = () =>
    run(async () => {
      const matches = await findCollateral();
      if (matches.length === 0) {
        setError(
          `No ${MASTERNODE_COLLATERAL.toLocaleString()} FAIR collateral found yet. Send exactly ${MASTERNODE_COLLATERAL.toLocaleString()} FAIR to the address above, then check again.`,
        );
        setCollateral(null);
        return;
      }
      const best = matches.reduce((a, b) => (a.confirmations >= b.confirmations ? a : b));
      setCollateral(best);
    });

  const handleGenerateIdentity = () =>
    run(async () => {
      const key = await window.api.generateMasternodeKey();
      setPrivKey(key);
      setStep("identity");
    });

  const handleSaveIdentity = () =>
    run(async () => {
      if (!privKey) {
        throw new Error("Generate a masternode key first.");
      }
      if (externalIp.trim().length === 0) {
        throw new Error("Enter your masternode's public IP address.");
      }
      setStep("register");
    });

  const handleRegister = () =>
    run(async () => {
      if (!collateral || !privKey) {
        throw new Error("Missing collateral or masternode key.");
      }
      await onApplyConfig({
        alias: alias.trim(),
        privKey,
        externalIp: externalIp.trim(),
        txid: collateral.txid,
        outputIndex: String(collateral.vout),
      });
      setStep("activate");
    });

  const handleActivate = () =>
    run(async () => {
      const result = await window.api.startMasternodeAlias(alias.trim());
      setStartResult(result);
      setStep("complete");
    });

  const confirmations = collateral?.confirmations ?? 0;
  const confirmed = confirmations >= MASTERNODE_COLLATERAL_CONFIRMATIONS;
  const statusCode = masternode?.statusCode ?? "";
  const isEnabled = statusCode.toUpperCase().includes("ENABLED");

  return (
    <Card title="Masternode setup wizard">
      <div className="flex flex-col gap-5">
        <Stepper steps={STEP_LABELS} current={STEP_INDEX[step]} />

        {!running && (
          <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
            The node must be running to set up a masternode.{" "}
            <button
              type="button"
              onClick={() => void onStart()}
              className="font-semibold text-fair-green underline"
            >
              Start it now
            </button>
            .
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-600/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === "address" && (
          <div className="flex flex-col gap-4">
            <Field label="Masternode name (alias)" hint="A label for your records">
              <input
                className="rounded-xl border border-fair-border bg-fair-dark-light px-4 py-3 text-white focus:border-fair-green focus:outline-none"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="mn1"
              />
            </Field>
            <p className="text-sm text-fair-muted">
              First we will generate an address to hold your{" "}
              {MASTERNODE_COLLATERAL.toLocaleString()} FAIR collateral. This is a refundable
              deposit: the coins stay yours and are never spent.
            </p>
            <button
              type="button"
              onClick={() => void handleGetAddress()}
              disabled={!running || busy || alias.trim().length === 0}
              className="self-start rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
            >
              {busy ? "Working…" : "Generate collateral address"}
            </button>
          </div>
        )}

        {step === "confirmations" && address && (
          <div className="flex flex-col gap-4">
            <CopyField label="Send exactly 5,000 FAIR to this address" value={address} />
            <div className="rounded-xl border border-fair-green/30 bg-fair-green/10 px-4 py-3 text-sm text-fair-green">
              Send <strong>exactly {MASTERNODE_COLLATERAL.toLocaleString()} FAIR</strong> in a
              single transaction. It needs {MASTERNODE_COLLATERAL_CONFIRMATIONS} confirmations
              before the masternode can start.
            </div>

            <div className="flex items-center gap-3">
              <StatusPill
                label={
                  collateral
                    ? confirmed
                      ? "Confirmed"
                      : `${confirmations}/${MASTERNODE_COLLATERAL_CONFIRMATIONS} confirmations`
                    : "Awaiting deposit"
                }
                tone={collateral ? (confirmed ? "success" : "warning") : "info"}
              />
              <button
                type="button"
                onClick={() => void handleCheckConfirmations()}
                disabled={!running || busy}
                className="rounded-full border border-fair-green px-5 py-1.5 text-sm font-semibold text-fair-green disabled:opacity-50"
              >
                {busy ? "Checking…" : "Check now"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerateIdentity()}
              disabled={!confirmed || busy}
              className="self-start rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === "identity" && (
          <div className="flex flex-col gap-4">
            {privKey && (
              <CopyField label="Masternode private key (auto-generated)" value={privKey} />
            )}
            <Field label="Masternode public IP" hint="The public IPv4 address of this machine/VPS">
              <input
                className="rounded-xl border border-fair-border bg-fair-dark-light px-4 py-3 text-white focus:border-fair-green focus:outline-none"
                value={externalIp}
                onChange={(e) => setExternalIp(e.target.value)}
                placeholder="e.g. 203.0.113.10"
              />
            </Field>
            <p className="text-sm text-fair-muted">
              Port {MAINNET_P2P_PORT} must be reachable from the internet on this IP.
            </p>
            <button
              type="button"
              onClick={() => void handleSaveIdentity()}
              disabled={busy || externalIp.trim().length === 0 || !privKey}
              className="self-start rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === "register" && collateral && privKey && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-fair-muted">
              We will save your masternode configuration and restart the node with masternode mode
              enabled. Review the details:
            </p>
            <div className="grid gap-2 rounded-xl border border-fair-border bg-fair-dark px-4 py-3 font-mono text-xs text-white">
              <span>alias: {alias.trim()}</span>
              <span>
                ip: {externalIp.trim()}:{MAINNET_P2P_PORT}
              </span>
              <span className="break-all">collateral txid: {collateral.txid}</span>
              <span>output index: {collateral.vout}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleRegister()}
              disabled={busy}
              className="self-start rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
            >
              {busy ? "Saving & restarting…" : "Save config & restart node"}
            </button>
          </div>
        )}

        {step === "activate" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-fair-muted">
              Configuration applied. Now broadcast your masternode to the network with start-alias.
            </p>
            <button
              type="button"
              onClick={() => void handleActivate()}
              disabled={!running || busy}
              className="self-start rounded-full bg-fair-green px-6 py-2 font-semibold text-fair-dark transition-opacity disabled:opacity-50"
            >
              {busy ? "Starting…" : `Start masternode "${alias.trim()}"`}
            </button>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <StatusPill
                label={isEnabled ? "ENABLED" : statusCode || "Waiting for network…"}
                tone={isEnabled ? "success" : "warning"}
              />
              <span className="text-sm text-fair-muted">
                {isEnabled
                  ? "Your masternode is live and earning rewards."
                  : "It can take a few minutes for the network to mark your masternode ENABLED."}
              </span>
            </div>
            {startResult && (
              <pre className="overflow-x-auto rounded-xl border border-fair-border bg-fair-dark px-4 py-3 font-mono text-xs text-white">
                {startResult}
              </pre>
            )}
            {masternode?.statusMessage && (
              <p className="text-sm text-fair-muted">{masternode.statusMessage}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
