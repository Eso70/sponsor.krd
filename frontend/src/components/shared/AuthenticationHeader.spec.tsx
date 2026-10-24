import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AuthenticationShell } from "./AuthenticationShell";
import { AuthenticationLanguageToggle } from "./AuthenticationLanguageToggle";
import {
  HEADER_ACTION_BUTTON_CLASS,
  HEADER_ACTION_SIZE_CLASS,
} from "./shared-control-styles";

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of [
    "business_dashboard_locale",
    "platform_dashboard_locale",
    "sponsor_public_locale",
  ])
    document.cookie = `${key}=; Path=/; Max-Age=0`;
});
it("keeps all three matching controls available when the authentication shell has no custom language adapter", () => {
  render(
    <AuthenticationShell brandDescription="Secure access" language="en">
      <p>Loading</p>
    </AuthenticationShell>,
  );
  for (const control of [
    screen.getByRole("link", { name: "Back" }),
    screen.getByRole("button", { name: "Change theme" }),
    screen.getByRole("button", { name: "Switch to Kurdish" }),
  ]) {
    for (const className of `${HEADER_ACTION_BUTTON_CLASS} ${HEADER_ACTION_SIZE_CLASS}`.split(
      " ",
    ))
      expect(control).toHaveClass(className);
  }
});
it.each([
  ["public", "sponsor_public_locale"],
  ["business", "business_dashboard_locale"],
  ["platform", "platform_dashboard_locale"],
] as const)(
  "persists only the %s preference from a server-localized authentication screen",
  (preference, cookie) => {
    render(
      <AuthenticationLanguageToggle locale="en" preference={preference} />,
    );
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { href: "https://example.com/join", reload },
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch to Kurdish" }));
    expect(document.cookie).toContain(`${cookie}=ckb`);
    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  },
);
it("retains the shared report address while changing an unavailable page's language", () => {
  render(<AuthenticationLanguageToggle locale="ar" preference="business" />);
  const assign = vi.fn();
  vi.stubGlobal("window", {
    location: {
      href: "https://tenant.example.com/analytics-share/report?lang=ar",
      assign,
    },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }),
  );
  expect(assign).toHaveBeenCalledWith(
    "https://tenant.example.com/analytics-share/report?lang=en",
  );
  vi.unstubAllGlobals();
});
