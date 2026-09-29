import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { RootPublicLanguageToggle, RootPublicLinktreeLanguageToggle, RootPublicLocaleProvider, useRootPublicLocale } from "./RootPublicLocaleProvider";
import { ROOT_PUBLIC_LOCALE_COOKIE } from "./root-public-locale";

function LocaleProbe() {
  const { locale } = useRootPublicLocale();
  return <span>{locale}</span>;
}

describe("root visitor language", () => {
  it("cycles a public Linktree from English back to Kurdish", () => {
    const onChange = vi.fn();
    render(<RootPublicLinktreeLanguageToggle locale="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to Kurdish" }));
    expect(onChange).toHaveBeenCalledWith("ckb");
    expect(document.cookie).toContain(`${ROOT_PUBLIC_LOCALE_COOKIE}=ckb`);
  });
  it("switches to Arabic and saves only the root visitor cookie", () => {
    render(<RootPublicLocaleProvider initialLocale="ckb"><RootPublicLanguageToggle /><LocaleProbe /></RootPublicLocaleProvider>);
    fireEvent.click(screen.getByRole("button", { name: "گۆڕینی زمان بۆ عەرەبی" }));
    expect(screen.getByText("ar")).toBeInTheDocument();
    expect(document.cookie).toContain(`${ROOT_PUBLIC_LOCALE_COOKIE}=ar`);
    expect(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" })).toHaveTextContent("EN");
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }));
    expect(screen.getByText("en")).toBeInTheDocument();
    expect(document.cookie).toContain(`${ROOT_PUBLIC_LOCALE_COOKIE}=en`);
    expect(screen.getByRole("button", { name: "Switch to Kurdish" })).toHaveTextContent("KU");
  });
});
