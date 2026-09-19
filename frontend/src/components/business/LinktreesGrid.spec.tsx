import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinktreePill } from "@/components/business/LinktreeMeta";
import { LinktreesGrid } from "@/components/business/LinktreesGrid";
import type {
  CampaignRevenueInput,
  CampaignRevenueRecord,
  LinktreeListItem,
} from "@linktree/types";

const campaignApi = vi.hoisted(() => ({
  getCampaignRevenueRecords: vi.fn(),
  createCampaignRevenueRecord: vi.fn(),
  updateCampaignRevenueRecord: vi.fn(),
  deleteCampaignRevenueRecord: vi.fn(),
}));

vi.mock("@/features/campaigns/api", () => campaignApi);

let storedRevenueRecords: CampaignRevenueRecord[] = [];

function persistedRecord(
  input: CampaignRevenueInput,
  id = `record-${storedRevenueRecords.length + 1}`,
): CampaignRevenueRecord {
  const campaignSpendIqd = Math.round(
    input.campaignSpendUsd * input.usdToIqdRate,
  );
  return {
    id,
    linktreeId: item.id,
    ...input,
    durationDays: 8,
    campaignSpendIqd,
    netRevenueIqd: input.advertisementPriceIqd - campaignSpendIqd,
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
  };
}

const item: LinktreeListItem = {
  id: "page-1",
  uid: "page-one",
  name: "Page one",
  subtitle: "Headline",
  description: "Description",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-02T00:00:00.000Z",
  analytics: { unique_views: 18, unique_clicks: 4 },
};

beforeEach(() => {
  storedRevenueRecords = [];
  campaignApi.getCampaignRevenueRecords.mockReset();
  campaignApi.createCampaignRevenueRecord.mockReset();
  campaignApi.updateCampaignRevenueRecord.mockReset();
  campaignApi.deleteCampaignRevenueRecord.mockReset();
  campaignApi.getCampaignRevenueRecords.mockImplementation(async () => [
    ...storedRevenueRecords,
  ]);
  campaignApi.createCampaignRevenueRecord.mockImplementation(
    async (_base: string, _page: string, input: CampaignRevenueInput) => {
      const record = persistedRecord(input);
      storedRevenueRecords.push(record);
      return record;
    },
  );
  campaignApi.updateCampaignRevenueRecord.mockImplementation(
    async (
      _base: string,
      _page: string,
      id: string,
      input: CampaignRevenueInput,
    ) => {
      const record = persistedRecord(input, id);
      storedRevenueRecords = storedRevenueRecords.map((existing) =>
        existing.id === id ? record : existing,
      );
      return record;
    },
  );
  campaignApi.deleteCampaignRevenueRecord.mockImplementation(
    async (_base: string, _page: string, id: string) => {
      storedRevenueRecords = storedRevenueRecords.filter(
        (record) => record.id !== id,
      );
    },
  );
});

describe("LinktreesGrid shared public-page presentation", () => {
  it("uses custom metadata and traffic wording without changing the card layout", () => {
    const DomainMeta = () => <LinktreePill label="بڵاوکراوە" />;

    render(
      <LinktreesGrid
        data={[item]}
        showPageMeta
        MetaBadgesComponent={DomainMeta}
        trafficLabels={{
          column: "ترافیک",
          views: "بینەری تاک",
          interactions: "کۆی کردار",
        }}
      />,
    );

    expect(screen.getByText("بڵاوکراوە")).toBeInTheDocument();
    expect(screen.getByText("دروستکراوە")).toBeInTheDocument();
    expect(screen.getByText("نوێکراوە")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("کۆی کردار")).toBeInTheDocument();
  });

  it("toggles the secondary grid actions inline", () => {
    render(
      <LinktreesGrid
        data={[item]}
        onViewAnalytics={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const analytics = screen.getByRole("button", { name: "ئامار" });
    const edit = screen.getByRole("button", { name: "دەستکاری" });
    const duplicate = screen.getByRole("button", { name: "لەبەرگرتنەوە" });
    const more = screen.getByRole("button", { name: "کردارە زیاترەکان" });
    expect(more.parentElement).toHaveClass("flex-nowrap");

    for (const action of [analytics, edit]) {
      expect(action).toHaveClass("flex-1");
    }
    expect(duplicate).toBeInTheDocument();
    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "قازانج" })).toBeNull();
    expect(screen.getByRole("button", { name: "بینین" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "سڕینەوە" })).toBeInTheDocument();

    fireEvent.click(more);

    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "قازانج" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "بینین" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "سڕینەوە" })).toBeInTheDocument();

    fireEvent.click(more);

    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "قازانج" })).toBeNull();
    expect(screen.getByRole("button", { name: "بینین" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "سڕینەوە" })).toBeInTheDocument();
  });

  it("calculates and persists IQD campaign revenue through the shared API", async () => {
    render(<LinktreesGrid data={[item]} />);

    fireEvent.click(screen.getByRole("button", { name: "کردارە زیاترەکان" }));
    fireEvent.click(screen.getByRole("button", { name: "قازانج" }));

    expect(
      screen.getByRole("dialog", { name: "داهاتی کەمپەین" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("تۆمارەکان بار دەکرێن...")).toBeNull(),
    );
    const advertisementPrice = screen.getByLabelText(
      "نرخی ڕیکلام بە دیناری عێراقی",
    );
    expect(advertisementPrice).toHaveValue(0);
    expect(advertisementPrice.className).toContain("appearance:textfield");
    const duration = screen.getByLabelText("ژمارەی ڕۆژەکانی کەمپەین");
    const startDate = screen.getByLabelText("بەرواری دەستپێک");
    const initialEndDate = screen.getByLabelText("بەرواری کۆتایی");
    expect(duration).toHaveValue(0);
    expect(startDate).not.toHaveValue("");
    expect(initialEndDate).toHaveValue("");
    expect(screen.getByLabelText("خەرجی کەمپەین بە دۆلار")).toHaveValue(0);
    expect(
      screen.getByLabelText("نرخی گۆڕینەوەی یەک دۆلار بە دینار"),
    ).toHaveValue(0);
    expect(screen.getByTestId("campaign-spend-iqd")).toHaveTextContent(
      "0 IQD",
    );
    expect(screen.getByTestId("net-revenue-iqd")).toHaveTextContent("0 IQD");

    const today = new Date();
    const typedStartDate = [
      String(today.getFullYear()).slice(-2),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("/");
    const expectedEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 8,
    );
    const expectedEndValue = [
      String(expectedEnd.getFullYear()).slice(-2),
      String(expectedEnd.getMonth() + 1).padStart(2, "0"),
      String(expectedEnd.getDate()).padStart(2, "0"),
    ].join("/");

    fireEvent.change(advertisementPrice, { target: { value: "25000" } });
    fireEvent.change(duration, { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("خەرجی کەمپەین بە دۆلار"), {
      target: { value: "10" },
    });
    fireEvent.change(
      screen.getByLabelText("نرخی گۆڕینەوەی یەک دۆلار بە دینار"),
      { target: { value: "1500" } },
    );

    expect(screen.getByLabelText("بەرواری کۆتایی")).toHaveValue(
      expectedEndValue,
    );
    expect(screen.getByTestId("campaign-spend-iqd")).toHaveTextContent(
      "15,000 IQD",
    );
    expect(screen.getByTestId("net-revenue-iqd")).toHaveTextContent(
      "10,000 IQD",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "پاشەکەوتکردن و زیادکردنی دانەیەکی تر",
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("total-revenue-iqd")).toHaveTextContent(
        "10,000 IQD",
      ),
    );
    expect(screen.getByText("1 تۆمار")).toBeInTheDocument();

    expect(
      screen.getByLabelText("نرخی ڕیکلام بە دیناری عێراقی"),
    ).toHaveValue(0);
    expect(screen.getByLabelText("ژمارەی ڕۆژەکانی کەمپەین")).toHaveValue(0);
    expect(screen.getByLabelText("بەرواری دەستپێک")).toHaveValue(
      typedStartDate,
    );
    expect(screen.getByLabelText("بەرواری کۆتایی")).toHaveValue("");

    fireEvent.change(
      screen.getByLabelText("نرخی ڕیکلام بە دیناری عێراقی"),
      { target: { value: "30000" } },
    );
    fireEvent.change(screen.getByLabelText("ژمارەی ڕۆژەکانی کەمپەین"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText("خەرجی کەمپەین بە دۆلار"), {
      target: { value: "10" },
    });
    fireEvent.change(
      screen.getByLabelText("نرخی گۆڕینەوەی یەک دۆلار بە دینار"),
      { target: { value: "1500" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "پاشەکەوتکردن و زیادکردنی دانەیەکی تر",
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("total-revenue-iqd")).toHaveTextContent(
        "25,000 IQD",
      ),
    );
    expect(screen.getByText("2 تۆمار")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: "داخستن" });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: "قازانج" }));
    await waitFor(() => expect(screen.getByText("2 تۆمار")).toBeInTheDocument());
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "دەستکاریکردنی تۆماری داهات",
      })[0],
    );

    expect(
      screen.getByRole("button", { name: "پاشەکەوتکردنی دەستکاری" }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText("نرخی ڕیکلام بە دیناری عێراقی"),
      { target: { value: "26000" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "پاشەکەوتکردنی دەستکاری" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("total-revenue-iqd")).toHaveTextContent(
        "26,000 IQD",
      ),
    );
    expect(screen.getByText("2 تۆمار")).toBeInTheDocument();
  });

  it("uses available action-row space for primary labels on default pages", () => {
    render(
      <LinktreesGrid
        data={[{ ...item, is_default: true }]}
        onViewAnalytics={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    for (const label of ["ئامار", "دەستکاری"]) {
      const action = screen.getByRole("button", { name: label });
      expect(action).toHaveClass("flex-1");
      expect(action).toHaveTextContent(label);
    }

    expect(screen.getByRole("button", { name: "بینین" })).toBeInTheDocument();
    const more = screen.getByRole("button", { name: "کردارە زیاترەکان" });
    fireEvent.click(more);

    expect(more.parentElement).toHaveClass("flex-nowrap");
    for (const label of ["ئامار", "دەستکاری"]) {
      expect(screen.getByRole("button", { name: label })).toHaveTextContent(
        label,
      );
    }
    expect(screen.getByRole("button", { name: "بینین" })).toBeInTheDocument();
  });
});
