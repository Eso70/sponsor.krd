import { cookies } from "next/headers";
import { PublicFormSkeleton } from "@/features/forms/components/FormSkeletons";
import { formsCopy } from "@/features/forms/forms-copy";
import {
  ROOT_PUBLIC_LOCALE_COOKIE,
  parseRootPublicLocale,
} from "@/features/public-site/root-public-locale";

export default async function FormLoading() {
  const locale = parseRootPublicLocale(
    (await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value,
  );
  return (
    <PublicFormSkeleton
      copy={formsCopy(locale)}
      label={formsCopy(locale).loading}
    />
  );
}
