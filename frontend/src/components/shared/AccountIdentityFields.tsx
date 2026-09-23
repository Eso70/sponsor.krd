import Image from "next/image";
import { ShieldCheck, UserRound } from "lucide-react";
import { EditorField } from "@/components/shared/EditorField";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import { remoteAvatarSrc } from "@/lib/utils/remote-avatar";

interface AccountIdentityFieldsProps {
  name?: string | null;
  email?: string | null;
  avatarSrc?: string | null;
  emailVerified?: boolean;
  copy?: Partial<Record<"accountImage" | "imageOf" | "accountName" | "fromVerified" | "email" | "verified" | "unverified" | "unavailable" | "verifiedEmail", string>>;
}

/**
 * Read-only identity returned by a verified authentication provider.
 * Shared settings surfaces use this presentation so identity fields cannot
 * accidentally look editable.
 */
export function AccountIdentityFields({
  name,
  email,
  avatarSrc,
  emailVerified = true,
  copy,
}: AccountIdentityFieldsProps) {
  // A stored photo `next/image` cannot load draws the placeholder instead of
  // throwing the settings page away.
  const avatarImage = remoteAvatarSrc(avatarSrc);
  return (
    <div className="contents">
      {avatarSrc !== undefined ? (
        <div className="col-span-full flex flex-col items-center gap-3 py-2">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl ring-1 ring-slate-200 dark:border-[#161B22] dark:bg-slate-800 dark:ring-white/10">
            {avatarImage ? (
              <Image
                src={avatarImage}
                alt={name ? `${copy?.imageOf ?? "وێنەی"} ${name}` : copy?.accountImage ?? "وێنەی هەژمار"}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <UserRound
                aria-hidden="true"
                className="h-10 w-10 text-slate-400"
              />
            )}
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {copy?.accountImage ?? "وێنەی هەژمار"}
          </span>
        </div>
      ) : null}

      <EditorField label={copy?.accountName ?? "ناوی هەژمار"} hint={copy?.fromVerified ?? "لە هەژماری پشتڕاستکراوەوە"}>
        <input
          disabled
          className={`${modalInputClass()} cursor-not-allowed opacity-60`}
          value={name || copy?.unavailable || "بەردەست نییە"}
        />
      </EditorField>
      <EditorField
        label={copy?.email ?? "ئیمەیڵ"}
        hint={emailVerified ? copy?.verified ?? "پشتڕاستکراوە" : copy?.unverified ?? "پشتڕاستنەکراوە"}
      >
        <div className="relative">
          <input
            disabled
            type="email"
            dir="ltr"
            className={`${modalInputClass()} cursor-not-allowed pe-10 opacity-60`}
            value={email || copy?.unavailable || "بەردەست نییە"}
          />
          {emailVerified ? (
            <ShieldCheck
              aria-label={copy?.verifiedEmail ?? "ئیمەیڵ پشتڕاستکراوە"}
              className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
            />
          ) : null}
        </div>
      </EditorField>
    </div>
  );
}
