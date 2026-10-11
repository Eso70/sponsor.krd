import type { Metadata } from "next";
import { headers } from "next/headers";
import { TikTokPixelBaseCode } from "@/components/analytics/TikTokPixelBaseCode";
import { buildFormMetadata } from "@/features/forms/form-seo";
import { fetchPublicForm } from "@/features/forms/public-form.server";
import { PublicFormPage } from "@/features/forms/components/PublicFormPage";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await fetchPublicForm(slug);
  return buildFormMetadata(payload.form, payload.origin, payload.businessLogo);
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { form, analytics, privacyVersion } = await fetchPublicForm(slug);
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <>
      <TikTokPixelBaseCode pixelIds={analytics.pixelIds} nonce={nonce} />
      <PublicFormPage
        privacyVersion={privacyVersion}
        form={form}
        analytics={analytics}
      />
    </>
  );
}
