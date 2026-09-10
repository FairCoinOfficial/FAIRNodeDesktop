import React from "react";
import { RoleIcon } from "./RoleIcon";
import type { RoleMeta } from "../roles";

type Props = {
  meta: RoleMeta;
  selected: boolean;
  onSelect: () => void;
};

const effortTone: Record<RoleMeta["effort"], string> = {
  Easiest: "text-fair-green border-fair-green/40 bg-fair-green/10",
  Recommended: "text-fair-green border-fair-green/40 bg-fair-green/10",
  Advanced: "text-yellow-300 border-yellow-400/40 bg-yellow-400/10",
};

export function RoleCard({ meta, selected, onSelect }: Props): JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex h-full flex-col gap-4 rounded-2xl border p-6 text-left transition-all focus:outline-none focus:ring-2 focus:ring-fair-green/60 ${
        selected
          ? "border-fair-green bg-fair-dark-light shadow-[0_0_0_1px_rgba(159,251,80,0.4)]"
          : "border-fair-border bg-fair-dark-light/60 hover:border-fair-green/60 hover:bg-fair-dark-light"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
            selected
              ? "border-fair-green bg-fair-green/15 text-fair-green"
              : "border-fair-border bg-fair-dark text-fair-green-dim group-hover:text-fair-green"
          }`}
        >
          <RoleIcon role={meta.role} />
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${effortTone[meta.effort]}`}
        >
          {meta.effort}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">{meta.title}</h3>
        <p className="text-sm font-medium text-fair-green">{meta.tagline}</p>
      </div>

      <p className="text-sm leading-relaxed text-fair-muted">{meta.description}</p>

      <ul className="mt-auto flex flex-col gap-1.5">
        {meta.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-white/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fair-green-dim" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
