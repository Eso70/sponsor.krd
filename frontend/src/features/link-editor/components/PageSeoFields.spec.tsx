import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PageSeoFields } from "./PageSeoFields";
import { englishEditorCopy } from "../english-editor-copy";

describe("shared business/platform SEO controls", () => {
  it("uses the same persisted config and supports explicit campaign noindex", () => {
    const change = vi.fn();
    render(<PageSeoFields config={{ seo: { title: "Saved title" } }} onChange={change}
      name="Actual name" subtitle="Actual subtitle" description="Actual description" slug="actual-page" copy={englishEditorCopy} />);
    expect(screen.getByLabelText("Search title")).toHaveValue("Saved title");
    fireEvent.change(screen.getByLabelText("Search visibility"), { target: { value: "false" } });
    expect(change).toHaveBeenCalledWith({ title: "Saved title", robotsIndex: false });
    expect(screen.getByText("/linktree/actual-page")).toBeInTheDocument();
  });
});
