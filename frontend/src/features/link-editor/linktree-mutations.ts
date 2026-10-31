import type { BusinessLinktreeSummary } from "@linktree/types";
import { apiRequest, ApiRequestError, type ApiRequestOptions } from "@/lib/api/request";
import { normalizeTemplateConfig } from "@/lib/templates/config";
import { clearCachedData } from "@/lib/utils/cache";
import type { LinktreeEditorSubmitData } from "./editor-types";

export type LinktreeMutationScope = "business" | "platform";
export type LinktreeMutationResult<T = BusinessLinktreeSummary> =
  | { outcome: "saved"; page: T }
  | { outcome: "approval"; approval?: { id: string; status: "pending" } };

export const LINKTREE_APPROVAL_COPY = {
  en: "Changes submitted for approval. They have not been published yet.",
  ar: "تم إرسال التغييرات للموافقة. لم تُنشر بعد.",
  ckb: "گۆڕانکارییەکان بۆ پەسەندکردن نێردران. هێشتا بڵاو نەکراونەتەوە.",
} as const;

/** Both dashboard editors write the same canonical request contract. */
export function buildLinktreePayload(
  data: LinktreeEditorSubmitData,
  { scope, editing = false }: { scope: LinktreeMutationScope; editing?: boolean },
) {
  return {
    headline: data.headline.trim(),
    ...(data.slug ? { seo_name: data.slug } : {}),
    slogan: data.slogan?.trim() || "",
    slogan_color: data.slogan_color?.trim() || null,
    description: data.description?.trim() || "",
    logo: data.logo || null,
    background_color: data.background_color,
    template_config: normalizeTemplateConfig(data.templateKey, data.templateConfig),
    status: data.status,
    ...(!editing && (scope === "platform" || data.is_default)
      ? { is_default: scope === "business" && !!data.is_default }
      : {}),
    platforms: data.platforms,
    links: data.links,
    linkMetadata: data.linkMetadata,
  };
}

function pendingApproval(error: ApiRequestError): LinktreeMutationResult<never> {
  const payload = error.payload;
  const value = payload && typeof payload === "object" && "approval" in payload
    ? payload.approval : undefined;
  const approval = value && typeof value === "object" &&
    "id" in value && typeof value.id === "string" &&
    "status" in value && value.status === "pending"
    ? { id: value.id, status: "pending" as const } : undefined;
  return { outcome: "approval", approval };
}

export function createLinktreeMutations(scope: LinktreeMutationScope) {
  const apiBase = scope === "platform" ? "/api/platform/linktrees" : "/api/linktrees";
  const mutate = async <T>(
    url: string,
    options: ApiRequestOptions,
    id?: string,
  ): Promise<LinktreeMutationResult<T>> => {
    let page: T;
    try {
      page = await apiRequest<T>(url, options);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 202 && error.code === "APPROVAL_REQUIRED") {
        return pendingApproval(error);
      }
      throw error;
    }
    clearCachedData(apiBase);
    if (id) {
      clearCachedData(`${apiBase}/${id}`);
      clearCachedData(`${apiBase}/${id}/links`);
      clearCachedData(`${apiBase}/${id}/analytics`);
    }
    return { outcome: "saved", page };
  };
  return {
    save: (data: LinktreeEditorSubmitData, editId?: string) => mutate<BusinessLinktreeSummary>(
      editId ? `${apiBase}/${editId}` : apiBase,
      { method: editId ? "PATCH" : "POST", json: buildLinktreePayload(data, { scope, editing: !!editId }) },
      editId,
    ),
    archive: (id: string, archived: boolean) => mutate<BusinessLinktreeSummary>(
      `${apiBase}/${id}/archive`, { method: "PATCH", json: { is_archived: archived } }, id,
    ),
    status: (id: string, status: "active" | "inactive") => mutate<BusinessLinktreeSummary>(
      `${apiBase}/${id}/status`, { method: "PATCH", json: { status } }, id,
    ),
    remove: (id: string) => mutate<void>(`${apiBase}/${id}`, { method: "DELETE" }, id),
  };
}
