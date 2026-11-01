"use strict";

const FORM_WHATSAPP_DETAILS_ORDERS = [
  "form",
  "products_first",
  "answers_first",
];
const FORM_WHATSAPP_DETAILS_STYLES = ["compact", "spaced", "bullets"];
const keys = [
  "order",
  "style",
  "heading",
  "namePrefix",
  "totalLabel",
  "showLabels",
];
const line = (value, max) =>
  typeof value === "string" &&
  value.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(value) &&
  !value.includes("{{") &&
  !value.includes("}}");

function validFormWhatsAppDetails(value) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)) &&
    Object.keys(value).every(
      (key) => keys.includes(key) || key === "productLayout",
    ) &&
    (value.productLayout === undefined ||
      ["columns", "calculation"].includes(value.productLayout)) &&
    FORM_WHATSAPP_DETAILS_ORDERS.includes(value.order) &&
    FORM_WHATSAPP_DETAILS_STYLES.includes(value.style) &&
    line(value.heading, 160) &&
    line(value.namePrefix, 80) &&
    line(value.totalLabel, 80) &&
    !!value.totalLabel.trim() &&
    typeof value.showLabels === "boolean"
  );
}
module.exports = {
  FORM_WHATSAPP_DETAILS_ORDERS,
  FORM_WHATSAPP_DETAILS_STYLES,
  validFormWhatsAppDetails,
};
