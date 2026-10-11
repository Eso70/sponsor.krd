import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemplateHeader } from "@/components/templates/shared/TemplateHeader";
import { TemplateActionButtonList } from "@/components/templates/shared/TemplateActionButton";
import { PublicLinktreeLocaleProvider } from "./public-linktree";
import { publicLinktreeCopy } from "./public-linktree-copy";
import { WhatsAppQuestionModal } from "@/components/public/WhatsAppQuestionModal";

describe("published business Linktree fallbacks", () => {
  it("keeps application copy complete in all visitor languages", () => {
    const keys = Object.keys(publicLinktreeCopy.ckb).sort();
    expect(Object.keys(publicLinktreeCopy.ar).sort()).toEqual(keys);
    expect(Object.keys(publicLinktreeCopy.en).sort()).toEqual(keys);
  });
  it("preserves saved Kurdish descriptions in an English interface", () => {
    render(
      <PublicLinktreeLocaleProvider locale="en">
        <TemplateHeader name="Owner's business" description={publicLinktreeCopy.ckb.description} />
        <TemplateActionButtonList isEmpty>Unused</TemplateActionButtonList>
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByText("Owner's business")).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ckb.description)).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.en.empty)).toBeInTheDocument();
  });
  it("preserves saved Kurdish descriptions in an Arabic interface", () => {
    render(
      <PublicLinktreeLocaleProvider locale="ar">
        <TemplateHeader name="Owner's business" description={publicLinktreeCopy.ckb.description} />
        <TemplateActionButtonList isEmpty>Unused</TemplateActionButtonList>
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByText("Owner's business")).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ckb.description)).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ar.empty)).toBeInTheDocument();
  });

  it.each(["ar", "en"] as const)("preserves saved Kurdish WhatsApp prompts and messages in %s", (locale) => {
    const onSelectQuestion = vi.fn();
    render(
      <PublicLinktreeLocaleProvider locale={locale}>
        <WhatsAppQuestionModal
          isOpen
          onClose={vi.fn()}
          onSelectQuestion={onSelectQuestion}
          whatsappUrl="https://wa.me/9647501234567"
          title={publicLinktreeCopy.ckb.modalTitle}
          subtitle={publicLinktreeCopy.ckb.modalSubtitle}
          questions={[...publicLinktreeCopy.ckb.questions, { id: "custom", text: "My custom question", message: "My custom message" }]}
        />
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByRole("heading", { name: publicLinktreeCopy.ckb.modalTitle })).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ckb.modalSubtitle)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(publicLinktreeCopy.ckb.questions[0].text) }));
    expect(onSelectQuestion).toHaveBeenCalledWith(publicLinktreeCopy.ckb.questions[0].message);
    expect(screen.getByRole("button", { name: /My custom question/ })).toBeInTheDocument();
  });
  it("uses localized defaults only for missing content and respects an empty question list", () => {
    render(<PublicLinktreeLocaleProvider locale="en">
      <TemplateHeader name="Business" />
      <WhatsAppQuestionModal isOpen onClose={vi.fn()} onSelectQuestion={vi.fn()}
        whatsappUrl="https://wa.me/9647501234567" questions={[]} />
    </PublicLinktreeLocaleProvider>);
    expect(screen.getByText(publicLinktreeCopy.en.description)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: publicLinktreeCopy.en.modalTitle })).toBeInTheDocument();
    expect(screen.queryByText(publicLinktreeCopy.en.questions[0].text)).not.toBeInTheDocument();
  });
});
