import type { LinktreePresentation, LinktreePresentationLink } from "@linktree/types";
import { isLocalRasterImageWithinLimit } from "@/lib/images/local-raster-image";
import type { SocialLink } from "./types";
import { normalizeSelectedSocialLinks } from "./link-payload";
import { normalizeTemplateConfig } from "@/lib/templates/config";
import { createLinktreeTemplateTheme } from "@/lib/templates/template-theme";

export type LinktreeEditorPreviewDraft = {
  name: string;
  subtitle: string;
  subtitleColor: string;
  description: string;
  slug: string;
  image: string | null;
  backgroundColor: string;
  backgroundImage?: string | null;
  templateKey: string;
  templateConfig: Record<string, unknown>;
  accentColor?: string;
  socialLinks: SocialLink[];
};

/** Project the draft into the existing presentation contract without uploads or API calls. */
export function buildLinktreeEditorPreview(draft: LinktreeEditorPreviewDraft) {
  const linktree: LinktreePresentation = {
    id: "linktree-editor-preview", uid: "editor-preview", name: draft.name,
    seo_name: draft.slug, subtitle: draft.subtitle, subtitle_color: draft.subtitleColor,
    description: draft.description, image: draft.image, background_color: draft.backgroundColor,
    template_config: normalizeTemplateConfig(draft.templateKey, draft.templateConfig),
    business_website_color: draft.accentColor,
  };
  const normalized = new Map(normalizeSelectedSocialLinks(draft.socialLinks, draft.socialLinks.filter((link) => link.enabled).map((link) => link.id)).map((link) => [link.id, link]));
  const links: LinktreePresentationLink[] = [...draft.socialLinks]
    .filter((link) => link.enabled)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((link, index) => ({
      id: link.id, linktree_id: linktree.id, platform: link.platform,
      url: normalized.get(link.id)?.url ?? "",
      display_name: link.displayName, display_order: index, is_active: true,
      default_message: normalized.get(link.id)?.defaultMessage,
      metadata: normalized.get(link.id)?.metadata ?? {},
    }));
  const theme = createLinktreeTemplateTheme(draft.backgroundColor, linktree.template_config);
  // Unsaved raster previews are local-only; public URL validation remains strict.
  if (draft.backgroundImage?.startsWith("data:") && isLocalRasterImageWithinLimit(draft.backgroundImage, 14_000_000)) theme.backgroundImage = draft.backgroundImage;
  return { linktree, links, theme };
}
