"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { BusinessLinktreeSummary } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { apiRequest } from "@/lib/api/request";
import type { EditLinkData, LinktreeEditorSubmitData } from "./editor-types";
import { useLinktreeMutations, LINKTREE_APPROVAL_COPY } from "./use-linktree-mutations";
import type { LinktreeMutationScope } from "./linktree-mutations";

type WorkflowOptions = {
  scope: LinktreeMutationScope;
  locale: BusinessLocale;
  initiallyOpen?: boolean;
  copy: Record<'created' | 'updated' | 'archived' | 'restored' | 'enabled' | 'disabled' | 'loadFailed' | 'saveFailed' | 'archiveFailed' | 'statusFailed', string>;
  onSaved: (page: BusinessLinktreeSummary, editId?: string) => void | Promise<void>;
  onPageUpdated: (id: string, patch: Partial<BusinessLinktreeSummary>) => void;
  onClose?: () => void;
  /** Return false to retain the drawer (for a session-expiry prompt). */
  onLoadError?: (error: unknown) => boolean | void;
  notifySaveError?: boolean;
};

/** One editor/mutation lifecycle; owner differences are explicit adapters. */
export function useLinktreeEditorWorkflow(options: WorkflowOptions) {
  const latest = useRef(options);
  useLayoutEffect(() => { latest.current = options; });
  const mutations = useLinktreeMutations(options.scope);
  const [open, setOpen] = useState(options.initiallyOpen ?? false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EditLinkData | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const close = useCallback(() => {
    pending.current?.abort();
    setLoading(false); setOpen(false); setData(null);
    latest.current.onClose?.();
  }, []);
  const create = useCallback(() => {
    pending.current?.abort();
    setLoading(false); setData(null); setOpen(true);
  }, []);
  const openEdit = useCallback(async (id: string) => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setOpen(true); setLoading(true); setData(null);
    try {
      const base = options.scope === 'business' ? '/api/linktrees' : '/api/platform/linktrees';
      const result = await apiRequest<EditLinkData>(`${base}/${id}/edit`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!result?.linktree?.id || !Array.isArray(result.links)) throw new Error('Invalid Linktree edit response');
      setData(result);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (latest.current.onLoadError?.(error) === false) return;
      console.error('Linktree edit load failed', error);
      toast.error(latest.current.copy.loadFailed);
      close();
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, [options.scope, close]);
  const save = useCallback(async (draft: LinktreeEditorSubmitData, editId?: string) => {
    try {
      const result = await mutations.save(draft, editId);
      close();
      if (result.outcome === 'approval') toast.info(LINKTREE_APPROVAL_COPY[latest.current.locale]);
      else {
        toast.success(latest.current.copy[editId ? 'updated' : 'created']);
        await latest.current.onSaved(result.page, editId);
      }
    } catch (error) {
      if (latest.current.notifySaveError !== false) toast.error(latest.current.copy.saveFailed);
      throw error;
    }
  }, [mutations, close]);
  const archive = useCallback(async (id: string, value: boolean) => {
    try {
      const result = await mutations.archive(id, value);
      if (result.outcome === 'approval') { toast.info(LINKTREE_APPROVAL_COPY[latest.current.locale]); return; }
      latest.current.onPageUpdated(id, { is_archived: value, archived_at: value ? new Date().toISOString() : null });
      toast.success(latest.current.copy[value ? 'archived' : 'restored']);
    } catch (error) { console.error('Linktree archive failed', error); toast.error(latest.current.copy.archiveFailed); }
  }, [mutations]);
  const status = useCallback(async (id: string, value: 'active' | 'inactive') => {
    try {
      const result = await mutations.status(id, value);
      if (result.outcome === 'approval') { toast.info(LINKTREE_APPROVAL_COPY[latest.current.locale]); return; }
      latest.current.onPageUpdated(id, { status: value });
      toast.success(latest.current.copy[value === 'active' ? 'enabled' : 'disabled']);
    } catch (error) { console.error('Linktree status update failed', error); toast.error(latest.current.copy.statusFailed); }
  }, [mutations]);
  return { open, loading, data, close, create, openEdit, save, archive, status };
}
