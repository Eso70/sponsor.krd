export interface EditLinkData {
  linktree: {
    id: string;
    name?: string;
    headline?: string;
    slogan?: string | null;
    slogan_color?: string | null;
    logo?: string | null;
    subtitle?: string | null;
    subtitle_color?: string | null;
    description?: string | null;
    seo_name?: string | null;
    uid: string;
    image?: string | null;
    background_color: string;
    template_config?: Record<string, unknown> | null;
    footer_text?: string | null;
    footer_phone?: string | null;
    footer_hidden?: boolean | null;
    status?: string;
  };
  links: Array<{
    id: string;
    platform: string;
    url: string;
    display_name?: string | null;
    description?: string | null;
    default_message?: string | null;
    display_order: number;
    metadata?: Record<string, unknown> | null;
  }>;
}

export interface LinktreeEditorSubmitData {
  is_default?: boolean;
  headline: string;
  slug?: string;
  slogan?: string;
  slogan_color?: string;
  description?: string;
  logo: string | null;
  background_color: string;
  templateKey: TemplateKey;
  templateConfig: Record<string, unknown>;
  status?: "active" | "inactive";
  platforms: string[];
  links: Record<string, string[]>;
  linkMetadata?: Record<
    string,
    Array<{
      display_order?: number;
      display_name?: string;
      description?: string;
      default_message?: string;
      metadata?: Record<string, unknown>;
    }>
  >;
}
import type { TemplateKey } from "@/lib/templates/config";
