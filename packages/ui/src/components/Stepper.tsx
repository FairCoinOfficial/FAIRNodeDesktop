import React from "react";

type Props = {
  steps: string[];
  current: number;
};

export function Stepper({ steps, current }: Props): JSX.Element {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                state === "done"
                  ? "border-fair-green bg-fair-green text-fair-dark"
                  : state === "active"
                    ? "border-fair-green bg-fair-green/15 text-fair-green"
                    : "border-fair-border bg-fair-dark text-fair-muted"
              }`}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            <span className={`text-xs ${state === "upcoming" ? "text-fair-muted" : "text-white"}`}>
              {label}
            </span>
            {index < steps.length - 1 && <span className="text-fair-border">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
