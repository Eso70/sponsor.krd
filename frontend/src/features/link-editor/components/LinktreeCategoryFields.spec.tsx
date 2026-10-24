import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { LinktreeSeo } from "@linktree/types/linktree-seo.cjs";
import { LinktreeCategoryFields } from "./LinktreeCategoryFields";
import { linktreeSeoCopy } from "../linktree-seo-copy";

describe("new page category selection", () => {
  it.each(["en", "ckb", "ar"] as const)("starts optional and edits stable IDs with %s labels", (locale) => {
    const copy = linktreeSeoCopy(locale);
    function Draft() {
      const [seo, setSeo] = useState<LinktreeSeo>({ version: 1 });
      return <><LinktreeCategoryFields seo={seo} onChange={setSeo} locale={locale} /><output data-testid="draft">{JSON.stringify(seo)}</output></>;
    }
    render(<Draft />);
    expect(screen.getByRole("button", { name: copy.category })).toHaveTextContent(copy.none);
    expect(screen.queryByRole("button", { name: copy.type })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.category }));
    fireEvent.click(screen.getByRole("option", { name: { en: "Food & restaurants", ckb: "خواردن و چێشتخانە", ar: "الطعام والمطاعم" }[locale] }));
    fireEvent.click(screen.getByRole("button", { name: copy.type }));
    fireEvent.click(screen.getByRole("option", { name: { en: "Restaurant", ckb: "چێشتخانە", ar: "مطعم" }[locale] }));
    expect(screen.getByTestId("draft")).toHaveTextContent('"businessType":"restaurant"');
    fireEvent.click(screen.getByRole("button", { name: copy.category }));
    fireEvent.click(screen.getByRole("option", { name: copy.none }));
    expect(screen.getByTestId("draft")).toHaveTextContent('{"version":1}');
  });
});
