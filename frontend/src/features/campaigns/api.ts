import type {
  CampaignRevenueInput,
  CampaignRevenueRecord,
} from "@linktree/types";
import { apiRequest } from "@/lib/api/request";

function recordsUrl(apiBasePath: string, linktreeId: string) {
  return `${apiBasePath}/${encodeURIComponent(linktreeId)}/revenue-records`;
}

export function getCampaignRevenueRecords(
  apiBasePath: string,
  linktreeId: string,
  signal?: AbortSignal,
) {
  return apiRequest<CampaignRevenueRecord[]>(
    recordsUrl(apiBasePath, linktreeId),
    { signal },
  );
}

export function createCampaignRevenueRecord(
  apiBasePath: string,
  linktreeId: string,
  input: CampaignRevenueInput,
) {
  return apiRequest<CampaignRevenueRecord>(
    recordsUrl(apiBasePath, linktreeId),
    { method: "POST", json: input },
  );
}

export function updateCampaignRevenueRecord(
  apiBasePath: string,
  linktreeId: string,
  recordId: string,
  input: CampaignRevenueInput,
) {
  return apiRequest<CampaignRevenueRecord>(
    `${recordsUrl(apiBasePath, linktreeId)}/${encodeURIComponent(recordId)}`,
    { method: "PATCH", json: input },
  );
}

export function deleteCampaignRevenueRecord(
  apiBasePath: string,
  linktreeId: string,
  recordId: string,
) {
  return apiRequest<void>(
    `${recordsUrl(apiBasePath, linktreeId)}/${encodeURIComponent(recordId)}`,
    { method: "DELETE" },
  );
}
