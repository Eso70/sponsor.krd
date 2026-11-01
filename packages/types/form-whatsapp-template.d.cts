export const FORM_WHATSAPP_TEMPLATE_LIMIT: number;
export const FORM_WHATSAPP_MESSAGE_LIMIT: number;
export const FORM_WHATSAPP_VARIABLES: readonly ["{{name}}", "{{details}}"];
export function validFormWhatsAppTemplate(value: unknown): value is string;
export function renderFormWhatsAppTemplate(
  template: string,
  values: { name: string; details: string },
): string;
