import React from "react";
import { RoleIcon } from "./RoleIcon";
import { ROLE_META } from "../roles";
import type { NodeRole } from "../types";

type Props = {
  role: NodeRole;
  logSize: number;
  onChangeRole: () => void;
};

export function DashboardHeader({ role, logSize, onChangeRole }: Props): JSX.Element {
  const meta = ROLE_META[role];
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold text-fair-green">FAIR</h1>
          <span className="text-xl font-light tracking-widest text-fair-green">Node Desktop</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-fair-border bg-fair-dark-light px-3 py-1 text-sm text-white">
          <RoleIcon role={role} className="h-4 w-4 text-fair-green" />
          {meta.title}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-fair-muted">Log size: {logSize.toLocaleString()} bytes</span>
        <button
          type="button"
          onClick={onChangeRole}
          className="rounded-full border border-fair-border px-4 py-1.5 text-sm font-semibold text-fair-muted transition-colors hover:text-white"
        >
          Change role
        </button>
      </div>
    </header>
  );
}
