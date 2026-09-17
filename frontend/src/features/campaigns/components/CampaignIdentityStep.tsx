import { EditorField } from "@/components/shared/EditorField";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import { OBJECTIVE_LABELS } from "../mock-data";
import type { CampaignObjective } from "../types";
import { CampaignChoiceField } from "./CampaignChoiceField";
import { CampaignChoiceGroup } from "./CampaignChoiceGroup";
import { CampaignStepIntro } from "./CampaignStepIntro";

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
  const objectives = (Object.keys(OBJECTIVE_LABELS) as CampaignObjective[]).map(
    (value) => ({ value, label: OBJECTIVE_LABELS[value].label }),
  );

  return (
    <div className="space-y-5">
      <CampaignStepIntro
        title="Campaign structure"
        description="یەک ناوی یەکگرتوو بۆ Campaign، Ad Group و Ad بەکاربهێنە"
      />

      <EditorField
        label="Campaign, Ad Group & Ad name"
        hint="One unified name"
        required
      >
        <input
          value={campaignName}
          onChange={(event) => onCampaignNameChange(event.target.value)}
          placeholder="September sales campaign"
          className={modalInputClass()}
        />
      </EditorField>

      <CampaignChoiceField label="Campaign type" required>
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
