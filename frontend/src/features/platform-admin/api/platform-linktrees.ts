import type { LinktreeEditorSubmitData } from "@/features/link-editor/editor-types";
import { normalizeTemplateConfig } from "@/lib/templates/config";

/** Converts editor state to the exact backend CreateLinktreeDto boundary. */
export function buildPlatformLinktreePayload(data: LinktreeEditorSubmitData) {
  return {
    headline: data.headline.trim(),
    slogan: data.slogan?.trim() || "",
    slogan_color: data.slogan_color?.trim() || null,
    description: data.description?.trim() || undefined,
    logo: data.logo || null,
    background_color: data.background_color,
    template_config: normalizeTemplateConfig(
      data.templateKey,
      data.templateConfig,
    ),
    status: data.status || undefined,
    is_default: false,
    platforms: data.platforms,
    links: data.links,
    linkMetadata: data.linkMetadata,
  };
}
