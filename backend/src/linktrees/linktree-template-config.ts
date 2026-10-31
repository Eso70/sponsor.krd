import {
  LINKTREE_BANNER_KEY,
  readLinktreeBanner,
} from '@linktree/types/linktree-banner.cjs';
import { normalizeLinktreeSeoConfig } from '../common/linktree-seo';
import { BadRequestException } from '@nestjs/common';
import { readWhatsappQuestionColor } from '@linktree/types/whatsapp-question.cjs';
import {
  inspectLinktreeSponsor,
  LINKTREE_SPONSOR_KEY,
} from '@linktree/types/linktree-sponsor.cjs';
import {
  BACKGROUND_IMAGE_CONFIG_KEY,
  isLinktreeBackgroundImage,
} from '../common/linktree-background-image';
import {
  BACKGROUND_PATTERN_CONFIG_KEY,
  isLinktreeBackgroundPattern,
} from '../common/linktree-background-pattern';
export type TemplateConfig = Record<string, unknown> & {
  templateKey?: string;
  type?: string;
  buttonStyle?: string;
  buttonGradient?: boolean;
  whatsapp_modal?: Record<string, unknown>;
};
export type NormalizedTemplateConfig = TemplateConfig & {
  templateKey: string;
  whatsapp_modal: Record<string, unknown>;
};
export function normalizeTemplateConfig(
  templateConfig: TemplateConfig | string | null | undefined,
  templateKey?: string | null,
  validateSeo = false,
): NormalizedTemplateConfig {
  const config: TemplateConfig =
    typeof templateConfig === 'string'
      ? (JSON.parse(templateConfig || '{}') as TemplateConfig)
      : { ...(templateConfig || {}) };

  config.templateKey = config.templateKey || templateKey || 'spectrum';
  config.type = config.type || 'simple';
  config.buttonStyle = config.buttonStyle || 'pill';
  config.buttonGradient = config.buttonGradient !== false;
  config.verification_badge = config.verification_badge === true;
  if (config[LINKTREE_BANNER_KEY] !== undefined) {
    config[LINKTREE_BANNER_KEY] = readLinktreeBanner(
      config[LINKTREE_BANNER_KEY],
    );
  }
  normalizeLinktreeSeoConfig(config, validateSeo);
  if (config[LINKTREE_SPONSOR_KEY] !== undefined) {
    const sponsor = inspectLinktreeSponsor(config[LINKTREE_SPONSOR_KEY]);
    if (Object.keys(sponsor.errors).length)
      throw new BadRequestException({
        message: 'Invalid sponsor settings',
        details: sponsor.errors,
      });
    config[LINKTREE_SPONSOR_KEY] = sponsor.value;
  }
  config.whatsapp_modal = config.whatsapp_modal || {};
  if (config.whatsapp_modal.backgroundColor !== undefined) {
    config.whatsapp_modal = {
      ...config.whatsapp_modal,
      backgroundColor: readWhatsappQuestionColor(
        config.whatsapp_modal.backgroundColor,
      ),
    };
  }

  // A background image is painted into public page CSS, so anything that is
  // not one of our own uploads is dropped rather than stored or served.
  if (!isLinktreeBackgroundImage(config[BACKGROUND_IMAGE_CONFIG_KEY])) {
    delete config[BACKGROUND_IMAGE_CONFIG_KEY];
  }

  // A pattern outside the catalogue draws nothing, which would leave the
  // owner with a setting that appears saved and never applies.
  if (!isLinktreeBackgroundPattern(config[BACKGROUND_PATTERN_CONFIG_KEY])) {
    delete config[BACKGROUND_PATTERN_CONFIG_KEY];
  }

  return config as NormalizedTemplateConfig;
}
