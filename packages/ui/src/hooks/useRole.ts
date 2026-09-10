import React from "react";
import type { NodeRole } from "../types";

type RoleState = {
  /** The chosen role, or null on first launch before a choice is made. */
  role: NodeRole | null;
  /** True while the persisted role is still being read on startup. */
  isLoading: boolean;
  /** Persist a role choice and update local state. */
  chooseRole: (role: NodeRole) => Promise<void>;
  /** Return to the welcome screen without forgetting the persisted role. */
  reopenWelcome: () => void;
  /** Whether the welcome screen should be shown right now. */
  showWelcome: boolean;
};

export function useRole(): RoleState {
  const [role, setRole] = React.useState<NodeRole | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [forceWelcome, setForceWelcome] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void window.api
      .getRole()
      .then((persisted) => {
        if (!cancelled) {
          setRole(persisted);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseRole = React.useCallback(async (next: NodeRole) => {
    await window.api.setRole(next);
    setRole(next);
    setForceWelcome(false);
  }, []);

  const reopenWelcome = React.useCallback(() => {
    setForceWelcome(true);
  }, []);

  const showWelcome = !isLoading && (role === null || forceWelcome);

  return { role, isLoading, chooseRole, reopenWelcome, showWelcome };
}
