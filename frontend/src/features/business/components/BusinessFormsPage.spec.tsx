import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessFormsPage } from "./BusinessFormsPage";
import { BusinessLocaleProvider } from "../i18n/BusinessLocaleProvider";
import { formsCopy } from "@/features/forms/forms-copy";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/api/request", () => ({ apiRequest }));

beforeEach(() => {
  vi.clearAllMocks();
  apiRequest.mockImplementation(async (path: string) =>
    path.endsWith("/stats")
      ? { views: 0, visitors: 0, starts: 0, submissions: 0 }
      : path.startsWith("/api/forms?")
        ? { items: [], total: 0 }
        : { locale: "ckb" },
  );
});
describe("Business Forms integration", () => {
  it.each([
    ["ckb", "فۆڕمەکان", "فۆڕمی نوێ"],
    ["ar", "النماذج", "إنشاء نموذج"],
    ["en", "Forms", "Create form"],
  ] as const)("renders the shared workspace in %s", (locale, title, create) => {
    render(
      <BusinessLocaleProvider initialLocale={locale}>
        <BusinessFormsPage
          accentColor="#2563eb"
          theme="light"
          mounted
          onToggleTheme={vi.fn()}
        />
      </BusinessLocaleProvider>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: create })).toBeInTheDocument();
  });
  it("reuses dashboard theme and language controls inside the drawer without resetting the draft", async () => {
    const toggle = vi.fn();
    render(
      <BusinessLocaleProvider initialLocale="en">
        <BusinessFormsPage theme="light" mounted onToggleTheme={toggle} />
      </BusinessLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create form" }));
    const chooser = within(
      screen.getByRole("dialog", { name: "Choose form layout" }),
    );
    const header = screen.getByRole("dialog").querySelector("header")!;
    expect(
      within(header)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Switch to Kurdish", "Change appearance", "Close"]);
    fireEvent.click(chooser.getByRole("button", { name: "Change appearance" }));
    expect(toggle).toHaveBeenCalledOnce();
    fireEvent.click(chooser.getByRole("radio", { name: "Card layout" }));
    fireEvent.click(chooser.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to Kurdish" }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: "ckb" },
      }),
    );
    expect(
      screen.getByRole("dialog", { name: formsCopy("ckb").editor }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: formsCopy("ckb").back }),
    );
    expect(
      screen.getByRole("radio", { name: formsCopy("ckb").cardLayoutName }),
    ).toBeChecked();
  });
});
