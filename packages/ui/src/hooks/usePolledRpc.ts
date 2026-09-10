import React from "react";
import type { MasternodeStatusInfo, StakingInfo } from "../types";

const POLL_INTERVAL_MS = 4000;

type Polled<T> = {
  data: T | null;
  /** True until the first response arrives. */
  isInitialLoading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Polls an RPC-backed reader on an interval while mounted. Used by the staking
 * and masternode dashboards. `enabled` lets a dashboard pause polling (e.g. while
 * the node is stopped) without unmounting.
 */
function usePolled<T>(reader: () => Promise<T>, enabled: boolean): Polled<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const readerRef = React.useRef(reader);
  readerRef.current = reader;

  const refresh = React.useCallback(async () => {
    try {
      const next = await readerRef.current();
      setData(next);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    const tick = () => {
      void refresh().catch(() => undefined);
    };
    tick();
    const interval = window.setInterval(() => {
      if (active) {
        tick();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { data, isInitialLoading, refresh };
}

export function useStakingInfo(enabled: boolean): Polled<StakingInfo> {
  return usePolled<StakingInfo>(() => window.api.getStakingInfo(), enabled);
}

export function useMasternodeStatus(enabled: boolean): Polled<MasternodeStatusInfo> {
  return usePolled<MasternodeStatusInfo>(() => window.api.getMasternodeStatus(), enabled);
}
