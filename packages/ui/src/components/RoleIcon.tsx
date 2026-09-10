import React from "react";
import type { NodeRole } from "../types";

type Props = {
  role: NodeRole;
  className?: string;
};

/** Lightweight inline SVG glyphs so we avoid pulling in an icon dependency. */
export function RoleIcon({ role, className = "h-7 w-7" }: Props): JSX.Element {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };

  if (role === "node") {
    // Network nodes connected by links.
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M6.7 7.3 10.5 16.5M17.3 7.3 13.5 16.5M7 6h10" />
      </svg>
    );
  }

  if (role === "staking") {
    // Coin with an upward growth arrow.
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9 10.5l3-2.5 3 2.5" />
      </svg>
    );
  }

  // Masternode: a server/shield hybrid.
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V6z" />
      <path d="M9 10h6M9 13h6" />
    </svg>
  );
}
