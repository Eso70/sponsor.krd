import { apiRequest } from "@/lib/api/request";
import { runSelectedPageRequests } from "./run-selected-page-requests";

/** Existing endpoints retain their owner-scoped per-page authorization. */
export async function clearSelectedAnalytics(
  apiBase: string,
  ids: readonly string[],
) {
  const business = apiBase === "/api/linktrees";
  await runSelectedPageRequests(
    ids,
    (id) =>
      apiRequest(
        `${apiBase}/${encodeURIComponent(id)}/analytics${business ? "/clear" : ""}`,
        { method: business ? "POST" : "DELETE" },
      ),
    "Some selected page analytics could not be deleted",
  );
}
