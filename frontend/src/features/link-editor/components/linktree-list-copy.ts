import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";
/** Labels for the shared page list. Platform callers keep the Kurdish defaults. */
export const KURDISH_LINKTREE_LIST_COPY = {
  
  copied: "کۆپیکرا",
  copyLink: "کۆپیکردنی بەستەر",
  linkCopied: "بەستەرەکە کۆپی کرا",
  linkCopyFailed: "کۆپیکردنی بەستەر سەرکەوتوو نەبوو",
  created: "دروستکراوە",
  updated: "نوێکراوە",
  edit: pageActionCopy("ckb").edit,
  editTable: pageActionCopy("ckb").edit,
  duplicate: pageActionCopy("ckb").duplicate,
  restore: pageActionCopy("ckb").restore,
  archive: pageActionCopy("ckb").archive,
  activate: pageActionCopy("ckb").resume,
  deactivate: pageActionCopy("ckb").pause,
  delete: pageActionCopy("ckb").remove,
  view: pageActionCopy("ckb").open,
  viewButton: pageActionCopy("ckb").open,
  moreActions: "کردارە زیاترەکان",
  hideActions: "شاردنەوەی کردارەکان",
  image: "وێنە",
  name: "ناو",
  subtitle: "ناونیشانی کورت",
  link: "بەستەر",
  actions: "کارەکان",
  
  
  
  active: pageActionCopy("ckb").active,
  defaultPage: "بنەڕەت",
  defaultPageHint: "پەیجی بنەڕەتی بزنسەکە",
  inactive: pageActionCopy("ckb").paused,
  inactiveHint: "پەڕەکە بۆ سەردانکەران بەردەست نییە",
  whatsapp: "واتساپ",
  whatsappHint: "مۆداڵی واتساپ چالاکە لەم پەڕەیە",
  template: "قالبی",
  archived: pageActionCopy("ckb").archived,
  archivedHint: "ئەم پەیجە ئەرشیفکراوە",
  newAge: "نوێ",
  growingAge: "لە گەشەدا",
  oldAge: "کۆن",
  newAgeHint: "کەمتر لە ٧ ڕۆژ لەمەوبەر دروستکراوە",
  growingAgeHint: "لە نێوان ٧ و ٣٠ ڕۆژ دروستکراوە",
  oldAgeHint: "زیاتر لە ٣٠ ڕۆژە دروستکراوە",
} as const;

export type LinktreeListCopy = {
  [Key in keyof typeof KURDISH_LINKTREE_LIST_COPY]: string;
} & {
  loadingCards?: string;
  loadingTable?: string;
  paginationOf?: string;
  paginationPrevious?: string;
  paginationNext?: string;
};
