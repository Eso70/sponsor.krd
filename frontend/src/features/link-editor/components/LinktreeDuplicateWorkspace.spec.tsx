import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { LinktreeDuplicateWorkspace } from "./LinktreeDuplicateWorkspace";
import { buildLinktreeEditorPreview } from "../editor-preview";
import { businessMessages } from "@/features/business/i18n/messages";

const mocks = vi.hoisted(() => ({ request: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/api/request", () => ({
  apiRequest: mocks.request,
  isApiRequestError: () => false,
}));
vi.mock("./LinktreeEditorPreview", () => ({
  LinktreeEditorPreview: ({
    draft,
  }: {
    draft: import("../editor-preview").LinktreeEditorPreviewDraft;
  }) => (
    <output data-testid="duplicate-preview">
      {JSON.stringify(buildLinktreeEditorPreview(draft))}
    </output>
  ),
}));
vi.mock("@/features/forms/form-media", async (original) => ({
  ...(await original<typeof import("@/features/forms/form-media")>()),
  readFormImage: mocks.read,
}));
const item = {
  id: "source",
  name: "Saved page",
  uid: "source",
  created_at: "",
  updated_at: "",
  status: "active" as const,
};
function setup(
  patch: Partial<ComponentProps<typeof LinktreeDuplicateWorkspace>> = {},
) {
  const footer = document.createElement("div");
  footer.dataset.duplicateTestFooter = "";
  document.body.append(footer);
  const props = {
    item,
    locale: "en" as const,
    platformTheme: false,
    source: {
      linktree: {
        id: "source",
        uid: "source",
        name: "Saved page",
        logo: "/images/upload/source.png",
        background_color: "#ffffff",
        template_config: { templateKey: "spectrum" },
      },
      links: [],
    },
    footerTarget: footer,
    requestCrop: vi.fn(),
    uploadImage: vi.fn(async () => "/images/upload/new.png"),
    onCancel: vi.fn(),
    onSuccess: vi.fn(),
    onBusyChange: vi.fn(),
    ...patch,
  };
  const view = render(<LinktreeDuplicateWorkspace {...props} />);
  return { ...view, props };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.request.mockImplementation(async (url: string) =>
    url.includes("duplicate-options")
      ? {
          slug:
            new URL(url, "http://localhost").searchParams.get("slug") ??
            "saved-page-copy",
          available: true,
        }
      : {},
  );
  mocks.read.mockResolvedValue("data:image/png;base64,YQ==");
});
afterEach(() =>
  document
    .querySelectorAll("[data-duplicate-test-footer]")
    .forEach((element) => element.remove()),
);

describe("inline Linktree duplication", () => {
  it("waits for a selected banner image before allowing duplication", async () => {
    let finish!: (image: string) => void;
    mocks.read.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const { container } = setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Banner" }));
    const submit = screen.getByRole("button", { name: "Duplicate" });
    const picker = container.querySelector('input[type="file"][aria-label]');
    expect(picker).not.toBeNull();
    fireEvent.change(picker!, {
      target: {
        files: [new File(["image"], "banner.png", { type: "image/png" })],
      },
    });
    expect(submit).toBeDisabled();
    await act(async () => finish("data:image/png;base64,YQ=="));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
    );
  });
  for (const platformTheme of [false, true]) {
    it(`previews and persists copy text, slug, appearance and banner edits (platform=${platformTheme})`, async () => {
      const { props } = setup({
        platformTheme,
        source: {
          linktree: {
            id: "source",
            uid: "source",
            name: "Saved page",
            logo: "/images/upload/source.png",
            background_color: "#ffffff",
            slogan: "Original slogan",
            description: "Original description",
            template_config: {
              templateKey: "spectrum",
              banner: {
                enabled: true,
                mode: "image",
                images: ["/images/upload/old-banner.png"],
              },
            },
          },
          links: [
            {
              id: "website",
              platform: "custom",
              url: "https://example.com",
              display_name: "Website",
              display_order: 0,
            },
          ],
        },
      });
      const snapshot = structuredClone(props.source);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
      );
      fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), {
        target: { value: "Different page" },
      });
      fireEvent.change(
        screen.getByRole("textbox", { name: "Promotion slogan" }),
        { target: { value: "New slogan" } },
      );
      fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
        target: { value: "New description" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Link slug" }), {
        target: { value: "different-page" },
      });
      expect(screen.getByText("/linktree/different-page")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
      fireEvent.click(screen.getByRole("option", { name: "Dark" }));
      fireEvent.click(screen.getByRole("button", { name: "Banner" }));
      fireEvent.click(screen.getByRole("tab", { name: "Carousel" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Crop image: Banner image 1" }),
      );
      await act(async () =>
        vi
          .mocked(props.requestCrop)
          .mock.calls[0][0].onConfirm(
            new File(["png"], "crop.png", { type: "image/png" }),
          ),
      );
      await waitFor(() =>
        expect(screen.getByTestId("duplicate-preview")).toHaveTextContent(
          '"name":"Different page"',
        ),
      );
      const presentation = JSON.parse(
        screen.getByTestId("duplicate-preview").textContent!,
      );
      expect(presentation.linktree).toMatchObject({
        name: "Different page",
        subtitle: "New slogan",
        description: "New description",
        seo_name: "different-page",
        background_color: "#161b22",
        template_config: {
          banner: {
            enabled: true,
            mode: "carousel",
            images: ["data:image/png;base64,YQ=="],
          },
        },
      });
      expect(presentation.links[0]).toMatchObject({
        url: "https://example.com",
        display_name: "Website",
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
      );
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await waitFor(() => expect(props.onSuccess).toHaveBeenCalledOnce());
      expect(mocks.request).toHaveBeenLastCalledWith(
        `${platformTheme ? "/api/platform/linktrees" : "/api/linktrees"}/source/duplicate`,
        {
          method: "POST",
          json: {
            headline: "Different page",
            slogan: "New slogan",
            description: "New description",
            slug: "different-page",
            background_color: "#161b22",
            banner: {
              enabled: true,
              mode: "carousel",
              images: ["/images/upload/new.png"],
            },
          },
        },
      );
      expect(props.uploadImage).toHaveBeenCalledWith(
        expect.any(File),
        "banner-image",
      );
      expect(props.source).toEqual(snapshot);
    });
    it.each(["en", "ckb", "ar"] as const)(
      `keeps the source logo by default in %s (platform=${platformTheme})`,
      async (locale) => {
        const { props } = setup({ platformTheme, locale });
        const copy = businessMessages[locale].DuplicateLinktree;
        await waitFor(() =>
          expect(
            screen.getByRole("button", { name: copy.duplicate }),
          ).toBeEnabled(),
        );
        fireEvent.click(screen.getByRole("button", { name: copy.duplicate }));
        await waitFor(() => expect(props.onSuccess).toHaveBeenCalledOnce());
        expect(mocks.request).toHaveBeenCalledWith(
          `${platformTheme ? "/api/platform/linktrees" : "/api/linktrees"}/source/duplicate`,
          {
            method: "POST",
            json: { headline: "Saved page", slug: "saved-page-copy" },
          },
        );
        expect(props.uploadImage).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
    );
    it(`uploads a replacement before duplication and reuses it on retry (platform=${platformTheme})`, async () => {
      const { props } = setup({ platformTheme });
      const file = new File(["png"], "new.png", { type: "image/png" });
      fireEvent.change(screen.getByLabelText("Logo", { selector: "input" }), {
        target: { files: [file] },
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
      );
      fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), {
        target: { value: "New copy" },
      });
      mocks.request.mockRejectedValueOnce(new Error("offline"));
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await screen.findByRole("alert");
      expect(props.onSuccess).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
      await waitFor(() => expect(props.onSuccess).toHaveBeenCalledOnce());
      expect(props.uploadImage).toHaveBeenCalledExactlyOnceWith(
        expect.any(File),
        "profile-image",
      );
      expect(mocks.request).toHaveBeenLastCalledWith(
        `${platformTheme ? "/api/platform/linktrees" : "/api/linktrees"}/source/duplicate`,
        {
          method: "POST",
          json: {
            headline: "New copy",
            slug: "saved-page-copy",
            logo: "/images/upload/new.png",
          },
        },
      );
      expect(item.name).toBe("Saved page");
    });
  }
  it("requests the shared crop workspace and can remove only the duplicate logo", async () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Crop image" }));
    expect(props.requestCrop).toHaveBeenCalledWith(
      expect.objectContaining({
        src: props.source.linktree.logo,
        allowWebp: false,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    await waitFor(() => expect(props.onSuccess).toHaveBeenCalledOnce());
    expect(mocks.request).toHaveBeenLastCalledWith(
      "/api/linktrees/source/duplicate",
      {
        method: "POST",
        json: { headline: "Saved page", slug: "saved-page-copy", logo: null },
      },
    );
  });
  it("does not duplicate if a replacement upload fails", async () => {
    const { props } = setup({ uploadImage: vi.fn(async () => null) });
    fireEvent.change(screen.getByLabelText("Logo", { selector: "input" }), {
      target: { files: [new File(["png"], "new.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    await screen.findByRole("alert");
    expect(
      mocks.request.mock.calls.filter(
        ([, options]) => options?.method === "POST",
      ),
    ).toHaveLength(0);
    expect(props.onSuccess).not.toHaveBeenCalled();
  });
  it("blocks invalid logos and localizes the error when language changes", async () => {
    const { props, rerender } = setup();
    fireEvent.change(screen.getByLabelText("Logo", { selector: "input" }), {
      target: {
        files: [new File(["text"], "bad.txt", { type: "text/plain" })],
      },
    });
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    rerender(<LinktreeDuplicateWorkspace {...props} locale="ar" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "اختر صورة JPEG أو PNG حتى 5 ميغابايت.",
    );
    expect(props.uploadImage).not.toHaveBeenCalled();
    expect(
      mocks.request.mock.calls.filter(
        ([, options]) => options?.method === "POST",
      ),
    ).toHaveLength(0);
  });
  it("shows and validates edited slugs before allowing duplication", async () => {
    mocks.request.mockImplementation(async (url: string) => {
      const value =
        new URL(url, "http://localhost").searchParams.get("slug") ??
        "saved-page-copy";
      return { slug: value, available: value !== "taken" };
    });
    setup();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Link slug" })).toHaveValue(
        "saved-page-copy",
      ),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Link slug" }), {
      target: { value: "Not valid" },
    });
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Link slug" }), {
      target: { value: "taken" },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This slug is already in use",
      ),
    );
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Link slug" }), {
      target: { value: "free-copy" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled(),
    );
    expect(screen.getByText("/linktree/free-copy")).toBeInTheDocument();
  });
});
