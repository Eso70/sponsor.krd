import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardRefreshTestShell } from "@/test-utils/DashboardRefreshTestShell";
import { useRegisterDashboardRefresh } from "./dashboard-refresh";

function Page({ load }: { load: () => Promise<void> }) {
  const pending = useRegisterDashboardRefresh("page", load);
  return <p>{pending ? "Page pending" : "Page ready"}</p>;
}

describe("page refresh pending contract", () => {
  it("keeps the page pending until shared and page data settle, including a page failure", async () => {
    let resolveShared!: () => void;
    let rejectPage!: (error: Error) => void;
    const shared = () => new Promise<void>((resolve) => { resolveShared = resolve; });
    const page = () => new Promise<void>((_resolve, reject) => { rejectPage = reject; });
    render(<DashboardRefreshTestShell onSharedRefresh={shared}><Page load={page} /></DashboardRefreshTestShell>);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.getByText("Page pending")).toBeInTheDocument());
    await act(async () => { rejectPage(new Error("Unavailable")); });
    expect(screen.getByText("Page pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
    await act(async () => { resolveShared(); });
    expect(screen.getByText("Page ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });
});
