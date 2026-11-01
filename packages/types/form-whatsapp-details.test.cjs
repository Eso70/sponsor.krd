const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validFormWhatsAppDetails } = require("./form-whatsapp-details.cjs");
const config = {
  order: "form",
  style: "compact",
  heading: "Order",
  namePrefix: "Customer:",
  totalLabel: "Total",
  showLabels: true,
};
test("presentation settings accept only the allowed fields and bounded plain captions", () => {
  assert.equal(validFormWhatsAppDetails(config), true);
  assert.equal(
    validFormWhatsAppDetails({ ...config, productLayout: "columns" }),
    true,
  );
  assert.equal(
    validFormWhatsAppDetails({
      ...config,
      heading: "",
      namePrefix: "",
      order: "products_first",
      style: "spaced",
      showLabels: false,
    }),
    true,
  );
  for (const value of [
    null,
    [],
    {},
    { ...config, price: 1 },
    { ...config, order: "custom" },
    { ...config, style: "html" },
    { ...config, productLayout: "html" },
    { ...config, totalLabel: " " },
    { ...config, heading: "{{name}}" },
    { ...config, namePrefix: "a\nb" },
    { ...config, heading: "a".repeat(161) },
    { ...config, showLabels: "true" },
  ])
    assert.equal(validFormWhatsAppDetails(value), false);
});
