import { formImageBlob } from "./form-media";
import { FormUploadError } from "./form-upload-error";
import { apiRequest } from "@/lib/api/request";
import type {
  FormDraft,
  FormTitleAvailability,
  FormCollectionPage,
  FormMetrics,
  FormAnalytics,
  FormSubmissionFilters,
  FormSubmissionsPage,
  FormSubmissionInput,
} from "@linktree/types";
export type FormsScope = "business" | "platform";
const endpoint = (scope: FormsScope) =>
  scope === "platform" ? "/api/platform/forms" : "/api/forms";
async function uploadDraftImages(
  form: FormDraft,
  scope: FormsScope,
): Promise<FormDraft> {
  const uploads = new Map<string, Promise<string>>();
  const mediaKeys = new Set([
    "banner",
    "logo",
    "bannerImages",
    "image",
    "images",
    "optionImages",
  ]);
  async function visit(value: unknown, key = ""): Promise<unknown> {
    if (
      typeof value === "string" &&
      mediaKeys.has(key) &&
      value.startsWith("data:image/")
    ) {
      if (!uploads.has(value))
        uploads.set(
          value,
          (async () => {
            try {
              const blob = formImageBlob(value);
              const data = new FormData();
              data.append(
                "file",
                blob,
                "form-image." +
                  (blob.type === "image/jpeg"
                    ? "jpg"
                    : blob.type === "image/webp"
                      ? "webp"
                      : "png"),
              );
              return (
                await apiRequest<{ url: string }>(endpoint(scope) + "/upload", {
                  method: "POST",
                  body: data,
                })
              ).url;
            } catch (error) {
              throw new FormUploadError(value, error);
            }
          })(),
        );
      return uploads.get(value)!;
    }
    if (Array.isArray(value)) {
      const output = [];
      for (const item of value) output.push(await visit(item, key));
      return output;
    }
    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value))
        output[key] = await visit(item, key);
      return output;
    }
    return value;
  }
  return (await visit(form)) as FormDraft;
}
export const formsApi = {
  titleAvailability: (
    scope: FormsScope,
    title: string,
    excludeId?: string,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ title });
    if (excludeId) query.set("excludeId", excludeId);
    return apiRequest<FormTitleAvailability>(
      `${endpoint(scope)}/title-availability?${query}`,
      { signal },
    );
  },
  list: (
    scope: FormsScope,
    page = 0,
    q = "",
    filter = "active",
    signal?: AbortSignal,
  ) =>
    apiRequest<FormCollectionPage>(
      `${endpoint(scope)}?page=${page}&q=${encodeURIComponent(q)}&filter=${filter}`,
      { signal },
    ),
  analytics: (scope: FormsScope, id: string, signal?: AbortSignal) =>
    apiRequest<FormAnalytics>(`${endpoint(scope)}/${id}/analytics`, { signal }),
  get: (scope: FormsScope, id: string, signal?: AbortSignal) =>
    apiRequest<FormDraft>(`${endpoint(scope)}/${id}`, { signal }),
  stats: (scope: FormsScope, signal?: AbortSignal) =>
    apiRequest<FormMetrics>(endpoint(scope) + "/stats", { signal }),
  async save(scope: FormsScope, form: FormDraft, isNew: boolean) {
    const persisted = await uploadDraftImages(form, scope);
    return apiRequest<FormDraft>(
      endpoint(scope) + (isNew ? "" : `/${form.id}`),
      { method: isNew ? "POST" : "PATCH", json: persisted },
    );
  },
  status: (scope: FormsScope, id: string, status: FormDraft["status"]) =>
    apiRequest<FormDraft>(`${endpoint(scope)}/${id}/status`, {
      method: "PATCH",
      json: { status },
    }),
  archive: (scope: FormsScope, id: string, isArchived: boolean) =>
    apiRequest<FormDraft>(`${endpoint(scope)}/${id}/archive`, {
      method: "PATCH",
      json: { isArchived },
    }),
  duplicate: (scope: FormsScope, id: string) =>
    apiRequest<FormDraft>(`${endpoint(scope)}/${id}/duplicate`, {
      method: "POST",
    }),
  remove: (scope: FormsScope, id: string) =>
    apiRequest(`${endpoint(scope)}/${id}`, { method: "DELETE" }),
  deleteSubmissions: (scope: FormsScope, id: string) =>
    apiRequest<{ deleted: number }>(`${endpoint(scope)}/${id}/submissions`, {
      method: "DELETE",
    }),
  submissions: (
    scope: FormsScope,
    id: string,
    page: number,
    signal?: AbortSignal,
    filters: FormSubmissionFilters = {},
  ) => {
    const query = new URLSearchParams({ page: String(page) });
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && value !== "") query.set(key, String(value));
    return apiRequest<FormSubmissionsPage>(
      `${endpoint(scope)}/${id}/submissions?${query}`,
      { signal },
    );
  },
  submit: (
    slug: string,
    input: FormSubmissionInput & {
      tracking: import("@linktree/types").FormSubmissionTracking;
    },
  ) =>
    apiRequest<{ id: string }>(
      `/api/public/forms/${encodeURIComponent(slug)}/submissions`,
      { method: "POST", json: input },
    ),
};
