import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { PublicPageDirectory } from "@linktree/types";
import { PublicDirectory } from "./PublicDirectory";
import { directoryCopy } from "../directory-copy";
import { directoryCampaignQuery } from "../directory-navigation";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/business/BusinessPublicSiteShell", () => ({ BusinessPublicSiteShell: ({ children, languageControl, businessName }: { children: ReactNode; languageControl: ReactNode; businessName: string }) => <main aria-label={businessName}>{languageControl}{children}</main> }));

const base: PublicPageDirectory = { kind: "linktree", brand: { name: "Example business", logo: null, accentColor: "#8b5cf6", brandingRemoved: false }, items: [{ slug: "contact", title: "Public title", description: "Public description" }], page: 1, total: 25, totalPages: 2 };

beforeEach(() => push.mockClear());

describe.each([false, true])("shared public directory (platform=%s)", (isPlatformRoot) => {
  it.each(["linktree", "form"] as const)("opens %s pages in the same context and keeps campaign parameters", (kind) => {
    render(<PublicDirectory data={{ ...base, kind }} initialLocale="en" isPlatformRoot={isPlatformRoot} campaignQuery="utm_source=tiktok&ttclid=click" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(directoryCopy.en[kind]);
    expect(screen.queryByText(base.brand.name)).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Public title/ });
    expect(link).toHaveAttribute("href", `/${kind}/contact?utm_source=tiktok&ttclid=click`);
    expect(link).not.toHaveAttribute("target");
    expect(screen.queryByRole("button", { name: /Edit|Delete|Analytics/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(push).toHaveBeenCalledWith(`/${kind}?utm_source=tiktok&ttclid=click&page=2`);
  });
  it.each(["linktree", "form"] as const)("shows only the %s card grid with public details", (kind) => {
    render(<PublicDirectory data={{ ...base, kind, items: [{ ...base.items[0], contentCount: 3, isDefault: kind === "linktree", platforms: kind === "linktree" ? ["whatsapp"] : undefined, language: kind === "form" ? "ckb" : undefined, requiredQuestionCount: kind === "form" ? 2 : undefined }] }} initialLocale="en" isPlatformRoot={isPlatformRoot} origin="https://tenant.example" campaignQuery="utm_source=tiktok" />);
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
    expect(screen.queryByText(directoryCopy.en[kind === "form" ? "formDescription" : "linktreeDescription"])).not.toBeInTheDocument();
    expect(screen.getByText(`3 ${kind === "form" ? "questions" : "links"}`)).toBeInTheDocument();
    expect(screen.getByText(kind === "form" ? "2 required questions" : "WhatsApp")).toBeInTheDocument();
    if (kind === "form") expect(screen.getByText("کوردی")).toHaveAttribute("lang", "ckb");
    const url = screen.getByRole("link", { name: `/${kind}/contact` });
    expect(url).toHaveAttribute("href", `https://tenant.example/${kind}/contact?utm_source=tiktok`);
    expect(url).not.toHaveAttribute("target");
  });
  it.each(["en", "ar", "ckb"] as const)("shows a useful empty state in %s", (locale) => {
    render(<PublicDirectory data={{ ...base, items: [], total: 0, totalPages: 1 }} initialLocale={locale} isPlatformRoot={isPlatformRoot} campaignQuery="" />);
    expect(screen.getByText(directoryCopy[locale].empty)).toBeInTheDocument();
    expect(screen.getByText(directoryCopy[locale].emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: directoryCopy[locale].next })).not.toBeInTheDocument();
  });
});

it("carries only bounded campaign data, without tenant identifiers or redirect parameters", () => {
  expect(directoryCampaignQuery({ utm_source: "tiktok", ttclid: "a&b", page: "2", tenant: "other", redirect: "https://bad.example", utm_medium: ["a", "b"], utm_campaign: "a".repeat(513) })).toBe("ttclid=a%26b&utm_source=tiktok");
});
