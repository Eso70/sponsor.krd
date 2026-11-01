"use strict";
const {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  validatePhoneNumberLength,
  parseDigits,
} = require("libphonenumber-js/max");
const { Metadata } = require("libphonenumber-js/core");
const metadata = require("libphonenumber-js/max/metadata");
const entryStartsByCode = new Map();
const NUMBER_TYPES = [
  "FIXED_LINE",
  "MOBILE",
  "PREMIUM_RATE",
  "TOLL_FREE",
  "SHARED_COST",
  "VOIP",
  "PERSONAL_NUMBER",
  "PAGER",
  "UAN",
  "VOICEMAIL",
];
// Numbering patterns contain digit atoms, groups, alternatives and quantifiers.
// Allow an atom to match end-of-input so a single starting digit can be checked
// without inventing the rest of the phone number. Keep quantifiers intact.
function incompletePattern(pattern) {
  return new RegExp(
    `^(?:${pattern.replace(/\[[^\]]+\]|\\d|\{\d+(?:,\d*)?\}|[0-9]/g, (atom) =>
      atom.startsWith("{") ? atom : `(?:${atom}|$)`,
    )})$`,
  );
}
function phoneNumberHasAllowedStart(value, selectedCode) {
  if (!/^\d*$/.test(value) || !/^[1-9]\d{0,3}$/.test(selectedCode))
    return false;
  if (!value) return true;
  if (selectedCode === "964") return /^(?:7\d*|0(?:7\d*)?)$/.test(value);
  let allowed = entryStartsByCode.get(selectedCode);
  if (!allowed) {
    const callingCode = Object.keys(metadata.country_calling_codes)
      .filter((code) => selectedCode.startsWith(code))
      .sort((a, b) => b.length - a.length)[0];
    if (!callingCode) return false;
    const suffix = selectedCode.slice(callingCode.length);
    allowed = new Set();
    for (const region of metadata.country_calling_codes[callingCode]) {
      const plan = new Metadata(metadata).selectNumberingPlan(region);
      const patterns = NUMBER_TYPES.map((type) =>
        plan.type(type)?.pattern(),
      ).filter(Boolean);
      const national = incompletePattern(
        patterns.length ? patterns.join("|") : plan.nationalNumberPattern(),
      );
      const prefix = plan.nationalPrefixForParsing();
      const domestic = prefix && !suffix ? incompletePattern(prefix) : null;
      for (const digit of "0123456789") {
        if (national.test(suffix + digit) || domestic?.test(digit))
          allowed.add(digit);
      }
    }
    entryStartsByCode.set(selectedCode, allowed);
  }
  return allowed.has(value[0]);
}
const countriesByCode = new Map();
for (const country of getCountries()) {
  const code = getCountryCallingCode(country);
  const countries = countriesByCode.get(code) || [];
  countries.push(country);
  countriesByCode.set(code, countries);
}
const invalid = (reason = "invalid") => ({
  valid: false,
  number: null,
  reason,
});
function lengthReason(results) {
  if (results.length && results.every((result) => result === "TOO_SHORT"))
    return "too_short";
  if (results.length && results.every((result) => result === "TOO_LONG"))
    return "too_long";
  return "invalid";
}
/** Exact country metadata shared by browser and server. No external lookup or number transmission. */
function inspectPhoneNumber(value, selectedCode) {
  if (
    typeof value !== "string" ||
    typeof selectedCode !== "string" ||
    !/^[1-9]\d{0,3}$/.test(selectedCode)
  )
    return invalid();
  const raw = value.trim();
  if (!raw) return invalid("empty");
  if (!/^\+?[0-9٠-٩۰-۹\s().-]+$/.test(raw)) return invalid();
  const digits = parseDigits(raw);
  const international = raw.startsWith("+") || raw.startsWith("00");
  const internationalDigits = raw.startsWith("00") ? digits.slice(2) : digits;
  if (international && !internationalDigits.startsWith(selectedCode))
    return invalid("country_mismatch");
  // This form's Iraqi contact field is for mobile numbers: ten significant
  // digits beginning with 7. The domestic 0 is a trunk prefix, not a digit
  // in the stored E.164 national number (CMC/ITU numbering plan).
  if (selectedCode === "964") {
    const national = international
      ? internationalDigits.slice(3)
      : digits.replace(/^0/, "");
    if (national.length < 10) return invalid("too_short");
    if (national.length > 10) return invalid("too_long");
    if (!/^7\d{9}$/.test(national)) return invalid();
    const phone = parsePhoneNumberFromString(`+964${national}`, {
      extract: false,
    });
    return phone?.isValid()
      ? { valid: true, number: phone.number, reason: null }
      : invalid();
  }
  const regions = countriesByCode.get(selectedCode) || [];
  const candidates = international
    ? [
        parsePhoneNumberFromString(`+${internationalDigits}`, {
          extract: false,
        }),
      ]
    : regions.length
      ? regions.map((defaultCountry) =>
          parsePhoneNumberFromString(raw, { defaultCountry, extract: false }),
        )
      : [
          parsePhoneNumberFromString(`+${selectedCode}${digits}`, {
            extract: false,
          }),
        ];
  for (const phone of candidates) {
    if (phone?.isValid() && phone.number.startsWith(`+${selectedCode}`))
      return { valid: true, number: phone.number, reason: null };
  }
  const lengths = international
    ? [validatePhoneNumberLength(`+${internationalDigits}`)]
    : regions.length
      ? regions.map((country) => validatePhoneNumberLength(raw, country))
      : [validatePhoneNumberLength(`+${selectedCode}${digits}`)];
  return invalid(lengthReason(lengths));
}
function normalizePhoneNumber(value, selectedCode) {
  return inspectPhoneNumber(value, selectedCode).number;
}
/** Read a saved international contact without guessing its country. */
function normalizeInternationalPhoneNumber(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!/^\+?[0-9٠-٩۰-۹\s().-]+$/.test(raw)) return null;
  const digits = parseDigits(raw);
  if (!raw.startsWith("+") && !digits.startsWith("00")) return null;
  const phone = parsePhoneNumberFromString(
    `+${digits.startsWith("00") ? digits.slice(2) : digits}`,
    { extract: false },
  );
  return phone?.isValid() ? phone.number : null;
}
module.exports = {
  inspectPhoneNumber,
  normalizePhoneNumber,
  phoneNumberHasAllowedStart,
  normalizeInternationalPhoneNumber,
};
