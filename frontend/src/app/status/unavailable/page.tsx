import { requestBranding } from "@/lib/brand/request-branding.server";
import { businessTabTitle } from "@/lib/utils/tab-title";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";

export async function generateMetadata() {
  return {title: {absolute: businessTabTitle((await requestBranding()).name, "Unavailable")}, robots: {index: false, follow: false}};
}

export default function PublicUnavailablePage() {
  return <BusinessServiceUnavailablePage />;
}
