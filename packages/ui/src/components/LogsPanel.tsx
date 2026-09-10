import React from "react";
import { Card } from "./Card";

type Props = {
  logText: string;
};

export function LogsPanel({ logText }: Props): JSX.Element {
  return (
    <Card title="Logs" actions={<span className="text-xs text-fair-muted">Live tail</span>}>
      <pre className="h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-fair-border bg-fair-dark px-4 py-3 font-mono text-xs text-white">
        {logText.trim().length === 0 ? "No logs yet." : logText}
      </pre>
    </Card>
  );
}
