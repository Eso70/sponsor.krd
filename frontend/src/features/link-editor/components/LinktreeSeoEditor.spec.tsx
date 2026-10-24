import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import { LinktreeSeoEditor } from "./LinktreeSeoEditor";

function Draft({ headline }: { headline: string }) {
  const [seo, setSeo] = useState<LinktreeSeo>({ version: 1 });
  return <><LinktreeSeoEditor seo={seo} onChange={setSeo} locale="en" errors={{}} headline={headline} slogan="Real services" description="Authored description" requestCrop={vi.fn()} /><output data-testid="seo-value">{JSON.stringify(seo)}</output></>;
}
describe("automatic SEO values from Information", () => {
  it("follows Information until customized and restores automatic values on request", () => {
    const { rerender } = render(<Draft headline="First headline" />);
    expect(screen.getByRole("textbox", { name: "SEO title" })).toHaveValue("First headline");
    expect(screen.getByRole("textbox", { name: "SEO description" })).toHaveValue("Real services — Authored description");
    expect(screen.getByTestId("seo-value")).toHaveTextContent('{"version":1}');
    rerender(<Draft headline="Updated headline" />);
    expect(screen.getByRole("textbox", { name: "SEO title" })).toHaveValue("Updated headline");
    fireEvent.change(screen.getByRole("textbox", { name: "SEO title" }), { target: { value: "Custom search title" } });
    rerender(<Draft headline="Another headline" />);
    expect(screen.getByRole("textbox", { name: "SEO title" })).toHaveValue("Custom search title");
    fireEvent.click(screen.getByRole("button", { name: "Use Information" }));
    expect(screen.getByRole("textbox", { name: "SEO title" })).toHaveValue("Another headline");
    expect(screen.getByTestId("seo-value")).toHaveTextContent('{"version":1}');
  });
});
