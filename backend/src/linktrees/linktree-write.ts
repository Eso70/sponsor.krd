import { validateLinktreeUpdate } from './validate-linktree-update';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import type { StorageService } from '../storage/storage.service';
import { normalizeLinktreeContent } from './linktree-content';
import type { UpdateLinktreeDto } from './dto/update-linktree.dto';
import {
  normalizeTemplateConfig,
  type TemplateConfig,
} from './linktree-template-config';
import { assertLinktreeSeoPlan } from '../common/linktree-seo';
import { assertLinktreeMediaOwnership } from '../common/linktree-banner';
import {
  syncWhatsAppQuestions,
  type WhatsappQuestionInput,
} from './sync-whatsapp-questions';
import { syncLinksInTransaction } from '../links/sync-links';
import { buildSyncLinks } from './linktree-links';
export type LinktreeRow = {
  id: string;
  name: string;
  subtitle: string | null;
  subtitle_color: string | null;
  description: string | null;
  seo_name: string;
  uid: string;
  image: string | null;
  background_color: string;
  template_key: string | null;
  template_config: TemplateConfig | string | null;
  whatsapp_modal_enabled: boolean | null;
  footer_text: string | null;
  footer_phone: string | null;
  footer_hidden: boolean | null;
  status: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  archived_at?: Date | null;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
  business_default_avatar?: string | null;
};
/** Caller owns the transaction; all normal and approved writes use this operation. */
export async function updateLinktreeInTransaction(
  client: PoolClient,
  id: string,
  input: UpdateLinktreeDto,
  businessId: string,
  scope: 'business' | 'platform',
  storage: Pick<StorageService, 'areBusinessAssetsOwned'> &
    Partial<Pick<StorageService, 'arePlatformBrandingAssetsOwned'>>,
  assertTemplateAllowed: (businessId: string, key: string) => Promise<void>,
) {
  validateLinktreeUpdate(input);
  const data = normalizeLinktreeContent(input);
  const isPlatform = scope === 'platform';
  const currentResult = await client.query<LinktreeRow>(
    `SELECT id, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, description, seo_name, uid, logo AS image, background_color, template_key, template_config, whatsapp_modal_enabled, footer_text, footer_phone, footer_hidden, status, is_default, is_archived, archived_at FROM linktrees WHERE id=$1 AND business_id=$2 FOR UPDATE`,
    [id, businessId],
  );
  const current = currentResult.rows[0];
  if (!current) throw new NotFoundException('Linktree not found');
  const nextSeoName = data.seo_name || data.slug;

  if (nextSeoName && nextSeoName !== current.seo_name) {
    const slugCheck = await client.query<{
      '?column?': number;
    }>(
      'SELECT 1 FROM linktrees WHERE business_id = $1 AND seo_name = $2 AND id != $3',
      [businessId, nextSeoName, id],
    );
    if (slugCheck.rows.length > 0)
      throw new ConflictException('SEO URL slug already in use');
  }

  const name = data.name !== undefined ? data.name : current.name;
  const subtitle =
    data.subtitle !== undefined ? data.subtitle : current.subtitle;
  const subtitle_color =
    data.subtitle_color !== undefined
      ? data.subtitle_color || null
      : current.subtitle_color;
  const description =
    data.description !== undefined ? data.description : current.description;
  const seo_name = nextSeoName !== undefined ? nextSeoName : current.seo_name;
  const image = data.image !== undefined ? data.image : current.image;
  const background_color =
    data.background_color !== undefined
      ? data.background_color
      : current.background_color;
  const footer_text =
    data.footer_text !== undefined ? data.footer_text : current.footer_text;
  const footer_phone =
    data.footer_phone !== undefined ? data.footer_phone : current.footer_phone;
  const footer_hidden =
    data.footer_hidden !== undefined
      ? data.footer_hidden
      : current.footer_hidden;
  const status =
    data.status !== undefined ? data.status : current.status || 'active';
  if (current.is_default && status === 'inactive') {
    throw new BadRequestException('پەیجی بنەڕەتی ناتوانرێت ناچالاک بکرێت');
  }

  if (current.is_default && data.is_archived)
    throw new BadRequestException('The default page cannot be archived');
  const config = normalizeTemplateConfig(
    data.template_config !== undefined
      ? data.template_config
      : current.template_config,
    current.template_key,
    data.template_config !== undefined,
  );
  if (!isPlatform)
    await assertLinktreeSeoPlan(
      client,
      businessId,
      config,
      normalizeTemplateConfig(current.template_config),
    );
  await assertLinktreeMediaOwnership(
    storage,
    businessId,
    config,
    data.image,
    isPlatform,
  );
  if (!isPlatform) {
    await assertTemplateAllowed(businessId, config.templateKey);
  }
  const whatsappModal = config.whatsapp_modal || {};
  const whatsappEnabled =
    data.template_config !== undefined
      ? !!whatsappModal.enabled
      : (current.whatsapp_modal_enabled ?? !!whatsappModal.enabled);
  const whatsappQuestions: WhatsappQuestionInput[] = Array.isArray(
    whatsappModal.questions,
  )
    ? (whatsappModal.questions as WhatsappQuestionInput[])
    : [];

  const ltRes = await client.query<LinktreeRow>(
    `UPDATE linktrees
         SET headline = $1, slogan = $2, slogan_color = $15, description = $14, seo_name = $3,
             logo = $4, background_color = $5,
             template_key = $6, template_config = $7::jsonb, whatsapp_modal_enabled = $8,
             footer_text = $9, footer_phone = $10, footer_hidden = $11,
             status = $16, is_archived = $17, archived_at = CASE WHEN $17 THEN COALESCE(archived_at, NOW()) ELSE NULL END,
             updated_at = NOW()
         WHERE id = $12 AND business_id = $13
         RETURNING id, headline AS name, slogan AS subtitle, slogan_color AS subtitle_color, description, seo_name, uid, logo AS image, background_color,
                   template_key, template_config, whatsapp_modal_enabled,
                    footer_text, footer_phone, footer_hidden, status, is_pinned, is_archived, archived_at, is_default, created_at, updated_at`,
    [
      name,
      subtitle,
      seo_name,
      image,
      background_color,
      config.templateKey,
      JSON.stringify(config),
      whatsappEnabled,
      footer_text,
      footer_phone,
      footer_hidden,
      id,
      businessId,
      description,
      subtitle_color,
      status,
      data.is_archived !== undefined ? data.is_archived : !!current.is_archived,
    ],
  );

  const updatedLinktree = ltRes.rows[0];

  if (data.template_config !== undefined)
    await syncWhatsAppQuestions(client, id, whatsappQuestions);

  if (data.links !== undefined)
    await syncLinksInTransaction(client, id, buildSyncLinks(data), businessId);
  return { row: updatedLinktree, current, image, config };
}
