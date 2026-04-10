import React from "react";

type Props = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string | null;
};

export function Field({ label, hint, children, error }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm font-medium">{label}</span>
        {hint && <span className="text-fair-muted text-xs">{hint}</span>}
      </div>
      {children}
      {error && <div className="text-red-400 text-xs">{error}</div>}
    </div>
  );
}
