import React from "react";
import type { NodeSettings, NodeStatus } from "../types";

type NodeData = {
  status: NodeStatus | null;
  isHydrating: boolean;
  logText: string;
  logSize: number;
  refreshStatus: () => Promise<void>;
  start: (settings: NodeSettings) => Promise<void>;
  restart: (settings: NodeSettings) => Promise<void>;
  stop: () => Promise<void>;
  readLogs: (sinceBytes?: number) => Promise<void>;
};

const MAX_LOG_LINES = 400;

function trimLogText(text: string): string {
  const lines = text.split(/\r?\n/);
  if (lines.length <= MAX_LOG_LINES) {
    return text;
  }
  const trimmed = lines.slice(-MAX_LOG_LINES);
  return trimmed.join("\n");
}

export function useNodeData(): NodeData {
  const [status, setStatus] = React.useState<NodeStatus | null>(null);
  const [isHydrating, setIsHydrating] = React.useState(true);
  const [logText, setLogText] = React.useState<string>("");
  const [logSize, setLogSize] = React.useState<number>(0);

  const logOffsetRef = React.useRef<number>(0);

  const refreshStatus = React.useCallback(async () => {
    try {
      const next = await window.api.getStatus();
      setStatus(next);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  const readLogs = React.useCallback(async (sinceBytes?: number) => {
    const from = sinceBytes ?? logOffsetRef.current;
    const next = await window.api.readLogs({ sinceBytes: from });
    logOffsetRef.current = next.to;
    setLogSize(next.to);
    setLogText((prev) => {
      const combined = from === 0 ? next.content : `${prev}${next.content}`;
      return trimLogText(combined);
    });
  }, []);

  React.useEffect(() => {
    void refreshStatus();
    void readLogs(0).catch(() => {
      setLogText("");
    });
  }, [refreshStatus, readLogs]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshStatus();
      void readLogs().catch(() => undefined);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [refreshStatus, readLogs]);

  const start = React.useCallback(async (settings: NodeSettings) => {
    logOffsetRef.current = 0;
    setLogText("");
    const next = await window.api.startNode(settings);
    setStatus(next);
    await readLogs(0);
  }, [readLogs]);

  const restart = React.useCallback(async (settings: NodeSettings) => {
    logOffsetRef.current = 0;
    setLogText("");
    const next = await window.api.restartNode(settings);
    setStatus(next);
    await readLogs(0);
  }, [readLogs]);

  const stop = React.useCallback(async () => {
    const next = await window.api.stopNode();
    setStatus(next);
  }, []);

  return {
    status,
    isHydrating,
    logText,
    logSize,
    refreshStatus,
    start,
    restart,
    stop,
    readLogs,
  };
}
