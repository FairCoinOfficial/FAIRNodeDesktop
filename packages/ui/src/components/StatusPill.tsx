import React from "react";

type Props = {
  label: string;
  tone: "success" | "warning" | "danger" | "info";
};

const toneMap: Record<Props["tone"], { dot: string; text: string }> = {
  success: { dot: "bg-fair-green", text: "text-fair-green" },
  warning: { dot: "bg-yellow-400", text: "text-yellow-400" },
  danger: { dot: "bg-red-400", text: "text-red-400" },
  info: { dot: "bg-fair-green-dim", text: "text-fair-green-dim" },
};

export function StatusPill({ label, tone }: Props) {
  const style = toneMap[tone];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-fair-dark border border-fair-border px-3 py-1">
      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
      <span className={`text-xs font-medium ${style.text}`}>{label}</span>
    </span>
  );
}
