"use client";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";


import { useCallback, useEffect, useState } from "react";
import type { PlatformBusiness as Business } from "@linktree/types";
import {
  getBusinesses,
  type BusinessPagination,
  type BusinessSummary,
} from "@/features/platform-admin/api/businesses";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { isApiRequestError } from "@/lib/api/request";

export type { BusinessPagination, BusinessSummary };

export function useBusinesses(onUnauthorized: () => void) {
  const startRequest = useLatestRequest();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [badGateway, setBadGateway] = useState(false);
  const [gatewayTimeout, setGatewayTimeout] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState("");
  const [pagination, setPagination] = useState<BusinessPagination>({
    page: 1,
    limit: PAGE_MANAGEMENT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [summaryUnavailable, setSummaryUnavailable] = useState(true);
  const [summary, setSummary] = useState<BusinessSummary>({
    total: 0,
    active: 0,
    suspended: 0,
    pendingApplications: 0,
    totalApplications: 0,
    activeInvitations: 0,
  });

  const reload = useCallback(async () => {
    const current = startRequest();
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_MANAGEMENT_PAGE_SIZE) });
      if (search.trim()) params.set("search", search.trim());
      const payload = await getBusinesses(params);
      if (!current()) return;
      if (payload.pagination && page > Math.max(1, payload.pagination.totalPages)) {
        setPage(Math.max(1, payload.pagination.totalPages));
        return;
      }
      setBusinesses(payload.items ?? []);
      if (payload.pagination) setPagination(payload.pagination);
      if (!payload.summary) throw new Error("Missing business summary");
      setSummary(payload.summary);
      setSummaryUnavailable(false);
      setError(null);
      setBadGateway(false);
      setServiceUnavailable(false);
      setGatewayTimeout(false);
    } catch (cause) {
      if (!current()) return;
      setSummaryUnavailable(true);
      if (isApiRequestError(cause, 401)) {
        onUnauthorized();
        return;
      }
      if (isApiRequestError(cause, 403)) {
        setBusinesses([]);
        setError(null);
        setBadGateway(false);
        setServiceUnavailable(false);
        setGatewayTimeout(false);
        return;
      }
      if (isApiRequestError(cause, 502)) {
        setBadGateway(true);
        setServiceUnavailable(false);
        setGatewayTimeout(false);
        setError(null);
        return;
      }
      if (isApiRequestError(cause, 504)) {
        setBadGateway(false);
        setServiceUnavailable(false);
        setGatewayTimeout(true);
        setError(null);
        return;
      }
      if (
        isApiRequestError(cause) &&
        (cause.status === 0 || cause.status === 503)
      ) {
        setBadGateway(false);
        setGatewayTimeout(false);
        setServiceUnavailable(true);
        setError(null);
        return;
      }
      setError(
        cause instanceof Error ? cause.message : "Failed to fetch businesses",
      );
    } finally {
      if (current()) { setIsLoading(false); setIsRefreshing(false); }
    }
  }, [onUnauthorized, page, search, startRequest]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void reload();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reload]);

  const refresh = useCallback(async () => { await reload(); }, [reload]);

  const removeBusiness = useCallback((id: string) => {
    setBusinesses((current) =>
      current.filter((business) => business.id !== id),
    );
  }, []);

  const setSearch = useCallback((value: string) => {
    setPage(1);
    setSearchValue(value);
  }, []);

  return {
    businesses,
    isLoading,
    isRefreshing,
    error,
    badGateway,
    serviceUnavailable,
    gatewayTimeout,
    reload,
    refresh,
    removeBusiness,
    page,
    setPage,
    search,
    setSearch,
    pagination,
    summary,
    summaryUnavailable,
    setOperationError: setError,
  };
}
