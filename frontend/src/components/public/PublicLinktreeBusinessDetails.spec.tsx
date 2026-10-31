import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PublicLinktreeBusinessSummary } from "./PublicLinktreeBusinessSummary";
import { PublicLinktreeBusinessDetails } from "./PublicLinktreeBusinessDetails";

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
    expect(screen.getByText("09:00–17:00")).toHaveAttribute("dir", "ltr");
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
  expect(screen.getByText("شەممە, یەکشەممە, دووشەممە, سێشەممە, چوارشەممە, پێنجشەممە")).toBeVisible();
  expect(seo.business.hours.days).toEqual(days);
});
