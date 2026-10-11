import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageToggle, nextLanguageLocale } from "./LanguageToggle";

describe("shared language control", () => {
  it.each([
    ["en", "EN", "ckb"],
    ["ar", "AR", "en"],
    ["ckb", "KU", "ar"],
  ] as const)(
    "shows the current %s code and exposes its localized action",
    (locale, code, next) => {
      const onClick = vi.fn();
      render(
        <LanguageToggle
          locale={locale}
          label="Change language"
          onClick={onClick}
        />,
      );
      const button = screen.getByRole("button", { name: "Change language" });
      expect(button).toHaveTextContent(code);
      expect(button.querySelector("img")).toBeNull();
      expect(button.querySelector("span")).toHaveAttribute("dir", "ltr");
      expect(nextLanguageLocale(locale)).toBe(next);
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledOnce();
    },
  );
  it("prevents repeated saves while busy", () => {
    const onClick = vi.fn();
    render(
      <LanguageToggle
        locale="en"
        label="Change language"
        onClick={onClick}
        busy
        size="compact"
      />,
    );
    const button = screen.getByRole("button", { name: "Change language" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
