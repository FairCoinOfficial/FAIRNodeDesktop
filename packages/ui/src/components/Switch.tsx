import React from "react";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={`flex items-center gap-3 text-sm text-slate-200 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <button
        type="button"
        className={`switch ${checked ? "bg-accent/80" : "bg-slate-800"}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
      >
        <span className={`switch-thumb ${checked ? "translate-x-5" : "translate-x-1"}`} />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
