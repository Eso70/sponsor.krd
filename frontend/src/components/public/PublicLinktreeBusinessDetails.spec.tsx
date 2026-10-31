import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PublicLinktreeBusinessSummary } from "./PublicLinktreeBusinessSummary";
import { PublicLinktreeBusinessDetails } from "./PublicLinktreeBusinessDetails";
import { linktreeSeoCopy } from "@/features/link-editor/linktree-seo-copy";

describe("visible business details", () => {
  it.each(["en", "ckb", "ar"] as const)("renders supplied details in %s without default claims", (locale) => {
    const { container, rerender } = render(<PublicLinktreeBusinessDetails locale={locale} color="#222" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PublicLinktreeBusinessDetails locale={locale} color="#222" seo={{ version: 1, category: "food", businessType: "restaurant", business: { city: "Erbil", cuisine: "Authored cuisine", hours: { days: ["Mo"], opens: "09:00", closes: "17:00" } } }} />);
    expect(screen.queryByText("Erbil")).not.toBeInTheDocument();
    const disclosure = container.querySelector("details")!;
    fireEvent.click(disclosure.querySelector("summary")!);
    expect(disclosure).toHaveAttribute("open");

    expect(screen.getByText(/Authored cuisine/)).toBeVisible();
    const copy = linktreeSeoCopy(locale);
    expect(screen.getByText("09:00 AM")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("05:00 PM")).toHaveAttribute("dateTime", "17:00");
    expect(screen.getByText(copy.opens).parentElement).toHaveTextContent("09:00 AM");
    expect(screen.getByText(copy.closes).parentElement).toHaveTextContent("05:00 PM");
    expect(disclosure).toHaveAttribute("dir", locale === "en" ? "ltr" : "rtl");
    expect(container.querySelector('[hidden]')).toBeNull();
  });
});

it("keeps location and category visible without creating an empty disclosure", () => {
  const seo = {version: 1 as const, category: "food" as const, businessType: "restaurant", business: {city: "Erbil", country: "Iraq"}};
  const {container} = render(<><PublicLinktreeBusinessSummary seo={seo} locale="en" color="#222" /><PublicLinktreeBusinessDetails seo={seo} locale="en" color="#222" /></>);
  expect(screen.getByText("Iraq, Erbil")).toBeVisible();
  expect(container.querySelector('[data-business-summary]')).toHaveTextContent(/Restaurant/i);
  expect(container.querySelector('details')).toBeNull();
});

it("orders saved weekdays from Saturday and the location from country to street", () => {
  const days = ["Th", "We", "Tu", "Mo", "Su", "Sa"] as const;
  const seo = { version: 1 as const, business: { country: "عێراق", city: "هەولێر", street: "گوندی سەلام", hours: { days: [...days], opens: "09:00", closes: "17:00" } } };
  const { container } = render(<><PublicLinktreeBusinessSummary seo={seo} locale="ckb" color="#222" /><PublicLinktreeBusinessDetails seo={seo} locale="ckb" color="#222" /></>);
  expect(screen.getByText("عێراق, هەولێر, گوندی سەلام")).toBeVisible();
  fireEvent.click(container.querySelector("summary")!);
  expect(screen.getAllByRole("listitem").map(day => day.textContent)).toEqual([
    "شەممە", "یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە",
  ]);
  expect(screen.queryByText("هەینی")).not.toBeInTheDocument();
  expect(seo.business.hours.days).toEqual(days);
});

it.each([
  ["00:00", "12:00", "12:00 AM", "12:00 PM"],
  ["23:05", "01:15", "11:05 PM", "01:15 AM"],
])("displays midnight, noon and overnight hours without changing their values (%s–%s)", (opens, closes, openDisplay, closeDisplay) => {
  const { container } = render(<PublicLinktreeBusinessDetails locale="en" color="#222" seo={{ version: 1, business: { hours: { days: ["Fr"], opens, closes } } }} />);
  fireEvent.click(container.querySelector("summary")!);
  expect(screen.getByText(openDisplay)).toHaveAttribute("dateTime", opens);
  expect(screen.getByText(closeDisplay)).toHaveAttribute("dateTime", closes);
});
