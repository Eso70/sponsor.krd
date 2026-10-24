import { describe, it, expect } from "vitest";
import { pageActionCopy } from "./page-action-copy";
import { formsCopy } from "@/features/forms/forms-copy";
import { businessMessages } from "@/features/business/i18n/messages";
import { KURDISH_LINKTREE_LIST_COPY } from "@/features/link-editor/components/linktree-list-copy";
import { englishEditorCopy } from "@/features/link-editor/english-editor-copy";
import { arabicEditorCopy, englishPatternCopy, englishTemplatePickerCopy, englishIconPickerCopy, englishCountrySelectorCopy, arabicPatternCopy, arabicTemplatePickerCopy, arabicIconPickerCopy, arabicCountrySelectorCopy } from "@/features/link-editor/editor-copy";

describe("consistent Form and Linktree management wording", () => {
  it.each(["en", "ar", "ckb"] as const)(
    "uses one action vocabulary in both dashboards in %s",
    (locale) => {
      const actions = pageActionCopy(locale);
      const form = formsCopy(locale);
      const messages = businessMessages[locale];
      for (const key of [
        "create",
        "save",
        "saving",
        "edit",
        "remove",
        "open",
        "preview",
        "cancel",
        "close",
        "back",
        "next",
        "pause",
        "resume",
        "archive",
        "restore",
        "duplicate",
        "active",
        "paused",
        "archived",
      ] as const)
        expect(form[key]).toBe(actions[key]);
      for (const list of [
        messages.LinktreeList,
        ...(locale === "ckb" ? [KURDISH_LINKTREE_LIST_COPY] : []),
      ]) {
        expect(list.duplicate).toBe(actions.duplicate);
        expect(list.deactivate).toBe(actions.pause);
        expect(list.activate).toBe(actions.resume);
        expect(list.archive).toBe(actions.archive);
        expect(list.restore).toBe(actions.restore);
        expect(list.edit).toBe(actions.edit);
        expect(list.delete).toBe(actions.remove);
        expect(list.view).toBe(actions.open);
        expect(list.active).toBe(actions.active);
        expect(list.inactive).toBe(actions.paused);
        expect(list.archived).toBe(actions.archived);
      }
      expect(messages.Linktrees.create).toBe(actions.create);
      for (const key of [
        "search",
        "refresh",
        "clearSearch",
        "gridView",
        "tableView",
      ] as const) {
        expect(form[key]).toBe(actions[key]);
        expect(messages.Linktrees[key]).toBe(actions[key]);
      }
      expect(messages.Linktrees.activePages).toBe(actions.active);
      expect(messages.Linktrees.archivedPages).toBe(actions.archived);
      expect(messages.DuplicateLinktree.title).toBe(actions.duplicateTitle);
      expect(messages.DuplicateLinktree.duplicate).toBe(actions.duplicate);
      expect(messages.DuplicateLinktree.duplicating).toBe(actions.duplicating);
      expect(messages.DuplicateLinktree.cancel).toBe(actions.cancel);
      expect(messages.DuplicateLinktree.duplicated).toBe(actions.duplicated);
    if (locale !== "ckb") for (const picker of locale === "en" ? [englishPatternCopy, englishTemplatePickerCopy, englishIconPickerCopy, englishCountrySelectorCopy] : [arabicPatternCopy, arabicTemplatePickerCopy, arabicIconPickerCopy, arabicCountrySelectorCopy]) expect(picker.close).toBe(actions.close);
      if (locale !== "ckb")
        for (const key of [
          "save",
          "saving",
          "create",
          "cancel",
          "close",
          "back",
          "next",
        ] as const)
          expect(
            (locale === "en" ? englishEditorCopy : arabicEditorCopy)[key],
          ).toBe(actions[key]);
    },
  );
});
