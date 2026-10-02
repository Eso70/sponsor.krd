import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";

export const metadata = { title: "Unavailable", robots: { index: false, follow: false } };

export default function PublicUnavailablePage() {
  return <BusinessServiceUnavailablePage />;
}
