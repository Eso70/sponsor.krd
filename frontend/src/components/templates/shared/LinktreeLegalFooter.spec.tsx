import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinktreeLegalFooter } from "./LinktreeLegalFooter";
import { TemplateMediaContext } from "./TemplateMediaContext";
afterEach(() => vi.unstubAllEnvs());
describe("Linktree legal footer", () => {
  it.each(["en", "ar", "ckb"] as const)("keeps only English legal navigation on %s pages", (language) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd");
    render(<TemplateMediaContext.Provider value={{banner: {enabled: false, mode: "image", images: []}, seo: {version: 1, language}}}>
      <LinktreeLegalFooter color="#ffffff" />
    </TemplateMediaContext.Provider>);
    expect(screen.getByRole("contentinfo")).toHaveAttribute("lang", "en");
    expect(screen.getByRole("contentinfo")).toHaveAttribute("dir", "ltr");
    expect(screen.queryByText(/Published by|Business page/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", {name: "Privacy"})).toHaveAttribute("href", "https://sponsor.krd/legal/privacy?lang=en");
    expect(screen.getByRole("link", {name: "Terms"})).toHaveAttribute("href", "https://sponsor.krd/legal/terms?lang=en");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
  it("renders no attribution or fallback label", () => {
    render(<LinktreeLegalFooter color="#334155" />);
    expect(screen.queryByText("Business page")).not.toBeInTheDocument();
    expect(screen.queryByText(/Published by/)).not.toBeInTheDocument();
  });
});
