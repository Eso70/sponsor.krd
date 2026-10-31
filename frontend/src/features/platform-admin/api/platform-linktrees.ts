import type { LinktreeEditorSubmitData } from "@/features/link-editor/editor-types";
import { buildLinktreePayload } from "@/features/link-editor/linktree-mutations";

/** Converts editor state to the exact backend CreateLinktreeDto boundary. */
export function buildPlatformLinktreePayload(data: LinktreeEditorSubmitData) {
  return buildLinktreePayload(data, { scope: "platform" });
}
