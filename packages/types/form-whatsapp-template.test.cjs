const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  validFormWhatsAppTemplate,
  renderFormWhatsAppTemplate,
  FORM_WHATSAPP_MESSAGE_LIMIT,
} = require("./form-whatsapp-template.cjs");

test("only known, complete placeholders and bounded nonempty text are accepted", () => {
  for (const value of [
    "Hello {{name}}\n{{details}}",
    "Plain confirmation",
    "سڵاو {{name}}",
    "مرحبًا {{name}}",
  ])
    assert.equal(validFormWhatsAppTemplate(value), true);
  for (const value of [
    null,
    {},
    " ",
    "x".repeat(4001),
    "{{unknown}}",
    "{{name}",
    "name}}",
  ])
    assert.equal(validFormWhatsAppTemplate(value), false);
});
test("answers containing dollar signs or placeholders stay literal", () => {
  assert.equal(
    renderFormWhatsAppTemplate("Hi {{name}}\n{{details}}", {
      name: "$& {{details}}",
      details: "{{name}} requested a box",
    }),
    "Hi $& {{details}}\n{{name}} requested a box",
  );
});
test("repeated placeholders cannot create unbounded messages", () => {
  const message = renderFormWhatsAppTemplate("{{details}}".repeat(300), {
    name: "Name",
    details: "a".repeat(5000),
  });
  assert.equal(message.length, FORM_WHATSAPP_MESSAGE_LIMIT);
});
