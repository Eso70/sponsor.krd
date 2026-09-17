"use client";

import { useMemo, useState } from "react";

import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalWizardActions } from "@/components/shared/ModalWizardActions";
import { ModalWizardProgress } from "@/components/shared/ModalWizardProgress";
import { shouldAdvanceModalWizardOnEnter } from "@/components/shared/modal-wizard-keyboard";
import {
  CAMPAIGN_WIZARD_STEPS,
  INITIAL_CREATE_CAMPAIGN_FORM,
  isValidWebsiteUrl,
  type CampaignWizardStep,
  type CreateCampaignFormState,
} from "../create-campaign-form";
import type {
  CampaignObjective,
  CampaignOptimizationGoal,
  TikTokCampaign,
} from "../types";
import { buildTikTokApiPayload } from "../tiktok-payload-builder";
import { CampaignAudiencePlacementStep } from "./CampaignAudiencePlacementStep";
import { CampaignBudgetScheduleStep } from "./CampaignBudgetScheduleStep";
import { CampaignCreativeStep } from "./CampaignCreativeStep";
import { CampaignIdentityStep } from "./CampaignIdentityStep";
import { CampaignInteractiveAddOnsStep } from "./CampaignInteractiveAddOnsStep";
import { CampaignOptimizationStep } from "./CampaignOptimizationStep";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (campaign: TikTokCampaign) => void;
  sponsorKrdTheme?: boolean;
}

const STEP_DESCRIPTIONS: Record<CampaignWizardStep, string> = {
  setup: "ناسنامە، جۆر و ئۆپتیمایزکردنی کەمپەین",
  delivery: "بودجە، خشتەی کات، بینەر و شوێنی پیشاندان",
  creative: "بەستەر، ڤیدیۆ، دەقی ڕیکلام و Interactive add-ons",
};

const CALL_TO_ACTION_LABELS: Record<string, string> = {
  LEARN_MORE: "Learn more",
  SHOP_NOW: "Shop now",
  CONTACT_US: "Contact us",
  SIGN_UP: "Sign up",
  GET_QUOTE: "Get quote",
};

function destinationLabel(urlValue: string): string {
  try {
    return new URL(urlValue).hostname;
  } catch {
    return "Website destination";
  }
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onCreate,
  sponsorKrdTheme = false,
}: CreateCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState<CampaignWizardStep>("setup");
  const [form, setForm] = useState<CreateCampaignFormState>(
    INITIAL_CREATE_CAMPAIGN_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = CAMPAIGN_WIZARD_STEPS.findIndex(
    (step) => step.id === currentStep,
  );
  const isFirstStep = currentIndex === 0;
  const isFinalStep = currentIndex === CAMPAIGN_WIZARD_STEPS.length - 1;
  const destinationError =
    form.destinationUrl && !isValidWebsiteUrl(form.destinationUrl)
      ? "تکایە بەستەرێکی دروستی وێبسایت بنووسە"
      : undefined;

  const updateField = <K extends keyof CreateCampaignFormState>(
    key: K,
    value: CreateCampaignFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleObjectiveChange = (nextObjective: CampaignObjective) => {
    let nextGoal: CampaignOptimizationGoal = "REACH";
    let nextEvent = form.optimizationEvent;
    if (nextObjective === "VIDEO_VIEWS") {
      nextGoal = "VIDEO_VIEW_IN_6S";
    } else if (nextObjective === "WEBSITE_LEAD") {
      nextGoal = "LEADS";
      nextEvent = "Contact";
    } else if (nextObjective === "SALES") {
      nextGoal = "CONVERSIONS";
      nextEvent = "Purchase";
    }
    setForm((current) => ({
      ...current,
      objective: nextObjective,
      optimizationGoal: nextGoal,
      optimizationEvent: nextEvent,
    }));
  };

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case "setup":
        return (
          Boolean(form.campaignName.trim() && form.optimizationGoal) &&
          ((form.objective !== "WEBSITE_LEAD" && form.objective !== "SALES") ||
            Boolean(form.dataConnectionId && form.optimizationEvent))
        );
      case "delivery":
        return (
          form.dailyBudget >= 5 &&
          (form.scheduleType === "START_NOW" ||
            (Boolean(form.startDate) &&
              Boolean(form.endDate) &&
              form.endDate >= form.startDate)) &&
          Boolean(form.location.trim() && form.ageGroups.length)
        );
      case "creative":
        return (
          Boolean(
            isValidWebsiteUrl(form.destinationUrl) &&
            form.videoCode.trim() &&
            form.adText.trim() &&
            form.callToAction,
          ) &&
          (!form.interactiveAddOnEnabled ||
            (form.addOnMode === "CREATE"
              ? Boolean(form.newAddOnType)
              : Boolean(form.existingAddOnId)))
        );
    }
  }, [currentStep, form]);

  const resetAndClose = () => {
    if (isSubmitting) return;
    setCurrentStep("setup");
    setForm(INITIAL_CREATE_CAMPAIGN_FORM);
    onClose();
  };

  const handleBack = () => {
    const previous = CAMPAIGN_WIZARD_STEPS[currentIndex - 1];
    if (previous) setCurrentStep(previous.id);
  };

  const handleNext = () => {
    if (!canContinue) return;
    const next = CAMPAIGN_WIZARD_STEPS[currentIndex + 1];
    if (next) setCurrentStep(next.id);
  };

  const handleSubmit = () => {
    if (!canContinue || isSubmitting) return;
    setIsSubmitting(true);

    window.setTimeout(() => {
      const now = new Date().toISOString();
      const destination = new URL(form.destinationUrl);
      const addOnValue =
        form.addOnMode === "CREATE" ? form.newAddOnType : form.existingAddOnId;
      const campaign: TikTokCampaign = {
        id: `camp-${Date.now()}`,
        name: form.campaignName.trim(),
        adGroupName: form.campaignName.trim(),
        adName: form.campaignName.trim(),
        objective: form.objective,
        status: "review",
        video: {
          title: form.videoCode.trim(),
          duration: "00:20",
          format: "9:16",
          resolution: "1080 × 1920",
          tone: "cyan",
        },
        dailyBudget: form.dailyBudget,
        totalSpent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        conversions: 0,
        destinationPage: {
          id: `destination-${Date.now()}`,
          title: destinationLabel(form.destinationUrl),
          slug:
            destination.pathname.replace(/^\/+|\/+$/g, "") ||
            destination.hostname,
          type: "website",
          url: form.destinationUrl,
        },
        targetAudience: {
          location: form.location.trim(),
          gender: form.gender,
          ageGroups: form.ageGroups,
          languages: form.languages
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
        },
        callToAction:
          CALL_TO_ACTION_LABELS[form.callToAction] || form.callToAction,
        setup: {
          optimizationGoal: form.optimizationGoal,
          dataConnectionId:
            form.objective === "WEBSITE_LEAD" || form.objective === "SALES"
              ? form.dataConnectionId
              : undefined,
          optimizationEvent: form.optimizationEvent,
          bidStrategy: form.bidStrategy,
          scheduleType: form.scheduleType,
          startDate: form.startDate,
          endDate: form.endDate,
          placement: form.placement,
          destinationUrl: form.destinationUrl,
          videoCode: form.videoCode.trim(),
          adText: form.adText.trim(),
          interactiveAddOn: form.interactiveAddOnEnabled
            ? {
                mode: form.addOnMode,
                value: addOnValue,
              }
            : undefined,
        },
        tiktokPayload: buildTikTokApiPayload(form),
        createdAt: now,
        updatedAt: now,
      };

      onCreate(campaign);
      setIsSubmitting(false);
      setCurrentStep("setup");
      setForm(INITIAL_CREATE_CAMPAIGN_FORM);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={resetAndClose}
      sponsorKrdTheme={sponsorKrdTheme}
      title="دروستکردنی کەمپەینی نوێ لە TikTok"
      description={STEP_DESCRIPTIONS[currentStep]}
      createBusinessStyle
      progress={
        <ModalWizardProgress
          currentStep={currentStep}
          steps={[...CAMPAIGN_WIZARD_STEPS]}
          variant="sponsor-krd"
        />
      }
      flushFooter
      footer={
        <ModalWizardActions
          variant="sponsor-krd"
          isFirstStep={isFirstStep}
          isFinalStep={isFinalStep}
          isSubmitting={isSubmitting}
          canContinue={canContinue}
          submitLabel="دروستکردنی کەمپەین"
          onBack={handleBack}
          onCancel={resetAndClose}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      }
    >
      <div
        dir="ltr"
        onKeyDown={(event) => {
          if (!shouldAdvanceModalWizardOnEnter(event)) return;
          event.preventDefault();
          event.stopPropagation();
          if (isFinalStep) handleSubmit();
          else handleNext();
        }}
      >
        {currentStep === "setup" ? (
          <div className="space-y-8">
            <CampaignIdentityStep
              campaignName={form.campaignName}
              objective={form.objective}
              onCampaignNameChange={(value) =>
                updateField("campaignName", value)
              }
              onObjectiveChange={handleObjectiveChange}
            />
            <CampaignOptimizationStep
              objective={form.objective}
              optimizationGoal={form.optimizationGoal}
              dataConnectionId={form.dataConnectionId}
              optimizationEvent={form.optimizationEvent}
              bidStrategy={form.bidStrategy}
              onOptimizationGoalChange={(value) =>
                updateField("optimizationGoal", value)
              }
              onDataConnectionIdChange={(value) =>
                updateField("dataConnectionId", value)
              }
              onOptimizationEventChange={(value) =>
                updateField("optimizationEvent", value)
              }
            />
          </div>
        ) : null}

        {currentStep === "delivery" ? (
          <div className="space-y-8">
            <CampaignBudgetScheduleStep
              dailyBudget={form.dailyBudget}
              scheduleType={form.scheduleType}
              startDate={form.startDate}
              endDate={form.endDate}
              onDailyBudgetChange={(value) => updateField("dailyBudget", value)}
              onScheduleTypeChange={(value) =>
                updateField("scheduleType", value)
              }
              onStartDateChange={(value) => updateField("startDate", value)}
              onEndDateChange={(value) => updateField("endDate", value)}
            />
            <CampaignAudiencePlacementStep
              location={form.location}
              gender={form.gender}
              ageGroups={form.ageGroups}
              languages={form.languages}
              placement={form.placement}
              onChange={updateField}
            />
          </div>
        ) : null}

        {currentStep === "creative" ? (
          <div className="space-y-8">
            <CampaignCreativeStep
              destinationUrl={form.destinationUrl}
              videoCode={form.videoCode}
              adText={form.adText}
              callToAction={form.callToAction}
              destinationError={destinationError}
              onDestinationUrlChange={(value) =>
                updateField("destinationUrl", value)
              }
              onVideoCodeChange={(value) => updateField("videoCode", value)}
              onAdTextChange={(value) => updateField("adText", value)}
              onCallToActionChange={(value) =>
                updateField("callToAction", value)
              }
            />
            <CampaignInteractiveAddOnsStep
              enabled={form.interactiveAddOnEnabled}
              mode={form.addOnMode}
              newAddOnType={form.newAddOnType}
              existingAddOnId={form.existingAddOnId}
              onEnabledChange={(value) =>
                updateField("interactiveAddOnEnabled", value)
              }
              onModeChange={(value) => updateField("addOnMode", value)}
              onNewAddOnTypeChange={(value) =>
                updateField("newAddOnType", value)
              }
              onExistingAddOnIdChange={(value) =>
                updateField("existingAddOnId", value)
              }
            />
          </div>
        ) : null}
      </div>
    </ManagementModal>
  );
}
