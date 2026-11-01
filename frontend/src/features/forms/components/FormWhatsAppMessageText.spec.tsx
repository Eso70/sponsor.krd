import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FormWhatsAppMessageText } from "./FormWhatsAppMessageText";
import { whatsAppTextTable } from "../form-whatsapp-text-table";

it("fits mixed-language values into separate wrapping columns without interpreting HTML", () => {
  const name = "<img src=x> گوڵ Rose زهرة";
  render(<FormWhatsAppMessageText text={whatsAppTextTable(
    ["Product", "Qty", "Price", "Total"],
    [[name, "2", "1,500 IQD", "3,000 IQD"]],
  )} />);
  const cell = screen.getByRole("cell", { name });
  expect(cell).toHaveAttribute("dir", "auto");
  expect(cell).toHaveClass("[overflow-wrap:anywhere]");
  expect(cell.querySelector("bdi")).toHaveTextContent(name);
  expect(cell.querySelector("img")).toBeNull();
});

it("keeps user-authored code as literal text", () => {
  const { container } = render(<FormWhatsAppMessageText text={"Before\n```<b>plain text</b>```\nAfter"} />);
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(container.querySelector("pre code")).toHaveTextContent("<b>plain text</b>");
  expect(container.querySelector("b")).toBeNull();
});
