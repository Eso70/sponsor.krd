"use strict";

const FORM_WHATSAPP_TEMPLATE_LIMIT = 4000;
const FORM_WHATSAPP_MESSAGE_LIMIT = 10000;
const FORM_WHATSAPP_VARIABLES = ["{{name}}", "{{details}}"];

function validFormWhatsAppTemplate(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > FORM_WHATSAPP_TEMPLATE_LIMIT
  )
    return false;
  const remaining = value.replace(/\{\{(?:name|details)\}\}/g, "");
  return !remaining.includes("{{") && !remaining.includes("}}");
}

/** Replacement callbacks keep dollar signs and placeholder-like answers literal. */
function renderFormWhatsAppTemplate(template, values) {
  const tokens = /\{\{(name|details)\}\}/g;
  let output = "",
    position = 0;
  for (const match of template.matchAll(tokens)) {
    output += template
      .slice(position, match.index)
      .slice(0, FORM_WHATSAPP_MESSAGE_LIMIT - output.length);
    output += values[match[1]].slice(
      0,
      FORM_WHATSAPP_MESSAGE_LIMIT - output.length,
    );
    position = match.index + match[0].length;
    if (output.length === FORM_WHATSAPP_MESSAGE_LIMIT) break;
  }
  output += template
    .slice(position)
    .slice(0, FORM_WHATSAPP_MESSAGE_LIMIT - output.length);
  return output;
}

module.exports = {
  FORM_WHATSAPP_TEMPLATE_LIMIT,
  FORM_WHATSAPP_MESSAGE_LIMIT,
  FORM_WHATSAPP_VARIABLES,
  validFormWhatsAppTemplate,
  renderFormWhatsAppTemplate,
};
