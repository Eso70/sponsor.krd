"use client";

import { useCallback, useEffect, useRef } from "react";

/** Only the newest request may publish data, errors or completion state. */
export function useLatestRequest() {
  const revision = useRef(0);
  useEffect(() => () => { revision.current += 1; }, []);
  return useCallback(() => {
    const current = ++revision.current;
    return () => current === revision.current;
  }, []);
}
