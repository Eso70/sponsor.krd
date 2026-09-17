import { EditorField } from "@/components/shared/EditorField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import {
  modalInputClass,
  modalTextareaClass,
} from "@/features/link-editor/modal-input-styles";
import { CampaignStepIntro } from "./CampaignStepIntro";

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
  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title="Destination and ad assets"
        description="بەستەر، کۆدی ڤیدیۆ، دەقی ڕیکلام و دوگمەی بانگەواز زیاد بکە"
      />

      <EditorField
        label="Website destination URL"
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
        <EditorField label="Video code" hint="TikTok video code" required>
          <input
            value={videoCode}
            onChange={(event) => onVideoCodeChange(event.target.value)}
            placeholder="Enter an authorized video code"
            className={modalInputClass()}
            dir="ltr"
          />
        </EditorField>
        <EditorField label="Call to action" required>
          <CustomSelect
            label="Call to action"
            hideLabel
            value={callToAction}
            onChange={onCallToActionChange}
            options={[
              {
                value: "DYNAMIC",
                label: "Dynamic (TikTok AI هەڵبژاردنی زیرەک)",
              },
              { value: "LEARN_MORE", label: "Learn more" },
              { value: "SHOP_NOW", label: "Shop now" },
              { value: "ORDER_NOW", label: "Order now" },
              { value: "SIGN_UP", label: "Sign up" },
              { value: "CONTACT_US", label: "Contact us" },
              { value: "GET_QUOTE", label: "Get quote" },
              { value: "WATCH_NOW", label: "Watch now" },
            ]}
            triggerClassName={modalInputClass()}
          />
        </EditorField>
      </div>

      <EditorField label="Ad text" hint={`${adText.length} / 100`} required>
        <textarea
          value={adText}
          maxLength={100}
          rows={4}
          onChange={(event) => onAdTextChange(event.target.value)}
          placeholder="Write the primary text shown with your ad"
          className={modalTextareaClass()}
        />
      </EditorField>
    </div>
  );
}
