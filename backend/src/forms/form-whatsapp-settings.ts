import { BadRequestException } from '@nestjs/common';
import Joi from 'joi';
import {
  FORM_WHATSAPP_TEMPLATE_LIMIT,
  validFormWhatsAppTemplate,
} from '@linktree/types/form-whatsapp-template.cjs';
import type { FormLanguage } from '@linktree/types';
import type { FormWhatsAppDetailsConfig } from '@linktree/types';
import { validFormWhatsAppDetails } from '@linktree/types/form-whatsapp-details.cjs';

const schema = Joi.object({
  language: Joi.string().valid('en', 'ckb', 'ar').required(),
  template: Joi.string()
    .max(FORM_WHATSAPP_TEMPLATE_LIMIT)
    .allow(null)
    .required(),
  details: Joi.any().custom((value: unknown, helpers) =>
    validFormWhatsAppDetails(value) ? value : helpers.error('any.invalid'),
  ),
});
export function validateFormWhatsAppSettings(input: unknown): {
  language: FormLanguage;
  template: string | null;
  details?: FormWhatsAppDetailsConfig;
} {
  const result = schema.validate(input, { convert: false });
  if (result.error)
    throw new BadRequestException('Invalid WhatsApp message settings');
  const value = result.value as {
    language: FormLanguage;
    template: string | null;
    details?: FormWhatsAppDetailsConfig;
  };
  if (value.template !== null && !validFormWhatsAppTemplate(value.template))
    throw new BadRequestException('Invalid WhatsApp message template');
  return value;
}
