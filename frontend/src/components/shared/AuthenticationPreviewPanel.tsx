import Image from "next/image";
import {
  BUSINESS_LOGO_PLACEHOLDER,
  SPONSOR_KRD_LOGO,
  SPONSOR_KRD_ORIGINAL_LOGO,
} from "@/lib/brand/brand-assets";

interface AuthenticationPreviewPanelProps {
  description: string;
  brandName?: string;
  brandLogo?: string | null;
  title?: string;
  businessTenant?: boolean;
}

export function AuthenticationPreviewPanel({
  description,
  brandName,
  brandLogo,
  title,
  businessTenant = false,
}: AuthenticationPreviewPanelProps) {
  const effectiveBrandName =
    brandName || (businessTenant ? "بزنس" : "Sponsor.krd");
  const effectiveBrandLogo =
    brandLogo !== undefined
      ? brandLogo
      : businessTenant
        ? BUSINESS_LOGO_PLACEHOLDER
        : SPONSOR_KRD_LOGO;
  const effectiveTitle =
    title ??
    (businessTenant || effectiveBrandName !== "Sponsor.krd"
      ? "پانێڵی بزنس"
      : "پانێڵی پلاتفۆڕم");
  const logoSource =
    effectiveBrandLogo ||
    (businessTenant ? BUSINESS_LOGO_PLACEHOLDER : SPONSOR_KRD_LOGO);
  const previewLogoSource =
    logoSource === SPONSOR_KRD_LOGO ? SPONSOR_KRD_ORIGINAL_LOGO : logoSource;

  return (
    <aside className="theme-fill relative hidden min-w-0 overflow-hidden rounded-l-[32px] p-8 lg:flex lg:items-center lg:justify-center xl:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,.5),transparent_28%),linear-gradient(145deg,transparent,rgba(15,23,42,.1))]" />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-slate-900/10" />
      <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full border border-slate-900/10" />
      <div
        className="relative min-w-0 w-full max-w-md break-words text-center text-white [overflow-wrap:anywhere]"
        dir="ltr"
      >
        <Image
          src={previewLogoSource}
          alt={effectiveBrandName}
          width={80}
          height={80}
          className="mx-auto h-20 w-20 max-w-full rounded-3xl object-contain"
        />
        <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-white/75">
          {effectiveBrandName}
        </p>
        <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight">
          {effectiveTitle}
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-sm font-medium leading-7 text-white/85">
          {description}
        </p>
        <div className="mx-auto mt-8 h-1.5 w-20 rounded-full bg-slate-950/15" />
      </div>
    </aside>
  );
}
