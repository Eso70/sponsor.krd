"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FormLanguage,
  FormWhatsAppSettings,
  FormWhatsAppDetailsConfig,
} from "@linktree/types";
import { formsApi, type FormsScope } from "./api";

export function useFormWhatsAppTemplates(scope: FormsScope) {
  const [templates, setTemplates] = useState<FormWhatsAppSettings>({});
  const [loadedScope, setLoadedScope] = useState<FormsScope | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const read = useRef<AbortController | null>(null);
  const write = useRef<AbortController | null>(null);
  const load = useCallback(() => {
    read.current?.abort();
    const controller = new AbortController();
    read.current = controller;
    return formsApi
      .whatsappTemplates(scope, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setTemplates(result);
          setFailed(false);
          setSaveFailed(false);
          setLoadedScope(scope);
          if (!write.current) setSaving(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
          setLoadedScope(scope);
          if (!write.current) setSaving(false);
        }
      });
  }, [scope]);
  useEffect(() => {
    void load();
    return () => {
      read.current?.abort();
      write.current?.abort();
      write.current = null;
    };
  }, [load]);
  const save = async (
    language: FormLanguage,
    template: string | null,
    details?: FormWhatsAppDetailsConfig,
  ) => {
    if (write.current) return false;
    const controller = new AbortController();
    write.current = controller;
    setSaving(true);
    setSaveFailed(false);
    // A late read must never replace a just-saved template.
    read.current?.abort();
    try {
      const result = await formsApi.saveWhatsAppTemplate(
        scope,
        language,
        template,
        controller.signal,
        ...(details ? [details] : []),
      );
      if (controller.signal.aborted) return false;
      setTemplates(result);
      setLoadedScope(scope);
      setFailed(false);
      return true;
    } catch {
      if (!controller.signal.aborted) setSaveFailed(true);
      return false;
    } finally {
      if (write.current === controller) {
        write.current = null;
        if (!controller.signal.aborted) setSaving(false);
      }
    }
  };
  return {
    templates,
    loading: loadedScope !== scope,
    failed,
    saving,
    saveFailed,
    load,
    save,
    clearSaveError: () => setSaveFailed(false),
  };
}
