import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { AccessControlPage } from "./AccessControlPage";

const overview = {
  summary: { permissions: 1, profiles: 0 },
  profiles: [],
  permissions: [{
    id: "permission-1", key: "business:dashboard:view", category: "Business navigation",
    resource: "dashboard", action: "view", description: "View dashboard",
    riskLevel: "standard", supportsApproval: false, fieldSchema: {}, profiles: [],
  }],
};

describe("AccessControlPage Arabic", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("localizes the directory, permission table, and permission detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: overview }), { status: 200 })));
    render(<PlatformLocaleProvider initialLocale="ar"><AccessControlPage /></PlatformLocaleProvider>);

    expect(await screen.findByText("صلاحيات النشاط التجاري")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "الصلاحيات" }));
    expect(screen.getByRole("columnheader", { name: "مفتاح الصلاحية" })).toBeInTheDocument();
    expect(screen.getByText("التنقل في النشاط التجاري")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "عرض" }));
    expect(screen.getAllByText("التنقل في النشاط التجاري")).toHaveLength(2);
    expect(screen.queryByText("Business navigation")).not.toBeInTheDocument();
    expect(screen.getByText("فتح لوحة تحكم النشاط التجاري وعرضها")).toBeInTheDocument();
    expect(screen.queryByText("View dashboard")).not.toBeInTheDocument();
  });

  it("localizes the permission catalogue and details in English", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: overview }), { status: 200 })));
    render(<PlatformLocaleProvider initialLocale="en"><AccessControlPage /></PlatformLocaleProvider>);
    expect(await screen.findByText("Business permissions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Permissions" }));
    expect(screen.getByRole("columnheader", { name: "Permission key" })).toBeInTheDocument();
    expect(screen.getByText("Business navigation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getAllByText("Business navigation")).toHaveLength(2);
    expect(screen.getByText("Open and view the business dashboard")).toBeInTheDocument();
  });
});
