const COPY = {
  en: {
    deletePages: "Delete pages",
    deleteForms: "Delete forms",
    deletePagesQuestion:
      "Delete the selected pages and their associated data? This cannot be undone. Default pages are protected and will remain.",
    deleteFormsQuestion:
      "Delete the selected forms, submitted answers and contact details? This cannot be undone.",
    deleteSuccess: "Selected pages deleted",
    deleteFormsSuccess: "Selected forms deleted",
    deleteFailed:
      "Could not delete all selected pages. Any failed pages remain selected for retry.",
    deleteFormsFailed:
      "Could not delete all selected forms. Any failed forms remain selected for retry.",
    selectForm: "Select form",
    formQuestion:
      "Delete analytics for the selected forms? This cannot be undone. Forms, submitted answers and contact details will remain.",
    select: "Select page",
    selected: "selected",
    all: "Select all",
    none: "Deselect all",
    remove: "Delete analytics",
    question:
      "Delete analytics for the selected pages? This cannot be undone. The pages and links will remain.",
    cancel: "Cancel",
    close: "Close",
    busy: "Deleting…",
    failed: "Could not delete all selected analytics. Try again.",
    success: "Selected analytics deleted",
  },
  ar: {
    deletePages: "حذف الصفحات",
    deleteForms: "حذف النماذج",
    deletePagesQuestion:
      "حذف الصفحات المحددة والبيانات المرتبطة بها؟ لا يمكن التراجع. ستبقى الصفحات الافتراضية محمية.",
    deleteFormsQuestion:
      "حذف النماذج المحددة والإجابات وبيانات الاتصال؟ لا يمكن التراجع عن ذلك.",
    deleteSuccess: "تم حذف الصفحات المحددة",
    deleteFormsSuccess: "تم حذف النماذج المحددة",
    deleteFailed:
      "تعذر حذف بعض الصفحات. تبقى الصفحات التي لم تُحذف محددة للمحاولة مجدداً.",
    deleteFormsFailed:
      "تعذر حذف بعض النماذج. تبقى النماذج التي لم تُحذف محددة للمحاولة مجدداً.",
    selectForm: "تحديد النموذج",
    formQuestion:
      "حذف إحصاءات النماذج المحددة؟ لا يمكن التراجع عن ذلك. ستبقى النماذج والإجابات وبيانات الاتصال.",
    select: "تحديد الصفحة",
    selected: "محددة",
    all: "تحديد الكل",
    none: "إلغاء تحديد الكل",
    remove: "حذف الإحصاءات",
    question:
      "حذف إحصاءات الصفحات المحددة؟ لا يمكن التراجع عن ذلك. ستبقى الصفحات والروابط.",
    cancel: "إلغاء",
    close: "إغلاق",
    busy: "جارٍ الحذف…",
    failed: "تعذر حذف بعض الإحصاءات المحددة. حاول مجدداً.",
    success: "تم حذف الإحصاءات المحددة",
  },
  ckb: {
    deletePages: "سڕینەوەی پەڕەکان",
    deleteForms: "سڕینەوەی فۆڕمەکان",
    deletePagesQuestion:
      "پەڕە هەڵبژێردراوەکان و داتاکانیان بسڕدرێنەوە؟ ئەمە ناگەڕێتەوە. پەڕە پێشگریمانەکان پارێزراون و دەمێننەوە.",
    deleteFormsQuestion:
      "فۆڕمە هەڵبژێردراوەکان و وەڵام و زانیاریی پەیوەندییەکان بسڕدرێنەوە؟ ئەمە ناگەڕێتەوە.",
    deleteSuccess: "پەڕە هەڵبژێردراوەکان سڕانەوە",
    deleteFormsSuccess: "فۆڕمە هەڵبژێردراوەکان سڕانەوە",
    deleteFailed:
      "هەندێک پەڕە نەسڕایەوە. بۆ دووبارە هەوڵدان هەڵبژێردراو دەمێننەوە.",
    deleteFormsFailed:
      "هەندێک فۆڕم نەسڕایەوە. بۆ دووبارە هەوڵدان هەڵبژێردراو دەمێننەوە.",
    selectForm: "هەڵبژاردنی فۆڕم",
    formQuestion:
      "ئاماری فۆڕمە هەڵبژێردراوەکان بسڕدرێتەوە؟ ئەمە ناگەڕێتەوە. فۆڕم و وەڵام و زانیاریی پەیوەندییەکان دەمێننەوە.",
    select: "هەڵبژاردنی پەڕە",
    selected: "هەڵبژێردراو",
    all: "هەڵبژاردنی هەموو",
    none: "لابردنی هەموو هەڵبژاردنەکان",
    remove: "سڕینەوەی ئامار",
    question:
      "ئاماری پەڕە هەڵبژێردراوەکان بسڕدرێتەوە؟ ئەمە ناگەڕێتەوە. پەڕە و بەستەرەکان دەمێننەوە.",
    cancel: "پاشگەزبوونەوە",
    close: "داخستن",
    busy: "دەسڕێتەوە…",
    failed: "هەندێک ئامار نەسڕایەوە. دووبارە هەوڵ بدەرەوە.",
    success: "ئاماری هەڵبژێردراو سڕایەوە",
  },
};
export function pageSelectionCopy(locale: "en" | "ar" | "ckb") {
  return COPY[locale];
}
