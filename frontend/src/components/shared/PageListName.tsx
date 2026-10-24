import { VerificationBadge } from "./VerificationBadge";

/** Keep the optional appearance badge visible when a long name is truncated. */
export function PageListName({
  name,
  verified = false,
  verificationLabel,
}: {
  name: string;
  verified?: boolean;
  verificationLabel?: string;
}) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 align-middle">
      <span className="min-w-0 truncate" dir="auto">
        {name}
      </span>
      {verified && (
        <VerificationBadge label={verificationLabel} className="size-[1em]" />
      )}
    </span>
  );
}
