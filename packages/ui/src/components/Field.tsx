import React from "react";

type Props = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string | null;
};

export function Field({ label, hint, children, error }: Props) {
  return (
    <div className="field">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && <div className="text-rose-300 text-xs">{error}</div>}
    </div>
  );
}
