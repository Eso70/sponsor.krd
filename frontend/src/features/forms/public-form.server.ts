import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { PublicFormPayload } from "@linktree/types";
import {
  publicRequestContext,
  publicFetch,
} from "@/lib/public/public-page.server";
export const fetchPublicForm = cache(async (slug: string) => {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) notFound();
  const context = await publicRequestContext();
  const response = await publicFetch(
    `/api/public/forms/${encodeURIComponent(slug)}`,
  );
  if ([403, 404, 410].includes(response.status)) notFound();
  if (!response.ok) throw new Error("Form temporarily unavailable");
  const body = (await response.json()) as { data: PublicFormPayload };
  return { ...body.data, origin: context.origin };
});
