"use client";

import { useMemo } from "react";
import { createLinktreeMutations, type LinktreeMutationScope } from "./linktree-mutations";

export { LINKTREE_APPROVAL_COPY } from "./linktree-mutations";

export function useLinktreeMutations(scope: LinktreeMutationScope) {
  return useMemo(() => createLinktreeMutations(scope), [scope]);
}
