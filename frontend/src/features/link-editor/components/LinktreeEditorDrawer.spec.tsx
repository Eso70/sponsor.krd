import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createPortal } from "react-dom";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LinktreeEditorDrawer } from "./LinktreeEditorDrawer";
import type { LinktreeEditorPreviewDraft } from "../editor-preview";
import { englishEditorCopy, arabicEditorCopy } from "../editor-copy";
import { DashboardAppearanceControls } from "@/components/shared/DashboardAppearanceControls";
import {
  BusinessLocaleProvider,
  useBusinessLocale,
} from "@/features/business/i18n/BusinessLocaleProvider";
import { BusinessLanguageSelector } from "@/features/business/components/BusinessLanguageSelector";
import {
  PlatformLocaleProvider,
  usePlatformLocale,
} from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { PlatformLanguageSelector } from "@/features/platform-admin/components/PlatformLanguageSelector";
import type { BusinessLocale } from "@/features/business/i18n/messages";

vi.mock("@/components/shared/ImageCropEditor", () => ({
  ImageCropEditor: (
    props: import("react").ComponentProps<
      typeof import("@/components/shared/ImageCropEditor").ImageCropEditor
    >,
  ) => (
    <>
      <section
        role="region"
        aria-label={props.copy.title}
        data-png-only={String(props.allowWebp === false)}
      />
      {props.footerTarget &&
        createPortal(
          <>
            <button type="button" onClick={props.onClose}>
              {props.cancelLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                void props.onConfirm(
                  new File(["cropped"], "crop.png", { type: "image/png" }),
                )
              }
            >
              {props.copy.confirm}
            </button>
          </>,
          props.footerTarget,
        )}
    </>
  ),
}));

const preferenceRequest = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ apiRequest: preferenceRequest }));

vi.mock("@/lib/contexts/ThemeProvider", () => ({
  useTheme: () => ({ color: { raw: "#25F4EE" } }),
}));

vi.mock("./LinktreeEditorPreview", () => ({
  LinktreeEditorPreview: ({ draft }: { draft: LinktreeEditorPreviewDraft }) => (
    <div>
      <p data-testid="preview-name">{draft.name}</p>
      <p data-testid="preview-template">{draft.templateKey}</p>
      <p data-testid="preview-background">{draft.backgroundColor}</p>
      <p data-testid="preview-pattern">{String(draft.templateConfig.background_pattern ?? "none")}</p>
      <p data-testid="preview-image">{draft.image}</p>
      <p data-testid="preview-background-image">{draft.backgroundImage}</p>
    </div>
  ),
}));

describe("verification badge editor integration", () => {
  it.each([false, true])(
    "defaults off and restores saved state with platformTheme=%s",
    async (platformTheme) => {
      const props = {
        isOpen: true,
        locale: "en" as const,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        platformTheme,
        copy: englishEditorCopy,
        ...(platformTheme
          ? {
              apiEndpoints: {
                upload: "/api/platform/linktrees/upload",
                checkName: "/api/platform/linktrees/check-name",
                checkSlug: "/api/platform/linktrees/check-slug",
              },
            }
          : {}),
      };
      const { rerender } = render(<LinktreeEditorDrawer {...props} />);
      expect(screen.queryByText("Hide footer")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Footer name")).not.toBeInTheDocument();
      expect(document.getElementById("footerPhone")).toBeNull();
      const preview = within(
        screen.getByRole("complementary", { name: "Live preview" }),
      );
      expect(
        preview.getByRole("button", { name: "Page design" }),
      ).toBeInTheDocument();
      expect(
        preview.getByRole("button", { name: "Background pattern" }),
      ).toBeInTheDocument();
      fireEvent.click(preview.getByRole("combobox", { name: "Theme" }));
      fireEvent.click(screen.getByRole("option", { name: "Dark" }));
      await waitFor(() =>
        expect(preview.getByTestId("preview-background")).toHaveTextContent(
          "#161b22",
        ),
      );
      const label = "Show blue verification badge";
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      rerender(<LinktreeEditorDrawer {...props} isOpen={false} />);
      rerender(
        <LinktreeEditorDrawer
          {...props}
          editData={{
            linktree: {
              id: "saved-page",
              name: "Saved page",
              uid: "saved-page",
              background_color: "#ffffff",
              template_config: {
                templateKey: "spectrum",
                verification_badge: true,
              },
            },
            links: [],
          }}
        />,
      );
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    },
  );
});

describe("shared Linktree drawer", () => {
  it.each([false, true])("opens new pages in dark appearance and preserves saved edit colors (platform=%s)", (platformTheme) => {
    const props = { isOpen: true, locale: "en" as const, copy: englishEditorCopy, platformTheme,
      businessDefaults: {}, onClose: vi.fn(), onSubmit: vi.fn() };
    const { rerender } = render(<LinktreeEditorDrawer {...props} />);
    expect(screen.getByTestId("preview-background")).toHaveTextContent("#161b22");
    expect(screen.getByTestId("preview-pattern")).toHaveTextContent("grid45");
    rerender(<LinktreeEditorDrawer {...props} editData={{ linktree: { id: "saved-light", uid: "saved-light", name: "Saved light page", background_color: "#ffffff", template_config: { templateKey: "spectrum" } }, links: [] }} />);
    expect(screen.getByTestId("preview-background")).toHaveTextContent("#ffffff");
    expect(screen.getByTestId("preview-pattern")).toHaveTextContent("none");
    rerender(<LinktreeEditorDrawer {...props} isOpen={false} />);
    rerender(<LinktreeEditorDrawer {...props} />);
    expect(screen.getByTestId("preview-background")).toHaveTextContent("#161b22");
    expect(screen.getByTestId("preview-pattern")).toHaveTextContent("grid45");
  });

  it.each([false, true])("uses saved appearance defaults, including no pattern (platform=%s)", (platformTheme) => {
    render(<LinktreeEditorDrawer isOpen locale="en" copy={englishEditorCopy} platformTheme={platformTheme}
      businessDefaults={{default_background_color: "#abcdef", default_background_pattern: "none"}} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId("preview-background")).toHaveTextContent("#abcdef");
    expect(screen.getByTestId("preview-pattern")).toHaveTextContent("none");
  });

  it.each([false, true])(
    "edits and persists category and optional SEO settings (platform=%s)",
    async (platformTheme) => {
      const save = vi.fn();
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          advancedSeoAllowed
          onClose={vi.fn()}
          onSubmit={save}
          editData={{
            linktree: {
              id: "seo-page",
              uid: "seo-page",
              name: "Real page",
              background_color: "#ffffff",
              template_config: {
                templateKey: "spectrum",
                seo: {
                  version: 1,
                  category: "food",
                  businessType: "restaurant",
                  title: "Saved title",
                },
              },
            },
            links: [
              {
                id: "instagram",
                platform: "instagram",
                url: "https://instagram.com/business",
                display_order: 0,
              },
            ],
          }}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Category" }),
      ).toHaveTextContent("Food & restaurants");
      fireEvent.click(screen.getByRole("button", { name: "Category" }));
      fireEvent.click(
        screen.getByRole("option", { name: "Professional services" }),
      );
      expect(
        screen.getByRole("button", { name: "Business type" }),
      ).toHaveTextContent("Not selected");
      fireEvent.click(screen.getByRole("button", { name: "Business type" }));
      fireEvent.click(screen.getByRole("option", { name: "Consulting" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Search & page details" }),
      );
      expect(screen.getByRole("textbox", { name: "SEO title" })).toHaveValue(
        "Saved title",
      );
      fireEvent.change(screen.getByRole("textbox", { name: "SEO title" }), {
        target: { value: "New search title" },
      });
      fireEvent.change(
        screen.getByRole("textbox", { name: "SEO description" }),
        { target: { value: "Authored search description" } },
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Search visibility" }),
      );
      fireEvent.click(
        screen.getByRole("option", { name: "Hide from search engines" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Page language" }));
      fireEvent.click(screen.getByRole("option", { name: "العربية" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            templateConfig: expect.objectContaining({
              seo: expect.objectContaining({
                version: 1,
                category: "professional",
                businessType: "consulting",
                title: "New search title",
                description: "Authored search description",
                indexing: "noindex",
                language: "ar",
              }),
            }),
          }),
          "seo-page",
        ),
      );
    },
  );
  it.each([false, true])(
    "saves pointer-drag order across duplicate platforms (platform=%s)",
    async (platformTheme) => {
      vi.stubGlobal("PointerEvent", MouseEvent);
      const pointDescriptor = Object.getOwnPropertyDescriptor(
        document,
        "elementFromPoint",
      );
      const save = vi.fn();
      try {
        render(
          <LinktreeEditorDrawer
            isOpen
            locale="en"
            copy={englishEditorCopy}
            platformTheme={platformTheme}
            onClose={vi.fn()}
            onSubmit={save}
            editData={{
              linktree: {
                id: "ordered-page",
                uid: "ordered-page",
                name: "Ordered page",
                background_color: "#ffffff",
                template_config: { templateKey: "spectrum" },
              },
              links: [
                {
                  id: "first",
                  platform: "custom",
                  url: "https://first.example",
                  display_order: 0,
                },
                {
                  id: "instagram",
                  platform: "instagram",
                  url: "https://instagram.com/business",
                  display_order: 1,
                },
                {
                  id: "youtube",
                  platform: "youtube",
                  url: "https://youtube.com/@business",
                  display_order: 2,
                },
                {
                  id: "last",
                  platform: "custom",
                  url: "https://last.example",
                  display_order: 3,
                },
              ],
            }}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Links" }));
        const source = screen.getByRole("button", {
          name: /reorder.*YouTube/i,
        });
        const target = screen
          .getByRole("button", { name: /reorder.*Instagram/i })
          .closest("[data-reorder-id]");
        Object.assign(source, {
          setPointerCapture: vi.fn(),
          hasPointerCapture: () => true,
          releasePointerCapture: vi.fn(),
        });
        Object.defineProperty(document, "elementFromPoint", {
          configurable: true,
          value: () => target,
        });
        fireEvent.pointerDown(source, { button: 0, clientX: 10, clientY: 10 });
        fireEvent.pointerMove(source, { clientX: 10, clientY: 50 });
        fireEvent.pointerUp(source);
        expect(document.documentElement).not.toHaveAttribute(
          "data-reorder-dragging",
        );
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() =>
          expect(save).toHaveBeenCalledWith(
            expect.objectContaining({
              linkMetadata: expect.objectContaining({
                custom: [
                  expect.objectContaining({ display_order: 0 }),
                  expect.objectContaining({ display_order: 3 }),
                ],
                youtube: [expect.objectContaining({ display_order: 1 })],
                instagram: [expect.objectContaining({ display_order: 2 })],
              }),
            }),
            "ordered-page",
          ),
        );
      } finally {
        vi.unstubAllGlobals();
        if (pointDescriptor)
          Object.defineProperty(document, "elementFromPoint", pointDescriptor);
        else Reflect.deleteProperty(document, "elementFromPoint");
      }
    },
  );
  it.each([false, true])(
    "restores a carousel and saves it disabled without losing images (platform=%s)",
    async (platformTheme) => {
      const save = vi.fn();
      const images = [
        "/images/upload/banner-one.png",
        "/images/upload/banner-two.png",
      ];
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          onClose={vi.fn()}
          onSubmit={save}
          editData={{
            linktree: {
              id: "banner-page",
              uid: "banner-page",
              name: "Banner page",
              background_color: "#ffffff",
              template_config: {
                templateKey: "spectrum",
                banner: { enabled: true, mode: "carousel", images },
              },
            },
            links: [
              {
                id: "instagram",
                platform: "instagram",
                url: "https://instagram.com/example",
                display_name: "Instagram",
                display_order: 0,
              },
            ],
          }}
        />,
      );
      expect(screen.getByRole("switch", { name: "Banner" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      fireEvent.click(screen.getByRole("button", { name: "Banner" }));
      expect(screen.getByRole("tab", { name: "Carousel" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Preview Banner image 1" }),
      );
      expect(
        await screen.findByRole("dialog", { name: "Banner image" }),
      ).toBeInTheDocument();
      fireEvent.click(
        within(screen.getByRole("dialog", { name: "Banner image" })).getByRole(
          "button",
          { name: "Close" },
        ),
      );
      fireEvent.click(screen.getByRole("switch", { name: "Banner" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            templateConfig: expect.objectContaining({
              banner: { enabled: false, mode: "carousel", images },
            }),
          }),
          "banner-page",
        ),
      );
    },
  );
  it.each([false, true])(
    "changes header appearance and locale without losing the draft (platform=%s)",
    async (platform) => {
      preferenceRequest.mockResolvedValue({ locale: "ckb" });
      render(
        platform ? (
          <PlatformLocaleProvider initialLocale="en">
            <PlatformDrawerPreferences />
          </PlatformLocaleProvider>
        ) : (
          <BusinessLocaleProvider initialLocale="en">
            <BusinessDrawerPreferences />
          </BusinessLocaleProvider>
        ),
      );
      const drawer = screen.getByRole("dialog");
      fireEvent.change(document.getElementById("headline")!, {
        target: { value: "Keep my draft" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Show blue verification badge" }),
      );
      const header = within(drawer.querySelector("header")!);
      expect(header.getAllByRole("button")).toHaveLength(3);
      fireEvent.click(header.getByRole("button", { name: "Toggle theme" }));
      expect(
        header
          .getByRole("button", { name: "Toggle theme" })
          .querySelector(".lucide-sun"),
      ).toBeInTheDocument();
      fireEvent.click(header.getAllByRole("button")[0]);
      await waitFor(() =>
        expect(preferenceRequest).toHaveBeenCalledWith(
          platform
            ? "/api/platform/auth/preferred-locale"
            : "/api/auth/preferred-locale",
          { method: "PATCH", json: { locale: "ckb" } },
        ),
      );
      expect(screen.getByRole("dialog")).toBe(drawer);
      await waitFor(() =>
        expect(drawer).toHaveAccessibleName("پەڕەی نوێ دروست بکە"),
      );
      expect(document.getElementById("headline")).toHaveValue("Keep my draft");
      await waitFor(() =>
        expect(screen.getByTestId("preview-name")).toHaveTextContent(
          "Keep my draft",
        ),
      );
    },
  );
  it.each([false, true])(
    "keeps one drawer through data loading with platformTheme=%s",
    async (platformTheme) => {
      const close = vi.fn();
      const props = {
        isOpen: true,
        locale: "en" as const,
        onClose: close,
        onSubmit: vi.fn(),
        platformTheme,
        copy: englishEditorCopy,
      };
      const { rerender } = render(
        <LinktreeEditorDrawer {...props} isLoadingEditData />,
      );
      const drawer = screen.getByRole("dialog");
      expect(
        screen.getByRole("status", { name: "Loading page information" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(close).toHaveBeenCalledOnce();
      rerender(
        <LinktreeEditorDrawer
          {...props}
          editData={{
            linktree: {
              id: "saved",
              uid: "saved",
              name: "Saved name",
              background_color: "#ffffff",
              template_config: { templateKey: "aurora" },
            },
            links: [],
          }}
        />,
      );
      expect(screen.getByRole("dialog")).toBe(drawer);
      await waitFor(() =>
        expect(screen.getByTestId("preview-name")).toHaveTextContent(
          "Saved name",
        ),
      );
      expect(screen.getByTestId("preview-template")).toHaveTextContent(
        "aurora",
      );
    },
  );
  it("preserves the business default design and updates its unsaved preview", async () => {
    render(
      <LinktreeEditorDrawer
        isOpen
        locale="en"
        copy={englishEditorCopy}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        businessDefaults={{ default_template: "serenity" }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("preview-template")).toHaveTextContent(
        "serenity",
      ),
    );
    fireEvent.change(document.getElementById("headline")!, {
      target: { value: "New draft name" },
    });
    await waitFor(() =>
      expect(screen.getByTestId("preview-name")).toHaveTextContent(
        "New draft name",
      ),
    );
  });
});

function PreferenceDrawer({
  locale,
  languageControl,
  platformTheme = false,
}: {
  locale: BusinessLocale;
  languageControl: ReactNode;
  platformTheme?: boolean;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <LinktreeEditorDrawer
      isOpen
      locale={locale}
      platformTheme={platformTheme}
      copy={
        locale === "en"
          ? englishEditorCopy
          : locale === "ar"
            ? arabicEditorCopy
            : undefined
      }
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      headerControls={
        <DashboardAppearanceControls
          compact
          theme={theme}
          mounted
          onToggleTheme={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
          languageControl={languageControl}
        />
      }
    />
  );
}
function BusinessDrawerPreferences() {
  const { locale } = useBusinessLocale();
  return (
    <PreferenceDrawer
      locale={locale}
      languageControl={<BusinessLanguageSelector compact />}
    />
  );
}
function PlatformDrawerPreferences() {
  const { locale } = usePlatformLocale();
  return (
    <PreferenceDrawer
      locale={locale}
      platformTheme
      languageControl={<PlatformLanguageSelector compact />}
    />
  );
}

describe("single-page Linktree editor", () => {
  it.each([false, true])(
    "opens sections directly and saves from Information (platform=%s)",
    async (platformTheme) => {
      const submit = vi.fn();
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          onClose={vi.fn()}
          onSubmit={submit}
          editData={{
            linktree: {
              id: "one-page",
              uid: "one-page",
              name: "One page",
              background_color: "#ffffff",
              template_config: { templateKey: "spectrum" },
            },
            links: [
              {
                id: "instagram",
                platform: "instagram",
                url: "https://instagram.com/example",
                display_order: 0,
              },
            ],
          }}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Continue" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Back" }),
      ).not.toBeInTheDocument();
      const information = screen.getByRole("button", { name: "Information" });
      expect(information).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(screen.getByRole("button", { name: "Links" }));
      expect(information).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(
        screen.getByRole("button", { name: "WhatsApp questions" }),
      );
      expect(
        screen.getByRole("button", { name: "WhatsApp questions" }),
      ).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(information);
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({
          headline: "One page",
          platforms: ["instagram"],
        }),
        "one-page",
      );
    },
  );

  it.each([false, true])(
    "opens invalid Information before saving (platform=%s)",
    async (platformTheme) => {
      const submit = vi.fn();
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          onClose={vi.fn()}
          onSubmit={submit}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Links" }));
      fireEvent.click(screen.getByRole("button", { name: "Create" }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Information" }),
        ).toHaveAttribute("aria-expanded", "true"),
      );
      expect(submit).not.toHaveBeenCalled();
      expect(document.getElementById("headline")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    },
  );
});

describe("built-in draft language", () => {
  it.each([false, true])(
    "localizes saved WhatsApp defaults on opening and subsequent language changes (platform=%s)",
    async (platformTheme) => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        platformTheme,
        editData: {
          linktree: {
            id: "saved-default-prompts",
            uid: "saved-default-prompts",
            name: "Business",
            background_color: "#ffffff",
            template_config: {
              templateKey: "spectrum",
              whatsapp_modal: {
                enabled: true,
                title: "Contact Us",
                subtitle: " Choose a question ",
              },
            },
          },
          links: [],
        },
      };
      const { rerender } = render(
        <LinktreeEditorDrawer {...props} locale="ckb" />,
      );
      expect(screen.getByDisplayValue("پەیوەندی کردن")).toBeInTheDocument();
      expect(screen.getByDisplayValue("پرسیارێک هەڵبژێرە")).toBeInTheDocument();
      for (const [locale, copy] of [
        ["ar", arabicEditorCopy],
        ["en", englishEditorCopy],
      ] as const) {
        rerender(
          <LinktreeEditorDrawer {...props} locale={locale} copy={copy} />,
        );
        await waitFor(() =>
          expect(
            screen.getByDisplayValue(copy.whatsappTitle),
          ).toBeInTheDocument(),
        );
        expect(
          screen.getByDisplayValue(copy.whatsappSubtitle),
        ).toBeInTheDocument();
      }
    },
  );
  it.each([false, true])(
    "updates built-ins across all drawer languages and preserves authored fields (platform=%s)",
    async (platformTheme) => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        platformTheme,
        editData: {
          linktree: {
            id: "localized",
            uid: "localized",
            name: "My business",
            subtitle: "My tagline",
            description: englishEditorCopy.defaultDescription,
            background_color: "#ffffff",
            template_config: {
              templateKey: "spectrum",
              whatsapp_modal: {
                enabled: true,
                title: englishEditorCopy.whatsappTitle,
                subtitle: englishEditorCopy.whatsappSubtitle,
                questions: [
                  {
                    id: "order",
                    text: englishEditorCopy.order,
                    message: englishEditorCopy.orderMessage,
                  },
                  {
                    id: "price",
                    text: "My custom question",
                    message: englishEditorCopy.priceMessage,
                  },
                ],
              },
            },
          },
          links: [
            {
              id: "instagram",
              platform: "instagram",
              url: "https://instagram.com/example",
              display_name: "Instagram",
              display_order: 0,
            },
            {
              id: "whatsapp",
              platform: "whatsapp",
              url: "https://wa.me/9647501234567",
              display_name: "Sales team",
              display_order: 1,
            },
          ],
        },
      };
      const { rerender } = render(
        <LinktreeEditorDrawer
          {...props}
          locale="en"
          copy={englishEditorCopy}
        />,
      );
      // Even a manually restored default must remain authored.
      fireEvent.change(
        screen.getByDisplayValue(englishEditorCopy.whatsappTitle),
        { target: { value: "Custom title" } },
      );
      fireEvent.change(screen.getByDisplayValue("Custom title"), {
        target: { value: englishEditorCopy.whatsappTitle },
      });
      for (const [
        locale,
        copy,
        description,
        instagram,
        order,
        priceMessage,
      ] of [
        [
          "ckb",
          undefined,
          "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
          "ئینستاگرام",
          "داواکردن",
          "سڵاو بەڕێز، نرخی چەندە ؟",
        ],
        [
          "ar",
          arabicEditorCopy,
          arabicEditorCopy.defaultDescription,
          "إنستغرام",
          arabicEditorCopy.order,
          arabicEditorCopy.priceMessage,
        ],
        [
          "en",
          englishEditorCopy,
          englishEditorCopy.defaultDescription,
          "Instagram",
          englishEditorCopy.order,
          englishEditorCopy.priceMessage,
        ],
      ] as const) {
        rerender(
          <LinktreeEditorDrawer {...props} locale={locale} copy={copy} />,
        );
        await waitFor(() =>
          expect(screen.getByDisplayValue(description)).toBeInTheDocument(),
        );
        expect(screen.getByDisplayValue(instagram)).toBeInTheDocument();
        expect(screen.getByDisplayValue(order)).toBeInTheDocument();
        expect(screen.getByDisplayValue(priceMessage)).toBeInTheDocument();
        expect(screen.getByDisplayValue("Sales team")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("My custom question"),
        ).toBeInTheDocument();
        expect(
          screen.getByDisplayValue(englishEditorCopy.whatsappTitle),
        ).toBeInTheDocument();
        expect(document.getElementById("headline")).toHaveValue("My business");
        expect(document.getElementById("slogan")).toHaveValue("My tagline");
      }
    },
  );
});

describe("Linktree duplicate workspace", () => {
  it.each([false, true])(
    "duplicates inside the same drawer and preserves the original draft (platform=%s)",
    async (platformTheme) => {
      const close = vi.fn(),
        save = vi.fn(),
        refreshed = vi.fn();
      preferenceRequest.mockImplementation(async (url: string) =>
        url.includes("duplicate-options")
          ? { slug: "saved-source-copy", available: true }
          : {},
      );
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          onClose={close}
          onSubmit={save}
          management={{
            item: {
              id: "saved-source",
              uid: "saved-source",
              name: "Saved source",
              status: "active",
              created_at: "",
              updated_at: "",
            },
            onDuplicated: refreshed,
          }}
          editData={{
            linktree: {
              id: "saved-source",
              uid: "saved-source",
              name: "Saved source",
              logo: "/images/upload/source.png",
              background_color: "#ffffff",
              template_config: { templateKey: "spectrum" },
            },
            links: [
              {
                id: "instagram",
                platform: "instagram",
                url: "https://instagram.com/example",
                display_order: 0,
              },
            ],
          }}
        />,
      );
      const drawer = screen.getByRole("dialog");
      fireEvent.change(document.getElementById("headline")!, {
        target: { value: "Unsaved original headline" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(screen.getByRole("dialog", { name: "Duplicate page" })).toBe(
        drawer,
      );
      fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), {
        target: { value: "My duplicate" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Crop image" }));
      await screen.findByRole("region", { name: "Crop image" });
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      fireEvent.click(
        within(drawer.querySelector("[data-crop-footer]")!).getByRole(
          "button",
          { name: "Cancel" },
        ),
      );
      await waitFor(() =>
        expect(screen.getByRole("textbox", { name: "Headline" })).toHaveValue(
          "My duplicate",
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
      );
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await waitFor(() => expect(refreshed).toHaveBeenCalledOnce());
      expect(preferenceRequest).toHaveBeenCalledWith(
        `${platformTheme ? "/api/platform/linktrees" : "/api/linktrees"}/saved-source/duplicate`,
        {
          method: "POST",
          json: {
            headline: "My duplicate",
            slug: "saved-source-copy",
            logo: null,
          },
        },
      );
      expect(document.getElementById("headline")).toHaveValue(
        "Unsaved original headline",
      );
      expect(close).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    },
  );
});

describe("Linktree crop workspace", () => {
  it.each([false, true])(
    "crops profile and background in the same drawer without losing the draft (platform=%s)",
    async (platformTheme) => {
      const close = vi.fn();
      const save = vi.fn();
      render(
        <LinktreeEditorDrawer
          isOpen
          locale="en"
          copy={englishEditorCopy}
          platformTheme={platformTheme}
          onClose={close}
          onSubmit={save}
          editData={{
            linktree: {
              id: "crop-page",
              uid: "crop-page",
              name: "Crop page",
              image: "/images/upload/logo.png",
              background_color: "#ffffff",
              template_config: {
                templateKey: "spectrum",
                background_image: "/images/upload/background.png",
              },
            },
            links: [
              {
                id: "instagram",
                platform: "instagram",
                url: "https://instagram.com/example",
                display_order: 0,
              },
            ],
          }}
        />,
      );
      const drawer = screen.getByRole("dialog");
      fireEvent.change(document.getElementById("headline")!, {
        target: { value: "Keep my crop draft" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Crop image" }));
      await screen.findByRole("region", { name: "Crop image" });
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(screen.getByRole("dialog")).toBe(drawer);
      expect(
        screen.getByRole("region", { name: "Crop image" }),
      ).toHaveAttribute("data-png-only", "true");
      const footer = within(drawer.querySelector("[data-crop-footer]")!);
      fireEvent.click(footer.getByRole("button", { name: "Confirm crop" }));
      await waitFor(() =>
        expect(
          screen.queryByRole("region", { name: "Crop image" }),
        ).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(screen.getByTestId("preview-image").textContent).toMatch(
          /^data:image\/png;base64,/,
        ),
      );
      expect(document.getElementById("headline")).toHaveValue(
        "Keep my crop draft",
      );
      // The background picker uses the same inline crop workspace.
      fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
      fireEvent.click(screen.getByRole("option", { name: "Custom" }));
      fireEvent.click(
        within(
          screen.getByRole("dialog", { name: "Custom background" }),
        ).getByRole("button", { name: "Crop image" }),
      );
      await screen.findByRole("region", { name: "Crop image" });
      fireEvent.click(
        within(drawer.querySelector("[data-crop-footer]")!).getByRole(
          "button",
          { name: "Cancel" },
        ),
      );
      expect(close).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.queryByRole("region", { name: "Crop image" }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("preview-background-image")).toHaveTextContent(
        "/images/upload/background.png",
      );
      fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
      fireEvent.click(screen.getByRole("option", { name: "Custom" }));
      fireEvent.click(
        within(
          screen.getByRole("dialog", { name: "Custom background" }),
        ).getByRole("button", { name: "Crop image" }),
      );
      await screen.findByRole("region", { name: "Crop image" });
      fireEvent.click(
        within(drawer.querySelector("[data-crop-footer]")!).getByRole(
          "button",
          { name: "Confirm crop" },
        ),
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("preview-background-image").textContent,
        ).toMatch(/^data:image\/png;base64,/),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("region", { name: "Crop image" }),
        ).not.toBeInTheDocument(),
      );
      const upload = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (_url, options) => {
          const asset = (options?.body as FormData).get("assetType");
          return new Response(
            JSON.stringify({ url: `/images/upload/cropped-${asset}.png` }),
            { status: 200 },
          );
        });
      try {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(save).toHaveBeenCalledOnce());
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            logo: "/images/upload/cropped-profile-image.png",
            templateConfig: expect.objectContaining({
              background_image: "/images/upload/cropped-background-image.png",
            }),
            headline: "Keep my crop draft",
          }),
          "crop-page",
        );
        const imageRequest = upload.mock.calls.find(
          ([, options]) => options?.method === "POST",
        );
        expect(imageRequest?.[1]).toMatchObject({ credentials: "include" });
        expect((imageRequest?.[1]?.body as FormData).get("file")).toMatchObject(
          { type: "image/png", name: "crop.png" },
        );
      } finally {
        upload.mockRestore();
      }
    },
  );
});

it.each([false, true])(
  "exposes advanced SEO only with the explicit Max capability (%s)",
  (allowed) => {
    render(
      <LinktreeEditorDrawer
        isOpen
        locale="en"
        copy={englishEditorCopy}
        advancedSeoAllowed={allowed}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      Boolean(screen.queryByRole("button", { name: "Search & page details" })),
    ).toBe(allowed);
    expect(Boolean(screen.queryByRole("button", { name: "Category" }))).toBe(
      allowed,
    );
    expect(
      screen.getByRole("textbox", { name: "Headline" }),
    ).toBeInTheDocument();
  },
);
