"use strict";
const MAX_PRODUCT_QUANTITY = 100000;
const MAX_PRODUCT_PRICE = 10000000;
const MAX_PRODUCT_PRICE_BREAKS = 10;
function validProductPrice(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_PRODUCT_PRICE &&
    Math.abs(Math.round(value * 100) - value * 100) < 0.000001
  );
}
function validProductQuantity(value) {
  return (
    typeof value === "string" &&
    (value === "" ||
      (/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(value) &&
        Number(value) <= MAX_PRODUCT_QUANTITY))
  );
}
function validProductPriceBreaks(basePrice, breaks) {
  if (breaks === undefined) return true;
  if (!Array.isArray(breaks) || breaks.length > MAX_PRODUCT_PRICE_BREAKS)
    return false;
  if (!breaks.length) return true;
  if (!validProductPrice(basePrice)) return false;
  let previousMinimum = 0;
  let previousPrice = basePrice;
  for (const tier of breaks) {
    if (
      !tier ||
      typeof tier !== "object" ||
      !Number.isFinite(tier.minimumQuantity) ||
      tier.minimumQuantity <= previousMinimum ||
      tier.minimumQuantity > MAX_PRODUCT_QUANTITY ||
      Math.abs(
        Math.round(tier.minimumQuantity * 1000) - tier.minimumQuantity * 1000,
      ) > 0.000001 ||
      !validProductPrice(tier.unitPrice) ||
      tier.unitPrice > previousPrice
    )
      return false;
    previousMinimum = tier.minimumQuantity;
    previousPrice = tier.unitPrice;
  }
  return true;
}
function productLineTotal(unitPrice, quantity) {
  if (!validProductPrice(unitPrice) || !validProductQuantity(quantity))
    return 0;
  return (
    Number(
      (BigInt(Math.round(unitPrice * 100)) *
        BigInt(Math.round(Number(quantity) * 1000)) +
        500n) /
        1000n,
    ) / 100
  );
}
function priceProductLine(item, quantity) {
  if (
    !validProductPrice(item.unitPrice) ||
    !validProductPriceBreaks(item.unitPrice, item.priceBreaks) ||
    !validProductQuantity(quantity)
  )
    throw new Error("Invalid product pricing");
  const count = Number(quantity || 0);
  let unitPrice = item.unitPrice;
  let priceBreakMinimum;
  for (const tier of item.priceBreaks || []) {
    if (count > 0 && count >= tier.minimumQuantity) {
      unitPrice = tier.unitPrice;
      priceBreakMinimum = tier.minimumQuantity;
    }
  }
  const lineTotal = productLineTotal(unitPrice, quantity);
  const baseTotal = productLineTotal(item.unitPrice, quantity);
  return {
    unitPrice,
    lineTotal,
    baseUnitPrice: item.unitPrice,
    baseTotal,
    discount: Math.max(0, Math.round((baseTotal - lineTotal) * 100) / 100),
    ...(priceBreakMinimum === undefined ? {} : { priceBreakMinimum }),
  };
}
module.exports = {
  MAX_PRODUCT_QUANTITY,
  MAX_PRODUCT_PRICE,
  MAX_PRODUCT_PRICE_BREAKS,
  validProductPrice,
  validProductQuantity,
  validProductPriceBreaks,
  productLineTotal,
  priceProductLine,
};
