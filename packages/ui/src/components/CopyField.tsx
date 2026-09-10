import React from "react";

type Props = {
  label: string;
  value: string;
};

export function CopyField({ label, value }: Props): JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 break-all rounded-xl border border-fair-border bg-fair-dark px-4 py-3 font-mono text-xs text-fair-green">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="shrink-0 rounded-xl border border-fair-green px-4 text-sm font-semibold text-fair-green transition-opacity hover:opacity-80"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
