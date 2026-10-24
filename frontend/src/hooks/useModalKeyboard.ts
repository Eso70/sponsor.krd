"use client";

import { useEffect, useId, type RefObject } from "react";

const modalKeyboardStack: string[] = [];
const focusReturnTargets = new WeakMap<HTMLElement, HTMLElement | null>();

function connectedFocusTarget(target: HTMLElement | null): HTMLElement | null {
  const visited = new Set<HTMLElement>();
  while (target && !target.isConnected && !visited.has(target)) {
    visited.add(target);
    const owner = target.closest<HTMLElement>('[role="dialog"]');
    target = owner ? (focusReturnTargets.get(owner) ?? null) : null;
  }
  return target?.isConnected ? target : null;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hidden &&
      !element.closest("[hidden]") &&
      !element.closest('[aria-hidden="true"]') &&
      !element.closest("[inert]"),
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!target || !("nodeType" in target) || target.nodeType !== 1) return false;
  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  const tagName = element.tagName.toLowerCase();
  if (tagName === "textarea" || tagName === "select") return true;
  if (element.closest("button,a,[data-modal-enter-ignore]")) return true;
  return false;
}

interface UseModalKeyboardOptions {
  isOpen: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  enterEnabled?: boolean;
  escapeEnabled?: boolean;
  /** Enables dialog focus entry, trapping, and restoration for this container. */
  dialogRef?: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useModalKeyboard({
  isOpen,
  onEscape,
  onEnter,
  enterEnabled = true,
  escapeEnabled = true,
  dialogRef,
  initialFocusRef,
}: UseModalKeyboardOptions) {
  const id = useId();

  useEffect(() => {
    if (!isOpen) return;
    modalKeyboardStack.push(id);
    return () => {
      const index = modalKeyboardStack.lastIndexOf(id);
      if (index !== -1) modalKeyboardStack.splice(index, 1);
    };
  }, [id, isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const ownerDocument = dialog.ownerDocument;
    const previouslyFocused = ownerDocument.activeElement?.nodeType === 1
      ? ownerDocument.activeElement as HTMLElement : null;
    focusReturnTargets.set(dialog, previouslyFocused);

    const focusTarget = initialFocusRef?.current || dialog;
    // A panel may still be translated offscreen during its entrance. Default
    // focus scrolling can shift its overlay and hide the entire slide animation.
    focusTarget.focus({ preventScroll: true });

    return () => {
      const active = ownerDocument.activeElement;
      // An older overlay may finish exiting beneath a newer one. Never steal
      // that overlay's focus; if its opener disappeared, follow the return chain.
      if (
        !active ||
        active === ownerDocument.body ||
        !active.isConnected ||
        dialog.contains(active)
      ) {
        connectedFocusTarget(previouslyFocused)?.focus({ preventScroll: true });
      }
    };
  }, [dialogRef, initialFocusRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const ownerDocument = dialogRef?.current?.ownerDocument ?? initialFocusRef?.current?.ownerDocument ?? document;

    const handleKeyDown = (event: KeyboardEvent) => {
      const topmostId = modalKeyboardStack[modalKeyboardStack.length - 1];
      if (topmostId !== id) return;

      if (event.key === "Tab" && dialogRef?.current) {
        const dialog = dialogRef.current;
        const focusable = getFocusableElements(dialog);
        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = ownerDocument.activeElement;
        if (!dialog.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }
        if (event.shiftKey && (active === first || active === dialog)) {
          event.preventDefault();
          last.focus();
          return;
        }
        if (!event.shiftKey && (active === last || active === dialog)) {
          event.preventDefault();
          first.focus();
          return;
        }
      }

      if (event.key === "Escape" && escapeEnabled && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      if (
        event.key === "Enter" &&
        enterEnabled &&
        onEnter &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        event.stopPropagation();
        onEnter();
      }
    };

    ownerDocument.addEventListener("keydown", handleKeyDown, true);
    return () => ownerDocument.removeEventListener("keydown", handleKeyDown, true);
  }, [dialogRef, initialFocusRef, enterEnabled, escapeEnabled, id, isOpen, onEnter, onEscape]);
}
