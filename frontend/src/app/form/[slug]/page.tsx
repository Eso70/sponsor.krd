import { requestBranding } from "@/lib/brand/request-branding.server";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { TikTokPixelBaseCode } from "@/components/analytics/TikTokPixelBaseCode";
import { buildFormMetadata } from "@/features/forms/form-seo";
import { fetchPublicForm } from "@/features/forms/public-form.server";
import { PublicFormPage } from "@/features/forms/components/PublicFormPage";
import { PublicImageDimensionsProvider } from "@/components/shared/PublicImageDimensionsProvider";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await fetchPublicForm(slug);
  const branding = await requestBranding();
  return buildFormMetadata(
    payload.form,
    payload.origin,
    payload.businessLogo || branding.logo,
    branding.favicon,
  );
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { form, analytics, privacyVersion, imageDimensions } =
    await fetchPublicForm(slug);
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <>
      <TikTokPixelBaseCode pixelIds={analytics.pixelIds} nonce={nonce} />
      <PublicImageDimensionsProvider dimensions={imageDimensions}>
        <PublicFormPage
          privacyVersion={privacyVersion}
          form={form}
          analytics={analytics}
        />
      </PublicImageDimensionsProvider>
    </>
  );
}
