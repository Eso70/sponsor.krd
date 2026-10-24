import { describe, expect, it } from "vitest";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { buildLinktreeEditorPreview, type LinktreeEditorPreviewDraft } from "./editor-preview";
import { readBackgroundImage } from "@/lib/templates/background-image";

const draft: LinktreeEditorPreviewDraft = {
  name: "Our page", subtitle: "Our subtitle", subtitleColor: "#ff0000", description: "Our description",
  slug: "our-page", image: "data:image/png;base64,YQ==", backgroundColor: "#ffffff",
  templateKey: "spectrum", templateConfig: { verification_badge: true, background_pattern: "dots" },
  accentColor: "#112233",
  socialLinks: [
    { id: "phone", platform: "phone", value: "7501234567", countryCode: "964", url: "", enabled: true, order: 1, displayName: "Call us" },
    { id: "website", platform: "website", value: "https://example.com", url: "", enabled: true, order: 0, customColor: "#ff0000" },
    { id: "hidden", platform: "email", url: "mailto:hidden@example.com", enabled: false },
  ],
};

describe("unsaved Linktree preview projection", () => {
  it.each(TEMPLATE_OPTIONS.map((template) => template.id))("uses the real %s template config and authored details", (templateKey) => {
    const result = buildLinktreeEditorPreview({ ...draft, templateKey });
    expect(result.linktree.template_config).toMatchObject({ templateKey, verification_badge: true });
    expect(result.linktree).toMatchObject({ name: draft.name, subtitle: draft.subtitle, description: draft.description, image: draft.image });
    expect(result.links.map((link) => link.id)).toEqual(["website", "phone"]);
    expect(result.links[0]).toMatchObject({ url: "https://example.com", metadata: { custom_color: "#ff0000" } });
    expect(result.links[1].url).toContain("9647501234567");
    expect(result.theme.backgroundPattern).toBe("dots");
  });
  it("shows local raster backgrounds without relaxing published-page validation", () => {
    const backgroundImage = "data:image/jpeg;base64,YQ==";
    expect(buildLinktreeEditorPreview({ ...draft, backgroundImage }).theme.backgroundImage).toBe(backgroundImage);
    expect(readBackgroundImage({ background_image: backgroundImage })).toBeNull();
    expect(buildLinktreeEditorPreview({ ...draft, backgroundImage: "data:image/svg+xml;base64,YQ==" }).theme.backgroundImage).toBeNull();
    expect(buildLinktreeEditorPreview({ ...draft, backgroundImage: "https://outside.example/image.png" }).theme.backgroundImage).toBeNull();
  });
  it("does not invent destinations for incomplete selected platforms", () => {
    const result = buildLinktreeEditorPreview({ ...draft, templateKey: "invalid", socialLinks: [{ id: "blank", platform: "whatsapp", url: "", enabled: true }] });
    expect(result.links[0].url).toBe("");
    expect(result.linktree.template_config?.templateKey).toBe("spectrum");
  });
});
