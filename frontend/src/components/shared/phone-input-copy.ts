export function phoneInputCopy(language: string) {
  return language === "ar"
    ? {
        too_short: "رقم الهاتف أقصر من المطلوب.",
        too_long: "رقم الهاتف أطول من المطلوب.",
        invalid: "أدخل رقم هاتف صالحًا للبلد المحدد.",
      }
    : language === "ckb"
      ? {
          too_short: "ژمارەی تەلەفۆن کورتترە لە پێویست.",
          too_long: "ژمارەی تەلەفۆن درێژترە لە پێویست.",
          invalid: "ژمارەیەکی دروستی وڵاتە هەڵبژێردراوەکە بنووسە.",
        }
      : {
          too_short: "Phone number is too short.",
          too_long: "Phone number is too long.",
          invalid: "Enter a valid phone number for the selected country.",
        };
}
