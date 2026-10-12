import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => vi.restoreAllMocks());
import { FormConditionalEditor } from "./FormConditionalEditor";
import { FormPreview } from "./FormPreview";
import { createForm, createQuestion } from "../forms-model";
import { formsCopy } from "../forms-copy";
import { parseConditionalCsv } from "../conditional-csv";

function Editor() {
  const [question, setQuestion] = useState(createQuestion("conditional"));
  return (
    <FormConditionalEditor
      question={question}
      language="en"
      requirement={<span>Required</span>}
      onChange={(patch) => setQuestion((current) => ({ ...current, ...patch }))}
    />
  );
}
describe("CSV conditional editor and preview", () => {
  it("imports/replaces files, reports errors and preserves the last valid matrix", async () => {
    render(<Editor />);
    expect(
      screen.getByRole("link", { name: "Download sample CSV file" }),
    ).toHaveAttribute("download");
    const input = screen.getByLabelText("Upload CSV file");
    fireEvent.change(input, {
      target: {
        files: [
          new File(["State,City\nCalifornia,San Diego"], "template.csv", {
            type: "text/csv",
          }),
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Questions: 2"),
    );
    expect(
      screen.getByRole("button", { name: "Replace CSV file" }),
    ).toBeEnabled();
    fireEvent.change(input, {
      target: { files: [new File(["State,City\nCalifornia"], "bad.csv")] },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Could not import"),
    );
    expect(screen.getByRole("status")).toHaveTextContent("State");
  });
  it.each(["form", "card"] as const)(
    "%s uses custom cascading answers and blocks incomplete required paths",
    (layout) => {
      const data = parseConditionalCsv(
        "State,City,Dealer\nCalifornia,San Diego,Dealer1\nCalifornia,LA,Dealer2\nNew York,New York,Dealer3",
      );
      render(
        <FormPreview
          form={{
            ...createForm("en"),
            layout,
            questions: [
              { ...createQuestion("conditional"), conditional: data },
            ],
          }}
        />,
      );
      if (layout === "card")
        fireEvent.click(screen.getByRole("button", { name: "Start" }));
      const state = screen.getByRole("combobox", { name: "State" });
      const city = screen.getByRole("combobox", { name: "City" });
      const dealer = screen.getByRole("combobox", { name: "Dealer" });
      const choose = (trigger: HTMLElement, answer: string) => {
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("option", { name: answer }));
      };
      expect(state.tagName).toBe("BUTTON");
      expect(document.querySelector("select")).toBeNull();
      expect(city).toBeDisabled();
      choose(state, "California");
      expect(city).toBeEnabled();
      expect(screen.getByRole("checkbox")).toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      expect(
        screen.queryByText(formsCopy("en").thankYou),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      choose(city, "San Diego");
      choose(dealer, "Dealer1");
      fireEvent.click(state);
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "California" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("option", { name: "New York" }));
      expect(city).toHaveTextContent("Select an answer");
      expect(dealer).toHaveTextContent("Select an answer");
      expect(dealer).toBeDisabled();
      fireEvent.click(city);
      expect(
        screen.queryByRole("option", { name: "San Diego" }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("option", { name: "New York" }));
      choose(dealer, "Dealer3");
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      expect(screen.getByText(formsCopy("en").thankYou)).toBeInTheDocument();
    },
  );
});

it("applies a finished CSV upload through the latest editor callback", async () => {
  const readers: FileReader[] = [];
  vi.spyOn(FileReader.prototype, "readAsText").mockImplementation(function (
    this: FileReader,
  ) {
    readers.push(this);
  });
  const initial = vi.fn(),
    latest = vi.fn();
  const question = createQuestion("conditional");
  const view = render(
    <FormConditionalEditor
      question={question}
      language="en"
      requirement={<span>Required</span>}
      onChange={initial}
    />,
  );
  const input = screen.getByLabelText("Upload CSV file");
  fireEvent.change(input, {
    target: {
      files: [
        new File(["State,City\nA,B"], "template.csv", { type: "text/csv" }),
      ],
    },
  });
  expect(input).toBeDisabled();
  view.rerender(
    <FormConditionalEditor
      question={question}
      language="en"
      requirement={<span>Required</span>}
      onChange={latest}
    />,
  );
  Object.defineProperty(readers[0], "result", { value: "State,City\nA,B" });
  readers[0].dispatchEvent(new ProgressEvent("load"));
  await waitFor(() =>
    expect(latest).toHaveBeenCalledWith(
      expect.objectContaining({
        conditional: { columns: ["State", "City"], rows: [["A", "B"]] },
      }),
    ),
  );
  expect(initial).not.toHaveBeenCalled();
});
