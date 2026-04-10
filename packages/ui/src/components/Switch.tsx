import React from "react";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <label
      className={`inline-flex items-center gap-3 text-sm text-white ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? "bg-fair-green-dim border-fair-green-dim"
            : "bg-fair-dark border-fair-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
