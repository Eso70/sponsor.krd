import type {
  EffectiveAccessManifest,
  SubscriptionCatalogPlan,
} from "@linktree/types";
import { apiRequest } from "@/lib/api/request";

export interface CustomerSubscriptionOverview {
  plans: SubscriptionCatalogPlan[];
  access: EffectiveAccessManifest;
}
export function getCustomerSubscription(signal?: AbortSignal) {
  return apiRequest<CustomerSubscriptionOverview>("/api/billing/subscription", {
    signal,
  });
}
