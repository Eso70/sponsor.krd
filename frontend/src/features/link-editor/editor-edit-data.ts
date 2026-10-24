import type { EditLinkData } from "./editor-types";
import type { EditorCopy } from "./editor-copy";
import { getEditorPlatformName } from "./editor-copy";
import { extractValueFromUrl } from "./modal-utils";
import type { SocialLink } from "./types";
import type { LinktreeEditorPreviewDraft } from "./editor-preview";
import { normalizeTemplateConfig } from "@/lib/templates/config";
import { readBackgroundImage } from "@/lib/templates/background-image";

/** One saved-link adapter for both editing and duplicating a page. */
export function socialLinksFromEditData(
  links: EditLinkData["links"],
  copy?: EditorCopy,
): SocialLink[] {
  return [...links]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((link, index) => {
      const extracted = extractValueFromUrl(
        link.platform,
        link.url,
        link.metadata || null,
      );
      return {
        id: `${link.platform}-${link.id}-${index}`,
        platform: link.platform,
        url: link.url,
        value: extracted.value,
        countryCode: extracted.countryCode,
        displayName:
          link.display_name || getEditorPlatformName(link.platform, copy),
        customColor:
          typeof link.metadata?.custom_color === "string"
            ? link.metadata.custom_color
            : undefined,
        customIcon:
          typeof link.metadata?.custom_icon === "string"
            ? link.metadata.custom_icon
            : undefined,
        enabled: true,
        order: link.display_order ?? index,
      };
    });
}

export function savedLinktreePreview(
  source: EditLinkData,
  accentColor?: string,
  copy?: EditorCopy,
): LinktreeEditorPreviewDraft {
  const page = source.linktree;
  const config = normalizeTemplateConfig(
    undefined,
    page.template_config ?? null,
  );
  return {
    name: page.headline ?? page.name ?? "",
    subtitle: page.slogan ?? page.subtitle ?? "",
    subtitleColor: page.slogan_color ?? page.subtitle_color ?? "",
    description: page.description ?? "",
    slug: page.seo_name ?? "",
    image: page.logo ?? page.image ?? null,
    backgroundColor: page.background_color,
    backgroundImage: readBackgroundImage(config),
    templateKey:
      typeof config.templateKey === "string" ? config.templateKey : "spectrum",
    templateConfig: config,
    socialLinks: socialLinksFromEditData(source.links, copy),
    accentColor,
  };
}
