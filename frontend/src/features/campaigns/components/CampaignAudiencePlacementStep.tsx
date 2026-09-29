import { Check } from "lucide-react";

import { EditorField } from "@/components/shared/EditorField";
import {
  modalChoiceButtonClass,
  modalInputClass,
} from "@/features/link-editor/modal-input-styles";
import type {
  CampaignGender,
  CreateCampaignFormState,
} from "../create-campaign-form";
import type { CampaignPlacement } from "../types";
import { CampaignChoiceField } from "./CampaignChoiceField";
import { CampaignChoiceGroup } from "./CampaignChoiceGroup";
import { CampaignStepIntro } from "./CampaignStepIntro";
import { useCampaignText } from "../use-campaign-text";

const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"];

export function CampaignAudiencePlacementStep({
  location,
  gender,
  ageGroups,
  languages,
  placement,
  onChange,
}: Pick<
  CreateCampaignFormState,
  "location" | "gender" | "ageGroups" | "languages" | "placement"
> & {
  onChange: <K extends keyof CreateCampaignFormState>(
    key: K,
    value: CreateCampaignFormState[K],
  ) => void;
}) {
  const t = useCampaignText();
  const toggleAge = (age: string) => {
    onChange(
      "ageGroups",
      ageGroups.includes(age)
        ? ageGroups.filter((item) => item !== age)
        : [...ageGroups, age],
    );
  };

  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title={t("Audience targeting and placement")}
        description={t("شوێن، تەمەن، ڕەگەز و شوێنی پیشاندانی ڕیکلامەکە دیاری بکە")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label={t("Target location")} required>
          <input
            value={location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder={t("Erbil, Sulaymaniyah, Duhok")}
            className={modalInputClass()}
          />
        </EditorField>
        <EditorField label={t("Languages")}>
          <input
            value={languages}
            onChange={(event) => onChange("languages", event.target.value)}
            placeholder={t("Kurdish, Arabic")}
            className={modalInputClass()}
          />
        </EditorField>
      </div>

      <CampaignChoiceField label={t("Gender")}>
        <CampaignChoiceGroup<CampaignGender>
          value={gender}
          options={[
            { value: "ALL", label: t("All") },
            { value: "MALE", label: t("Male") },
            { value: "FEMALE", label: t("Female") },
          ]}
          onChange={(value) => onChange("gender", value)}
        />
      </CampaignChoiceField>

      <CampaignChoiceField label={t("Age groups")} required>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {AGE_GROUPS.map((age) => {
            const selected = ageGroups.includes(age);
            return (
              <button
                key={age}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAge(age)}
                className={modalChoiceButtonClass(
                  false,
                  "min-h-11 justify-center text-center font-semibold",
                )}
                style={
                  selected
                    ? {
                        borderColor: "var(--theme-primary)",
                        background:
                          "color-mix(in srgb, var(--theme-primary) 8%, transparent)",
                      }
                    : undefined
                }
              >
                {selected ? <Check className="size-3.5" /> : null}
                {age}
              </button>
            );
          })}
        </div>
      </CampaignChoiceField>

      <CampaignChoiceField label={t("Placement")} required>
        <CampaignChoiceGroup<CampaignPlacement>
          value={placement}
          options={[
            {
              value: "AUTOMATIC",
              label: t("Automatic placement"),
              description: t("TikTok باشترین شوێنەکان هەڵدەبژێرێت"),
            },
            { value: "TIKTOK_ONLY", label: t("TikTok only") },
            { value: "SELECTED", label: t("Select placement") },
          ]}
          onChange={(value) => onChange("placement", value)}
        />
      </CampaignChoiceField>
    </div>
  );
}
