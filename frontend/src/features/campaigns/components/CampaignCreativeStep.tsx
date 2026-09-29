import { EditorField } from "@/components/shared/EditorField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import {
  modalInputClass,
  modalTextareaClass,
} from "@/features/link-editor/modal-input-styles";
import { CampaignStepIntro } from "./CampaignStepIntro";
import { useCampaignText } from "../use-campaign-text";

export function CampaignCreativeStep({
  destinationUrl,
  videoCode,
  adText,
  callToAction,
  destinationError,
  onDestinationUrlChange,
  onVideoCodeChange,
  onAdTextChange,
  onCallToActionChange,
}: {
  destinationUrl: string;
  videoCode: string;
  adText: string;
  callToAction: string;
  destinationError?: string;
  onDestinationUrlChange: (value: string) => void;
  onVideoCodeChange: (value: string) => void;
  onAdTextChange: (value: string) => void;
  onCallToActionChange: (value: string) => void;
}) {
  const t = useCampaignText();
  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title={t("Destination and ad assets")}
        description={t("بەستەر، کۆدی ڤیدیۆ، دەقی ڕیکلام و دوگمەی بانگەواز زیاد بکە")}
      />

      <EditorField
        label={t("Website destination URL")}
        required
        error={destinationError}
      >
        <input
          type="url"
          value={destinationUrl}
          onChange={(event) => onDestinationUrlChange(event.target.value)}
          placeholder="https://example.com/offer"
          className={modalInputClass(Boolean(destinationError))}
          dir="ltr"
        />
      </EditorField>

      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label={t("Video code")} hint={t("TikTok video code")} required>
          <input
            value={videoCode}
            onChange={(event) => onVideoCodeChange(event.target.value)}
            placeholder={t("Enter an authorized video code")}
            className={modalInputClass()}
            dir="ltr"
          />
        </EditorField>
        <EditorField label={t("Call to action")} required>
          <CustomSelect
            label={t("Call to action")}
            hideLabel
            value={callToAction}
            onChange={onCallToActionChange}
            options={[
              {
                value: "DYNAMIC",
                label: t("Dynamic (TikTok AI هەڵبژاردنی زیرەک)"),
              },
              { value: "LEARN_MORE", label: t("Learn more") },
              { value: "SHOP_NOW", label: t("Shop now") },
              { value: "ORDER_NOW", label: t("Order now") },
              { value: "SIGN_UP", label: t("Sign up") },
              { value: "CONTACT_US", label: t("Contact us") },
              { value: "GET_QUOTE", label: t("Get quote") },
              { value: "WATCH_NOW", label: t("Watch now") },
            ]}
            triggerClassName={modalInputClass()}
          />
        </EditorField>
      </div>

      <EditorField label={t("Ad text")} hint={`${adText.length} / 100`} required>
        <textarea
          value={adText}
          maxLength={100}
          rows={4}
          onChange={(event) => onAdTextChange(event.target.value)}
          placeholder={t("Write the primary text shown with your ad")}
          className={modalTextareaClass()}
        />
      </EditorField>
    </div>
  );
}
