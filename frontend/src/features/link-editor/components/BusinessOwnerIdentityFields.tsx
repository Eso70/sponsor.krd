import type { ComponentProps } from "react";
import { AccountIdentityFields } from "@/components/shared/AccountIdentityFields";

interface BusinessOwnerIdentityFieldsProps {
  ownerName?: string | null;
  ownerEmail?: string | null;
  copy?: ComponentProps<typeof AccountIdentityFields>["copy"];
}

export function BusinessOwnerIdentityFields({
  ownerName,
  ownerEmail,
  copy,
}: BusinessOwnerIdentityFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <AccountIdentityFields name={ownerName} email={ownerEmail} copy={copy} />
    </div>
  );
}
