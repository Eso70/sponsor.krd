"use client";

import { ManagementModal } from "@/components/shared/ManagementModal";
import { subscriptionCopy, type BillingLocale } from "../copy";

export function BusinessSubscriptionModal({
  isOpen,
  onClose,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: BillingLocale;
}) {
  const copy = subscriptionCopy[locale];
  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      closeLabel={copy.close}
    >
      <p className="py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
        {copy.comingSoon}
      </p>
    </ManagementModal>
  );
}
