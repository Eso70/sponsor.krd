import { EditorField } from "@/components/shared/EditorField";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import { OBJECTIVE_LABELS } from "../campaign-objectives";
import type { CampaignObjective } from "../types";
import { CampaignChoiceField } from "./CampaignChoiceField";
import { CampaignChoiceGroup } from "./CampaignChoiceGroup";
import { CampaignStepIntro } from "./CampaignStepIntro";
import { useCampaignText } from "../use-campaign-text";

export function CampaignIdentityStep({
  campaignName,
  objective,
  onCampaignNameChange,
  onObjectiveChange,
}: {
  campaignName: string;
  objective: CampaignObjective;
  onCampaignNameChange: (value: string) => void;
  onObjectiveChange: (value: CampaignObjective) => void;
}) {
  const t = useCampaignText();
  const objectives = (Object.keys(OBJECTIVE_LABELS) as CampaignObjective[]).map(
    (value) => ({ value, label: t(OBJECTIVE_LABELS[value].label) }),
  );

  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title={t("Campaign structure")}
        description={t("یەک ناوی یەکگرتوو بۆ Campaign، Ad Group و Ad بەکاربهێنە")}
      />

      <EditorField
        label={t("Campaign, Ad Group & Ad name")}
        hint={t("One unified name")}
        required
      >
        <input
          value={campaignName}
          onChange={(event) => onCampaignNameChange(event.target.value)}
          placeholder={t("September sales campaign")}
          className={modalInputClass()}
        />
      </EditorField>

      <CampaignChoiceField label={t("Campaign type")} required>
        <CampaignChoiceGroup
          value={objective}
          options={objectives}
          onChange={onObjectiveChange}
          columns={4}
        />
      </CampaignChoiceField>
    </div>
  );
}
