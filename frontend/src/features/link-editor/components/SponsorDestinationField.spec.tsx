import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SponsorDestinationField } from "./SponsorDestinationField";
import { inspectLinktreeSponsor } from "@linktree/types";

function Harness() {
  const [url, setUrl] = useState<string | null>("/");
  return <><SponsorDestinationField url={url} onChange={setUrl} locale="en" error={false} /><output data-testid="url">{url ?? "none"}</output></>;
}
function choose(label: string) {
  fireEvent.click(screen.getByRole("button", { name: "Destination" }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}
describe("sponsor destination choices", () => {
  it("switches between no link, homepage and website", () => {
    render(<Harness />);
    choose("No link");
    expect(screen.getByTestId("url")).toHaveTextContent("none");
    choose("Website");
    fireEvent.change(screen.getByRole("textbox", { name: "Website" }), { target: { value: "https://example.com" } });
    expect(screen.getByTestId("url")).toHaveTextContent("https://example.com");
    choose("Homepage");
    expect(screen.getByTestId("url")).toHaveTextContent("/");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it.each([["WhatsApp", "https://wa.me/9647501234567"], ["Phone call", "tel:+9647501234567"]])("builds a validated %s destination", (option, expected) => {
    render(<Harness />);
    choose(option);
    const incomplete = screen.getByTestId("url").textContent;
    expect(inspectLinktreeSponsor({ enabled: true, style: "text", name: "Acme", url: incomplete }).errors).toHaveProperty("url");
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number" }), { target: { value: "7501234567" } });
    expect(screen.getByTestId("url")).toHaveTextContent(expected);
    expect(inspectLinktreeSponsor({ enabled: true, style: "text", name: "Acme", url: expected }).errors).toEqual({});
  });
});
