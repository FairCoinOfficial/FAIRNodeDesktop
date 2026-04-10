import React from "react";

type Props = {
  label: string;
  tone: "success" | "warning" | "danger" | "info";
};

const toneMap: Record<Props["tone"], string> = {
  success: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-200 border-amber-400/40",
  danger: "bg-rose-500/15 text-rose-200 border-rose-400/40",
  info: "bg-sky-500/15 text-sky-200 border-sky-400/40",
};

export function StatusPill({ label, tone }: Props) {
  return (
    <span
      className={`pill border ${toneMap[tone]} inline-flex items-center px-3 py-1 text-xs font-medium`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
