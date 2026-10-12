import { BadRequestException, ConflictException } from '@nestjs/common';
import Joi from 'joi';
import { priceProductAnswer, productAnswerText } from './form-products';
import { PRIVACY_VERSION } from '../common/legal-versions';
import {
  WEBSITE_COLOR_PATTERN,
  WEBSITE_COLOR_MAX_LENGTH,
  SOLID_HEX_COLOR_PATTERN,
} from '../common/website-color';
import type {
  FormDraft,
  FormSubmissionInput,
  FormSubmission,
} from '@linktree/types';

const text = (max = 2000) => Joi.string().max(max).allow('');
const id = Joi.string().pattern(/^[a-zA-Z0-9_-]{1,80}$/);
const image = Joi.string()
  .max(500)
  .pattern(/^\/images\/upload\/[a-zA-Z0-9_./-]+$/)
  .allow('');
const url = Joi.string()
  .max(2048)
  .uri({ scheme: ['https', 'http'] })
  .custom((value: string, helpers) => {
    if (!value) return value;
    const parsed = new URL(value);
    return parsed.username || parsed.password
      ? helpers.error('any.invalid')
      : value;
  })
  .allow('');
const entry = Joi.object({
  id: id.required(),
  image: image.required(),
  title: text(100).required(),
  description: text(2000).required(),
});
const question = Joi.object({
  id: id.required(),
  type: Joi.string()
    .valid(
      'short',
      'email',
      'phone',
      'choice',
      'conditional',
      'date',
      'image',
      'product',
    )
    .required(),
  label: text(200).required(),
  description: text(),
  labelKey: text(40),
  category: text(40),
  required: Joi.boolean().required(),
  options: Joi.array().items(text(500)).max(20).required(),
  optionImages: Joi.array().items(image).max(20),
  image,
  productSelection: Joi.object({
    currency: Joi.string().valid('IQD', 'USD', 'EUR').required(),
    items: Joi.array()
      .items(
        Joi.object({
          id: id.invalid('__proto__', 'constructor', 'prototype').required(),
          name: text(100).required(),
          unit: text(30).required(),
          unitPrice: Joi.number()
            .min(0)
            .max(10_000_000)
            .precision(2)
            .allow(null)
            .required(),
        }),
      )
      .max(20)
      .unique('id')
      .required(),
  }).when('type', {
    is: 'product',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  conditional: Joi.object({
    columns: Joi.array().items(Joi.string().max(100)).min(1).max(10).required(),
    rows: Joi.array()
      .items(Joi.array().items(Joi.string().max(500)).min(1).max(10))
      .min(1)
      .max(5000)
      .required(),
  }),
  condition: Joi.object({
    questionId: id.required(),
    equals: Joi.string().max(500).required(),
  }),
});
const schema = Joi.object({
  id,
  name: Joi.string().trim().min(1).max(100).required(),
  status: Joi.string().valid('active', 'paused'),
  isArchived: Joi.boolean(),
  archivedAt: Joi.string().isoDate().allow(null),
  slug: text(80),
  revision: Joi.number().integer().min(1),
  submissionCount: Joi.number().integer().min(0),
  updatedAt: text(60),
  headline: text(100).required(),
  layout: Joi.string().valid('form', 'card').required(),
  language: Joi.string().valid('en', 'ar', 'ckb').required(),
  appearance: Joi.string().valid('light', 'dark').required(),
  description: text().required(),
  purpose: text().required(),
  banner: image.required(),
  logo: image.required(),
  consentRequired: Joi.boolean().required(),
  finalTitle: text(100).required(),
  finalDescription: text().required(),
  buttonText: text(100).required(),
  buttonUrl: url.required(),
  color: Joi.string()
    .max(WEBSITE_COLOR_MAX_LENGTH)
    .pattern(WEBSITE_COLOR_PATTERN),
  bannerEnabled: Joi.boolean(),
  bannerMode: Joi.string().valid('image', 'carousel'),
  bannerImages: Joi.array().items(image).max(6),
  logoEnabled: Joi.boolean(),
  slogan: text(200),
  displayTimeEstimate: Joi.boolean(),
  personalCardTitle: text(200),
  personalCardDescription: text(),
  actionsEnabled: Joi.boolean(),
  showHandCursor: Joi.boolean(),
  contentOrder: Joi.array().items(id).max(51).unique(),
  questions: Joi.array().items(question).min(1).max(50).required(),
  actions: Joi.array()
    .items(
      Joi.object({
        id: id.required(),
        type: Joi.string().valid('website', 'app', 'content').required(),
        text: text(100).required(),
        textKey: text(40),
        url: url.required(),
        appStoreUrl: url,
        googlePlayUrl: url,
        contentFormat: Joi.string().valid('pdf', 'image'),
      }),
    )
    .max(10),
  blocks: Joi.array()
    .items(
      Joi.object({
        id: id.required(),
        type: Joi.string()
          .valid(
            'text',
            'image',
            'carousel',
            'products',
            'testimonials',
            'steps',
            'about',
            'faq',
          )
          .required(),
        title: text(200).required(),
        text: text(10000).required(),
        images: Joi.array().items(image).max(6),
        products: Joi.array().items(entry).max(5),
        testimonials: Joi.array().items(entry).max(6),
        imageDescriptionsEnabled: Joi.boolean(),
        imageEnabled: Joi.boolean(),
        items: Joi.array()
          .items(
            Joi.object({
              id: id.required(),
              title: text(100).required(),
              text: text(2000).required(),
            }),
          )
          .max(5),
        textStyle: Joi.object({
          bold: Joi.boolean(),
          italic: Joi.boolean(),
          underline: Joi.boolean(),
          heading: Joi.number().valid(0, 1, 2, 3),
          align: Joi.string().valid('start', 'center', 'end', 'justify'),
          color: Joi.string().max(7).pattern(SOLID_HEX_COLOR_PATTERN).allow(''),
          marginTop: Joi.number().min(0).max(100),
          marginBottom: Joi.number().min(0).max(100),
        }),
      }),
    )
    .max(50)
    .required(),
});

export function validateDefinition(
  input: unknown,
  published: boolean,
): FormDraft {
  const normalized =
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    'name' in input &&
    typeof input.name === 'string'
      ? { ...input, name: input.name.trim() }
      : input;
  const result = schema.validate(normalized, {
    abortEarly: true,
    convert: false,
  });
  if (result.error || JSON.stringify(input).length > 2_000_000)
    throw new BadRequestException('Invalid form configuration');
  const form = result.value as FormDraft;
  const actions = form.actions ?? [];
  if (
    new Set(actions.map((action) => action.id)).size !== actions.length ||
    actions.some((action) => action.id === 'legacy')
  )
    throw new BadRequestException('Duplicate action');
  if (
    published &&
    form.actionsEnabled !== false &&
    actions.some(
      (action) =>
        !action.text.trim() ||
        !(action.type === 'app'
          ? action.appStoreUrl || action.googlePlayUrl
          : action.url),
    )
  )
    throw new BadRequestException(
      'Complete final-page buttons before publishing',
    );
  if (published && form.buttonText && !form.buttonUrl)
    throw new BadRequestException(
      'Complete final-page buttons before publishing',
    );
  const seen = new Map<string, FormDraft['questions'][number]>();
  for (const q of form.questions) {
    if (seen.has(q.id)) throw new BadRequestException('Duplicate question');
    if (
      q.condition &&
      (!seen
        .get(q.condition.questionId)
        ?.options.includes(q.condition.equals) ||
        seen.get(q.condition.questionId)?.type !== 'choice')
    )
      throw new BadRequestException('Invalid question condition');
    if (
      published &&
      (!q.label.trim() ||
        q.type === 'image' ||
        (q.type === 'choice' &&
          (q.options.length < 2 ||
            q.options.some((o) => !o.trim()) ||
            new Set(q.options.map((o) => o.trim().toLowerCase())).size !==
              q.options.length)) ||
        (q.type === 'conditional' && !q.conditional) ||
        (q.type === 'product' &&
          (!q.productSelection?.items.length ||
            q.productSelection.items.some(
              (item) => !item.name.trim() || item.unitPrice === null,
            ))))
    )
      throw new BadRequestException('Complete all questions before publishing');
    if (
      q.conditional &&
      q.conditional.rows.some(
        (row) =>
          row.length !== q.conditional!.columns.length ||
          row.some((v) => !v.trim()),
      )
    )
      throw new BadRequestException('Invalid conditional answers');
    seen.set(q.id, q);
  }
  if (
    new Set(form.blocks.map((b) => b.id)).size !== form.blocks.length ||
    form.blocks.some((b) => b.id === 'questions')
  )
    throw new BadRequestException('Duplicate component');
  if (
    form.contentOrder?.some(
      (key) => key !== 'questions' && !form.blocks.some((b) => b.id === key),
    )
  )
    throw new BadRequestException('Invalid section order');
  return form;
}

const submissionSchema = Joi.object({
  privacyVersion: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  durationMs: Joi.number().integer().min(0).max(86400000),
  requestId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
  revision: Joi.number().integer().min(1).required(),
  consent: Joi.boolean().required(),
  answers: Joi.object().pattern(id, text(4000)).max(50).required(),
  phoneCountryCodes: Joi.object()
    .pattern(id, Joi.string().pattern(/^[1-9][0-9]{0,3}$/))
    .max(50)
    .required(),
  tracking: Joi.object({
    visitorId: Joi.string().min(8).max(128).required(),
    sessionId: Joi.string().min(8).max(128).required(),
    pageUrl: url,
    referrer: url,
    ttclid: Joi.string().max(255),
    ttp: Joi.string().max(255),
  }).required(),
});
export type SubmissionRequest = FormSubmissionInput & {
  tracking: import('@linktree/types').FormSubmissionTracking;
};
export function validateSubmissionPayload(input: unknown): SubmissionRequest {
  const validated = submissionSchema.validate(input, { convert: false });
  if (validated.error) throw new BadRequestException('Invalid submission');
  return validated.value as SubmissionRequest;
}
export function validateSubmission(
  input: unknown,
  form: FormDraft,
): { input: SubmissionRequest; answers: FormSubmission['answers'] } {
  const data = validateSubmissionPayload(input);
  if (data.consent && data.privacyVersion !== PRIVACY_VERSION)
    throw new ConflictException('Privacy policy changed. Reload this form.');
  if (form.consentRequired && !data.consent)
    throw new BadRequestException('Privacy consent is required');
  const known = new Set(form.questions.map((q) => q.id));
  if (
    Object.keys(data.answers).some((key) => !known.has(key)) ||
    Object.keys(data.phoneCountryCodes).some((key) => !known.has(key))
  )
    throw new BadRequestException('Unknown question');
  const visible = new Set<string>();
  const answers: FormSubmission['answers'] = [];
  for (const q of form.questions) {
    if (
      q.condition &&
      (!visible.has(q.condition.questionId) ||
        data.answers[q.condition.questionId] !== q.condition.equals)
    )
      continue;
    visible.add(q.id);
    let value = (data.answers[q.id] ?? '').trim();
    if (q.type === 'product') {
      const products = priceProductAnswer(q, value);
      if (products.items.length)
        answers.push({
          questionId: q.id,
          label: q.label,
          value: productAnswerText(products),
          products,
        });
      continue;
    }
    if (q.required && !value)
      throw new BadRequestException('Complete required questions');
    if (!value) continue;
    if (
      q.type === 'email' &&
      Joi.string()
        .email({ tlds: { allow: false } })
        .validate(value).error
    )
      throw new BadRequestException('Invalid email');
    if (q.type === 'choice' && !q.options.includes(value))
      throw new BadRequestException('Invalid choice');
    if (q.type === 'conditional') {
      let selection: unknown;
      try {
        selection = JSON.parse(value);
      } catch {
        throw new BadRequestException('Invalid conditional answer');
      }
      if (
        !Array.isArray(selection) ||
        !selection.every((value) => typeof value === 'string') ||
        selection.some(
          (value, index) =>
            !!value && selection.slice(0, index).some((parent) => !parent),
        ) ||
        selection.length !== q.conditional?.columns.length ||
        !q.conditional.rows.some((row) =>
          row.every((v, i) => !selection[i] || selection[i] === v),
        ) ||
        (q.required && selection.some((v) => !v))
      )
        throw new BadRequestException('Invalid conditional answer');
    }
    if (q.type === 'phone') {
      const code = data.phoneCountryCodes[q.id] || '964';
      const compact = value.replace(/[\s()-]/g, '');
      // Accept pasted international numbers only when they match the chosen country.
      let digits = compact;
      if (compact.startsWith('+')) {
        if (!compact.startsWith(`+${code}`))
          throw new BadRequestException('Phone country does not match');
        digits = compact.slice(code.length + 1);
      } else if (code === '964') {
        digits = compact.replace(/^0/, '');
      }
      if (!/^\d{4,14}$/.test(digits) || code.length + digits.length > 15)
        throw new BadRequestException('Invalid phone number');
      value = `+${code}${digits}`;
    }
    if (
      q.type === 'date' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      throw new BadRequestException('Invalid date');
    if (
      q.labelKey === 'age' &&
      (!/^\d{1,3}$/.test(value) || Number(value) > 130)
    )
      throw new BadRequestException('Invalid age');
    answers.push({ questionId: q.id, label: q.label, value });
  }
  return { input: data, answers };
}
