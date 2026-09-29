import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, FlaskConical, XCircle } from "lucide-react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import type { Overview } from "./types";
import { useAccessText } from "./use-access-text";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

function reasonLabel(reason: string, t: (source: string) => string) {
  if (reason === "GRANTED") return t("مۆڵەت پێدراوە");
  if (reason === "NO_PERMISSION") return t("مۆڵەت لەم پڕۆفایلەدا نییە");
  if (reason === "FIELD_DENIED") return t("یەکێک لە خانەکان ڕەتکراوەتەوە");
  if (reason === "APPROVAL_REQUIRED") return t("پێویستی بە پەسەندکردن هەیە");
  return reason;
}

export function PolicySimulator({ data }: { data: Overview }) {
  const t = useAccessText();
  const { locale } = usePlatformLocale();
  const [profileId, setProfileId] = useState(data.profiles[0]?.id || "");
  const [permission, setPermission] = useState(data.permissions[0]?.key || "");
  const [result, setResult] = useState<{
    allowed: boolean;
    outcome: "allow" | "deny" | "approval";
    reason: string;
    deniedFields: string[];
    approvalFields: string[];
    effectivePermissions: string[];
    profile: { name: string };
  } | null>(null);

  const effectiveProfileId = data.profiles.some(
    (profile) => profile.id === profileId,
  )
    ? profileId
    : data.profiles[0]?.id || "";

  const simulate = async () => {
    if (!effectiveProfileId || !permission) return;
    const response = await fetch("/api/platform/access-control/simulate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: effectiveProfileId,
        permission,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(platformRequestError(payload.message, t("تاقیکردنەوەی پڕۆفایلی مۆڵەت سەرکەوتوو نەبوو"), locale));
      return;
    }
    setResult(payload.data);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <CustomSelect
          label={t("پڕۆفایلی مۆڵەت")}
          emptyLabel={t("هیچ هەڵبژاردەیەک نییە")}
          value={effectiveProfileId}
          options={data.profiles.map((profile) => ({
            value: profile.id,
            label: profile.name,
          }))}
          onChange={(value) => {
            setProfileId(value);
            setResult(null);
          }}
        />
        <CustomSelect
          label={t("مۆڵەت")}
          emptyLabel={t("هیچ هەڵبژاردەیەک نییە")}
          value={permission}
          options={data.permissions.map((item) => ({
            value: item.key,
            label: item.key,
          }))}
          onChange={(value) => {
            setPermission(value);
            setResult(null);
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => void simulate()}
        className="sa-gradient sa-gradient-hover flex h-10 w-fit items-center gap-2 rounded-xl px-4 text-xs font-bold"
      >
        <FlaskConical className="h-4 w-4" />
        {t("تاقیکردنەوە")}
      </button>

      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result.outcome === "allow"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : result.outcome === "approval"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {result.outcome === "allow" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : result.outcome === "approval" ? (
              <Clock3 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {result.outcome === "allow"
              ? t("ڕێگەپێدراوە")
              : result.outcome === "approval"
                ? t("پێویستی بە پەسەندکردنە")
                : t("ڕەتکرایەوە")}
          </div>
          <p className="mt-1 text-xs">
            {result.profile.name} · {reasonLabel(result.reason, t)}
          </p>
          <p className="mt-2 text-[10px]">
            {t("مۆڵەتە کاریگەرەکان:")} {result.effectivePermissions.length}
          </p>
          {!!result.deniedFields.length && (
            <p className="mt-1 text-[10px]">
              {t("گۆڕەپانی ڕەتکراو:")} {result.deniedFields.join(", ")}
            </p>
          )}
          {!!result.approvalFields.length && (
            <p className="mt-1 text-[10px]">
              {t("گۆڕەپانی پەسەندکردن:")} {result.approvalFields.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
