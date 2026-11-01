import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { formsApi } from "@/features/forms/api";
import { formWhatsAppSettingsCopy } from "@/features/forms/form-whatsapp-settings-copy";
import { formWhatsAppCopy } from "@/features/forms/form-submission-whatsapp";
import { formsCopy } from "@/features/forms/forms-copy";
import { PlatformSettingsPage } from "./PlatformSettingsPage";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

function renderSettings(locale: "ckb" | "ar" | "en" = "ckb") {
  return render(<PlatformLocaleProvider initialLocale={locale}><PlatformSettingsPage /></PlatformLocaleProvider>);
}

vi.mock("next/image", () => ({
  default: ({
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || ""} />
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/shared/ColorGradientModal", () => ({
  ColorGradientModal: () => null,
}));
vi.mock("@/features/forms/api", () => ({ formsApi: { whatsappTemplates: vi.fn(), saveWhatsAppTemplate: vi.fn() } }));

const savedSettings = {
  id: "admin-id",
  username: "operator",
  name: "Saved SponsorKrd",
  email: "admin@example.com",
  phone: "+964 750 123 4567",
  logo: "/images/upload/sponsor-krd/logo.png",
  avatar: "/images/upload/sponsor-krd/avatar.png",
  favicon: "/images/upload/sponsor-krd/favicon.ico",
  accent_color: "gradient:to-r:#25F4EE:#FE2C55",
  accent_ink_color: "#ffffff",
  app_url: "https://sponsor-krd.example",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("PlatformSettingsPage General tab", () => {
  it.each(["en", "ar", "ckb"] as const)("uses the shared Form messages settings in %s", async locale => {
    vi.clearAllMocks();
    vi.mocked(formsApi.whatsappTemplates).mockResolvedValue({ [locale]: "Saved {{name}}" });
    vi.mocked(formsApi.saveWhatsAppTemplate).mockResolvedValue({ [locale]: "Changed {{name}}" });
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: savedSettings })));
    renderSettings(locale);
    await screen.findByDisplayValue("Saved SponsorKrd");
    fireEvent.click(screen.getByRole("tab", { name: formWhatsAppSettingsCopy(locale).tab }));
    const panel = screen.getByRole("region", { name: formWhatsAppSettingsCopy(locale).title });
    const field = await within(panel).findByRole("textbox", { name: formWhatsAppCopy(locale).message });
    expect(field).toHaveValue("Saved {{name}}");
    fireEvent.change(field, { target: { value: "Changed {{name}}" } });
    fireEvent.click(within(panel).getByRole("button", { name: formsCopy(locale).save }));
    await waitFor(() => expect(formsApi.saveWhatsAppTemplate).toHaveBeenCalledWith("platform", locale, "Changed {{name}}", expect.any(AbortSignal), expect.objectContaining({ order: "products_first", style: "compact" })));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("localizes general and security settings in Arabic", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input) =>
      String(input) === "/api/platform/settings/sessions"
        ? jsonResponse({ success: true, data: { sessions: [] } })
        : jsonResponse({ success: true, data: savedSettings }),
    ));
    renderSettings("ar");

    expect(await screen.findByRole("heading", { name: "الإعدادات العامة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حفظ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "تسجيل الدخول والجلسات" }));
    expect(await screen.findByRole("heading", { name: "تسجيل الدخول باستخدام Google" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد جلسات نشطة.")).toBeInTheDocument();
  });

  it("shows the returned session count instead of a fixed figure", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input) => String(input).endsWith("/sessions")
      ? jsonResponse({ data: { sessions: [{ id: "current-session", is_current: true, created_at: "2026-01-01T00:00:00Z", last_activity_at: "2026-01-01T00:00:00Z" }] } })
      : jsonResponse({ data: savedSettings })));
    renderSettings("ar");
    await screen.findByDisplayValue("Saved SponsorKrd");
    const label = screen.getByText("الجلسات النشطة");
    expect(label.closest("article")).toHaveTextContent("—");
    fireEvent.click(screen.getByRole("tab", { name: "تسجيل الدخول والجلسات" }));
    await waitFor(() => {
      const card = screen.getAllByText("الجلسات النشطة").find((node) => node.closest("article"))?.closest("article");
      expect(card?.querySelector("[data-stat-card-value]")).toHaveTextContent("1");
    });
  });

  it("uses the shared Arabic copy in the platform TikTok Pixel panel", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input) =>
      String(input) === "/api/platform/settings/tiktok"
        ? jsonResponse({ success: true, data: { tiktok_configs: [] } })
        : jsonResponse({ success: true, data: savedSettings }),
    ));
    renderSettings("ar");
    await screen.findByDisplayValue("Saved SponsorKrd");
    fireEvent.click(screen.getByRole("tab", { name: "إعدادات تيك توك" }));
    expect(await screen.findByRole("heading", { name: "ربط تيك توك" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد مجموعات تيك توك")).toBeInTheDocument();
  });

  it("localizes the TikTok ad-account empty state and connect modal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ success: true, data: savedSettings })));
    renderSettings("ar");
    await screen.findByDisplayValue("Saved SponsorKrd");
    fireEvent.click(screen.getByRole("tab", { name: "حساب إعلانات تيك توك" }));
    expect(await screen.findByText("لا يوجد حساب إعلانات تيك توك مرتبط")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "الربط بتيك توك" }));
    expect(screen.getByText("ربط حساب تيك توك (الإعلانات)")).toBeInTheDocument();
    expect(screen.getByText("رمز ومعرّف مباشر")).toBeInTheDocument();
  });

  it("localizes retention and media controls and cleanup confirmations", async () => {
    const retention = {
      policy: { communication_history_days: 365, automatic_cleanup: true, cleanup_hour_utc: 2, batch_size: 1000, updated_at: new Date().toISOString() },
      eligible: { communications: 5 },
      last_run: null,
    };
    const media = {
      policy: { max_upload_size_mb: 5, allowed_formats: ["jpeg", "png", "ico"], optimize_images: true, image_quality: 82, max_image_dimension: 2048, auto_cleanup_unused: true, unused_grace_hours: 72, updated_at: new Date().toISOString() },
      stats: { asset_count: 12, stored_bytes: 2048, saved_bytes: 1024 },
      unused_assets: 2,
    };
    vi.stubGlobal("fetch", vi.fn(async (input) => {
      if (String(input) === "/api/platform/settings/data-retention") return jsonResponse({ data: retention });
      if (String(input) === "/api/platform/settings/media") return jsonResponse({ data: media });
      return jsonResponse({ data: savedSettings });
    }));
    renderSettings("ar");
    await screen.findByDisplayValue("Saved SponsorKrd");

    fireEvent.click(screen.getByRole("tab", { name: "البيانات والاحتفاظ" }));
    expect(await screen.findByText("الرسائل والإعلانات المؤرشفة")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تنظيف الآن" }));
    expect(screen.getByText("تنظيف البيانات القديمة")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));

    fireEvent.click(screen.getByRole("tab", { name: "الوسائط والرفع" }));
    expect(await screen.findByText("صيغ الملفات المسموح بها")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تنظيف الملفات غير المستخدمة" }));
    expect(screen.getByText("ستُحذف فقط الملفات القديمة غير المستخدمة في أي ملف نشاط تجاري أو صفحة روابط أو طلب تغيير.")).toBeInTheDocument();
  });

  it("loads settings from the database API and saves profile and branding", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      if (!init?.method || init.method === "GET") {
        return jsonResponse({ success: true, data: savedSettings });
      }
      return jsonResponse({ success: true, data: savedSettings });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderSettings();

    await screen.findByDisplayValue("Saved SponsorKrd");
    expect(screen.getByDisplayValue("operator")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+964 750 123 4567")).toBeInTheDocument();
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(screen.queryByAltText("Default avatar")).not.toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://sponsor-krd.example"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("لۆگۆ")).toHaveAttribute(
      "src",
      "/images/upload/sponsor-krd/logo.png",
    );

    fireEvent.click(screen.getByRole("button", { name: "پاشەکەوتکردن" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/settings/general",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
      const generalCall = fetchMock.mock.calls.find(([url]) => url === "/api/platform/settings/general");
      const general = JSON.parse(String(generalCall?.[1]?.body));
      const branding = general.branding as Record<string, unknown>;
      expect(general.profile.username).toBe('operator');
      expect(branding.logo).toBe(savedSettings.logo);
      expect(branding).not.toHaveProperty("avatar");
      expect(branding).not.toHaveProperty("favicon");
    });
  });

  it("shows Google authentication in Login & Sessions and loads security data", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input) === "/api/platform/settings/sessions") {
        return jsonResponse({
          success: true,
          data: { sessions: [] },
        });
      }
      return jsonResponse({ success: true, data: savedSettings });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderSettings();
    await screen.findByDisplayValue("Saved SponsorKrd");
    expect(screen.queryByText("Google OAuth چالاکە")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("tab", { name: "چوونەژوورەوە و دانیشتنەکان" }),
    );

    expect(
      await screen.findByRole("heading", { name: "چوونەژوورەوە بە Google" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/settings/sessions",
        expect.objectContaining({ method: "GET" }),
      );
    });
    expect(screen.getByText("هیچ دانیشتنێکی چالاک نەدۆزرایەوە.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نوێکردنەوەی دانیشتنەکان" })).toBeInTheDocument();
  });

  it("loads the database-backed data retention tab", async () => {
    const retention = {
      policy: {
        communication_history_days: 365,
        automatic_cleanup: false,
        cleanup_hour_utc: 2,
        batch_size: 1000,
        updated_at: new Date().toISOString(),
      },
      eligible: { communications: 5 },
      last_run: null,
    };
    const fetchMock = vi.fn<typeof fetch>(async (input) =>
      String(input) === "/api/platform/settings/data-retention"
        ? jsonResponse({ success: true, data: retention })
        : jsonResponse({ success: true, data: savedSettings }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();
    await screen.findByDisplayValue("Saved SponsorKrd");

    fireEvent.click(screen.getByRole("tab", { name: "داتا و ماوەی هەڵگرتن" }));

    await screen.findByText("پەیام و ڕاگەیاندنی ئەرشیڤکراو");
    expect(screen.getAllByDisplayValue("365")).toHaveLength(1);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/settings/data-retention",
        expect.objectContaining({ method: "GET" }),
      ),
    );
  });

  it("loads the enforced media and uploads policy", async () => {
    const media = {
      policy: {
        max_upload_size_mb: 5,
        allowed_formats: ["jpeg", "png", "ico"],
        optimize_images: true,
        image_quality: 82,
        max_image_dimension: 2048,
        auto_cleanup_unused: true,
        unused_grace_hours: 72,
        updated_at: new Date().toISOString(),
      },
      stats: { asset_count: 12, stored_bytes: 2048, saved_bytes: 1024 },
      unused_assets: 2,
    };
    const fetchMock = vi.fn<typeof fetch>(async (input) =>
      String(input) === "/api/platform/settings/media"
        ? jsonResponse({ success: true, data: media })
        : jsonResponse({ success: true, data: savedSettings }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();
    await screen.findByDisplayValue("Saved SponsorKrd");

    fireEvent.click(screen.getByRole("tab", { name: "میدیا و بارکردن" }));

    await screen.findByText("جۆری فایلە ڕێگەپێدراوەکان");
    expect(screen.getByDisplayValue("2048")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "JPG / JPEG" })).toBeChecked();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/settings/media",
        expect.objectContaining({ method: "GET" }),
      ),
    );
  });

  it("shows the Kurdish TikTok tab with the shared business configuration UI", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const endpoint = String(input);
      if (endpoint === "/api/platform/settings/tiktok") {
        return jsonResponse({ success: true, data: { tiktok_configs: [] } });
      }
      if (endpoint === "/api/platform/settings/tiktok/health") {
        return jsonResponse({
          success: true,
          data: { connections: 0, serverEvents: 0, browserEvents: 0 },
        });
      }
      if (endpoint === "/api/platform/settings/tiktok/errors") {
        return jsonResponse({ success: true, data: { items: [] } });
      }
      return jsonResponse({ success: true, data: savedSettings });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderSettings();
    await screen.findByDisplayValue("Saved SponsorKrd");

    expect(
      screen.queryByRole("tab", { name: "TikTok Tracking" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "ڕێکخستنەکانی تیکتۆک" }));

    expect(
      await screen.findByRole("heading", { name: "پەیوەستکردنی TikTok" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("گرووپەکانی Pixel و Events API"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Pixel و Events APIی تایبەت بە پەڕە گشتییەکانی Sponsor.krd. هیچ کاتێک بۆ پەڕەی بزنسەکان بەکار نایەت.",
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/settings/tiktok",
        expect.objectContaining({ credentials: "include" }),
      ),
    );
  });

  it("shows the TikTok Ads account tab with the shared ad account connection UI for platform admin", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return jsonResponse({ success: true, data: savedSettings });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderSettings();
    await screen.findByDisplayValue("Saved SponsorKrd");

    fireEvent.click(
      screen.getByRole("tab", { name: "هەژماری ڕیکلامی تیکتۆک" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "هەژماری ڕیکلامی تیکتۆک",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "بەستنەوە و بەڕێوەبردنی هەژماری ڕیکلامی تیکتۆک بۆ بەڕێوەبردنی کەمپەینەکانی پلاتفۆرم.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "تەنها ١ هەژماری ڕیکلامی تیکتۆک دەتوانرێت بۆ پلاتفۆرم ببەسترێتەوە.",
      ),
    ).toBeInTheDocument();
  });
});
