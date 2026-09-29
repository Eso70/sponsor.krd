import { render, screen } from "@testing-library/react";
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
  it("shows English application defaults without translating business names", () => {
    render(
      <PublicLinktreeLocaleProvider locale="en">
        <TemplateHeader name="Owner's business" description={publicLinktreeCopy.ckb.description} />
        <TemplateActionButtonList isEmpty>Unused</TemplateActionButtonList>
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByText("Owner's business")).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.en.description)).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.en.empty)).toBeInTheDocument();
  });
  it("shows Arabic application defaults without translating business names", () => {
    render(
      <PublicLinktreeLocaleProvider locale="ar">
        <TemplateHeader name="Owner's business" description={publicLinktreeCopy.ckb.description} />
        <TemplateActionButtonList isEmpty>Unused</TemplateActionButtonList>
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByText("Owner's business")).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ar.description)).toBeInTheDocument();
    expect(screen.getByText(publicLinktreeCopy.ar.empty)).toBeInTheDocument();
  });

  it("localizes saved default WhatsApp prompts while preserving custom prompts", () => {
    render(
      <PublicLinktreeLocaleProvider locale="ar">
        <WhatsAppQuestionModal
          isOpen
          onClose={vi.fn()}
          onSelectQuestion={vi.fn()}
          whatsappUrl="https://wa.me/9647501234567"
          title={publicLinktreeCopy.ckb.modalTitle}
          questions={[...publicLinktreeCopy.ckb.questions, { id: "custom", text: "My custom question", message: "My custom message" }]}
        />
      </PublicLinktreeLocaleProvider>,
    );
    expect(screen.getByRole("heading", { name: publicLinktreeCopy.ar.modalTitle })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تقديم طلب/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My custom question/ })).toBeInTheDocument();
  });
});
