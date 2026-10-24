"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type DashboardRefreshHandler = () => void | Promise<void>;

export interface DashboardRefreshResult {
  attempted: number;
  failed: number;
}

interface DashboardRefreshValue {
  isRefreshing: boolean;
  refresh: () => Promise<DashboardRefreshResult>;
  register: (key: string, handler: DashboardRefreshHandler) => () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshValue | null>(
  null,
);

export function useDashboardRefreshController(
  refreshShared: DashboardRefreshHandler,
): DashboardRefreshValue {
  const handlersRef = useRef(new Map<string, DashboardRefreshHandler>());
  const inFlightRef = useRef<Promise<DashboardRefreshResult> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const register = useCallback(
    (key: string, handler: DashboardRefreshHandler) => {
      handlersRef.current.set(key, handler);
      return () => {
        if (handlersRef.current.get(key) === handler) {
          handlersRef.current.delete(key);
        }
      };
    },
    [],
  );

  const refresh = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;

    setIsRefreshing(true);
    const tasks = [refreshShared, ...handlersRef.current.values()];
    const request = Promise.allSettled(
      tasks.map((handler) => Promise.resolve().then(handler)),
    )
      .then((results) => ({
        attempted: results.length,
        failed: results.filter((result) => result.status === "rejected").length,
      }))
      .finally(() => {
        inFlightRef.current = null;
        setIsRefreshing(false);
      });
    inFlightRef.current = request;
    return request;
  }, [refreshShared]);

  return useMemo(
    () => ({ isRefreshing, refresh, register }),
    [isRefreshing, refresh, register],
  );
}

export function DashboardRefreshProvider({
  value,
  children,
}: {
  value: DashboardRefreshValue;
  children: ReactNode;
}) {
  return (
    <DashboardRefreshContext.Provider value={value}>
      {children}
    </DashboardRefreshContext.Provider>
  );
}

/** Registers only while its page is mounted, so global refresh targets the active route. */
export function useRegisterDashboardRefresh(
  key: string,
  handler: DashboardRefreshHandler,
) {
  const context = useContext(DashboardRefreshContext);
  const register = context?.register;

  useEffect(() => {
    if (!register) return;
    return register(key, handler);
  }, [handler, key, register]);

  return context?.isRefreshing ?? false;
}
