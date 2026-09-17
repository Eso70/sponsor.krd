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
        title="Audience targeting and placement"
        description="شوێن، تەمەن، ڕەگەز و شوێنی پیشاندانی ڕیکلامەکە دیاری بکە"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label="Target location" required>
          <input
            value={location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Erbil, Sulaymaniyah, Duhok"
            className={modalInputClass()}
          />
        </EditorField>
        <EditorField label="Languages">
          <input
            value={languages}
            onChange={(event) => onChange("languages", event.target.value)}
            placeholder="Kurdish, Arabic"
            className={modalInputClass()}
          />
        </EditorField>
      </div>

      <CampaignChoiceField label="Gender">
        <CampaignChoiceGroup<CampaignGender>
          value={gender}
          options={[
            { value: "ALL", label: "All" },
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
          onChange={(value) => onChange("gender", value)}
        />
      </CampaignChoiceField>

      <CampaignChoiceField label="Age groups" required>
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

      <CampaignChoiceField label="Placement" required>
        <CampaignChoiceGroup<CampaignPlacement>
          value={placement}
          options={[
            {
              value: "AUTOMATIC",
              label: "Automatic placement",
              description: "TikTok باشترین شوێنەکان هەڵدەبژێرێت",
            },
            { value: "TIKTOK_ONLY", label: "TikTok only" },
            { value: "SELECTED", label: "Select placement" },
          ]}
          onChange={(value) => onChange("placement", value)}
        />
      </CampaignChoiceField>
    </div>
  );
}
