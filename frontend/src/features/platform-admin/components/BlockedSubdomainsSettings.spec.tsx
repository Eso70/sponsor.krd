import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "../i18n/PlatformLocaleProvider";
import { BlockedSubdomainsSettings } from "./BlockedSubdomainsSettings";
import { ApiRequestError } from "@/lib/api/request";

const { load, add, remove } = vi.hoisted(() => ({
  load: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/features/subdomains/api", () => ({
  getBlockedSubdomains: load,
  blockSubdomain: add,
  unblockSubdomain: remove,
}));
function mount(locale: "en" | "ar" | "ckb" = "en") {
  render(
    <PlatformLocaleProvider initialLocale={locale}>
      <BlockedSubdomainsSettings />
    </PlatformLocaleProvider>,
  );
}
async function openAdd() {
  await screen.findAllByText("support");
  fireEvent.click(screen.getByRole("button", { name: "Add subdomain" }));
  return within(screen.getByRole("dialog"));
}
describe("blocked subdomain settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    load.mockResolvedValue({ system: ["www", "api"], custom: ["support"] });
    add.mockResolvedValue({
      system: ["www", "api"],
      custom: ["support", "help"],
    });
    remove.mockResolvedValue({ system: ["www", "api"], custom: [] });
  });
  it("uses the management table and protects permanent names in both layouts", async () => {
    mount();
    await screen.findAllByText("support");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    for (const button of screen.getAllByRole("button", {
      name: "Delete: www",
    })) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(remove).not.toHaveBeenCalled();
    for (const button of screen.getAllByRole("button", {
      name: "Delete: support",
    }))
      expect(button).toBeEnabled();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Delete: support" })[0],
    );
    await waitFor(() => expect(remove).toHaveBeenCalledWith("support"));
    await waitFor(() =>
      expect(screen.queryByText("support")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("www").length).toBeGreaterThan(0);
  });
  it("adds a normalized name through the modal and closes after success", async () => {
    mount();
    const modal = await openAdd();
    fireEvent.change(modal.getByRole("textbox", { name: "Subdomain" }), {
      target: { value: " HELP " },
    });
    fireEvent.click(modal.getByRole("button", { name: "Block subdomain" }));
    await screen.findAllByText("help");
    expect(add).toHaveBeenCalledWith("help");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("preserves the name and shows an error when adding fails", async () => {
    add.mockRejectedValueOnce(
      new ApiRequestError("Conflict", { status: 409, code: "CONFLICT" }),
    );
    mount();
    const modal = await openAdd();
    fireEvent.change(modal.getByRole("textbox", { name: "Subdomain" }), {
      target: { value: "help" },
    });
    fireEvent.click(modal.getByRole("button", { name: "Block subdomain" }));
    expect(await modal.findByRole("alert")).toHaveTextContent(
      "already blocked",
    );
    expect(modal.getByRole("textbox")).toHaveValue("help");
  });
  it("cancels without adding and clears the field when reopened", async () => {
    mount();
    const modal = await openAdd();
    fireEvent.change(modal.getByRole("textbox"), { target: { value: "help" } });
    fireEvent.click(modal.getByRole("button", { name: "Cancel" }));
    expect(add).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add subdomain" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("prevents closing or duplicate submissions while saving", async () => {
    let finish!: (value: { system: string[]; custom: string[] }) => void;
    add.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    mount();
    const modal = await openAdd();
    fireEvent.change(modal.getByRole("textbox"), { target: { value: "help" } });
    fireEvent.click(modal.getByRole("button", { name: "Block subdomain" }));
    expect(modal.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(modal.getByRole("button", { name: "Saving…" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(add).toHaveBeenCalledTimes(1);
    finish({ system: ["www", "api"], custom: ["support", "help"] });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("keeps the manual name visible when deletion fails", async () => {
    remove.mockRejectedValueOnce(new Error("offline"));
    mount();
    await screen.findAllByText("support");
    fireEvent.click(
      screen.getAllByRole("button", { name: "Delete: support" })[0],
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to update",
    );
    expect(
      screen.getAllByRole("button", { name: "Delete: support" })[0],
    ).toBeEnabled();
  });
  it("shows a load failure and allows retry", async () => {
    load.mockRejectedValueOnce(new Error("offline"));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load",
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findAllByText("support");
  });
  it("disables Add while refreshing", async () => {
    mount();
    await screen.findAllByText("support");
    let finish!: (value: { system: string[]; custom: string[] }) => void;
    load.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(
      screen.getByRole("button", { name: "Add subdomain" }),
    ).toBeDisabled();
    finish({ system: ["www", "api"], custom: [] });
    await waitFor(() =>
      expect(screen.queryByText("support")).not.toBeInTheDocument(),
    );
  });
  it.each(["ckb", "ar"] as const)(
    "uses the platform language (%s)",
    async (locale) => {
      mount(locale);
      await screen.findAllByText("support");
      expect(
        screen.queryByText("System-reserved names"),
      ).not.toBeInTheDocument();
    },
  );
});
