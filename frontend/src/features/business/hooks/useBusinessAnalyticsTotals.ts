"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getBusinessAnalyticsSummary,
  type AnalyticsPageType,
} from "@/features/business/api";

import {
  readAnalyticsTotals,
  EMPTY_ANALYTICS_TOTALS,
  type AnalyticsTotals,
} from "@/features/analytics/analytics-totals";
export type BusinessAnalyticsTotals = AnalyticsTotals;
export const EMPTY_BUSINESS_ANALYTICS_TOTALS = EMPTY_ANALYTICS_TOTALS;

export function useBusinessAnalyticsTotals(
  pageType?: AnalyticsPageType,
  enabled = true,
  endpoint?: string,
) {
  const [totals, setTotals] = useState<BusinessAnalyticsTotals>(
    EMPTY_BUSINESS_ANALYTICS_TOTALS,
  );
  const [unavailable, setUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadedRef = useRef(false);
  const requestRef = useRef(0);
  const invalidatePending = useCallback(() => {
    requestRef.current++;
  }, []);

  const refresh = useCallback(
    async (options?: { rethrow?: boolean }) => {
      const request = ++requestRef.current;
      if (loadedRef.current) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const data = await getBusinessAnalyticsSummary(pageType, endpoint);
        if (request !== requestRef.current) return;
        setTotals(readAnalyticsTotals(data));
        setUnavailable(false);
      } catch (error) {
        console.error("Error fetching analytics totals:", error);
        if (request === requestRef.current) setUnavailable(true);
        if (options?.rethrow) throw error;
      } finally {
        if (request === requestRef.current) {
          loadedRef.current = true;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [endpoint, pageType],
  );

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(() => void refresh());
    return () => {
      window.cancelAnimationFrame(frame);
      invalidatePending();
    };
  }, [enabled, refresh, invalidatePending]);

  const hasData = useMemo(
    () =>
      totals.total_views > 0 ||
      totals.unique_views > 0 ||
      totals.total_clicks > 0 ||
      totals.unique_clicks > 0 ||
      totals.conversions > 0 ||
      (totals.contact_actions ?? 0) > 0,
    [totals],
  );

  const reset = useCallback(() => {
    requestRef.current++;
    loadedRef.current = true;
    setIsLoading(false);
    setIsRefreshing(false);
    setTotals(EMPTY_BUSINESS_ANALYTICS_TOTALS);
    setUnavailable(false);
  }, []);

  return {
    totals,
    hasData,
    isLoading,
    isRefreshing,
    unavailable,
    refresh,
    reset,
  };
}
