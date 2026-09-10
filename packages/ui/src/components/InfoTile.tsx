import React from "react";

type Props = {
  label: string;
  value: React.ReactNode;
  breakAll?: boolean;
};

export function InfoTile({ label, value, breakAll = false }: Props): JSX.Element {
  return (
    <div className="rounded-xl border border-fair-border bg-fair-dark px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-fair-muted">{label}</div>
      <div className={`mt-1 text-sm text-white ${breakAll ? "break-all" : ""}`}>{value}</div>
    </div>
  );
}
