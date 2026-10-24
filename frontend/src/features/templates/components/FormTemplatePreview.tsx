"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { createFormTemplateFixture } from "../form-template-fixture";
import type { FormLanguage } from "@/features/forms/types";
import { TemplatePhonePreview, TemplatePreviewSkeleton } from "./TemplatePhonePreview";

const FormPreview = dynamic(() => import("@/features/forms/components/FormPreview").then((module) => module.FormPreview), {
  loading: TemplatePreviewSkeleton,
});

/** Demonstrates the existing form renderer without saving or submitting data. */
export function FormTemplatePreview({ name, previewLabel, locale }: {
  name: string;
  previewLabel: string;
  locale: FormLanguage;
}) {
  const form = useMemo(() => createFormTemplateFixture(locale), [locale]);
  return <TemplatePhonePreview name={name} ariaLabel={`${name} ${previewLabel}`} darkTheme={form.appearance === "dark"}>
    {(isNear) => isNear ? <FormPreview form={form} placeholders language={locale} viewport="device" /> : <TemplatePreviewSkeleton />}
  </TemplatePhonePreview>;
}
