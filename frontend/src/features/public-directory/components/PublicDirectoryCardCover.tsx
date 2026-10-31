import { FileText, Link2 } from "lucide-react";
import type { PublicDirectoryKind } from "@linktree/types";

/** Branded fallback when the owner has not published a banner. */
export function PublicDirectoryCardCover({ kind }: { kind: PublicDirectoryKind }) {
  const Icon = kind === "form" ? FileText : Link2;
  return <div aria-hidden="true" className="relative flex aspect-[3/1] w-full items-center justify-center overflow-hidden bg-[linear-gradient(125deg,color-mix(in_srgb,var(--business-accent)_20%,white),color-mix(in_srgb,var(--business-accent)_5%,white))] dark:bg-[linear-gradient(125deg,color-mix(in_srgb,var(--business-accent)_30%,#111827),#111827)]">
    <div className="absolute -start-8 -top-12 size-44 rounded-full border-[24px] border-white/25" />
    <div className="absolute -bottom-16 -end-4 size-40 rounded-full border-[20px] border-white/25" />
    <Icon className="size-10 -rotate-12 text-[var(--business-accent)] opacity-50" strokeWidth={1.25} />
  </div>;
}
