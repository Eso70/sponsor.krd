"use client";
import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { createRuntimeId } from "@/lib/utils/random-id";
import type { FormContentBlock, FormImageEntry } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { formImageEntries } from "../form-image-entries";
import { isFormImage } from "../form-media";
import { FormEditorInput } from "./FormEditorInput";
import { FormImagePicker } from "./FormImagePicker";

export function FormImageSetEditor({
  block,
  onChange,
  copy,
  labels,
}: {
  block: FormContentBlock;
  onChange: (patch: Partial<FormContentBlock>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const testimonial = block.type === "testimonials";
  const max = testimonial ? 6 : 5;
  const entryKey = testimonial ? "testimonials" : "products";
  const entryLabel = testimonial ? labels.customer : labels.product;
  const showDetails = !testimonial || block.imageDescriptionsEnabled !== false;
  const products = formImageEntries(block);
  const [selected, setSelected] = useState(products[0]?.id ?? "");
  const active =
    products.find((product) => product.id === selected) ?? products[0];
  const update = (patch: Partial<FormImageEntry>) => {
    if (active)
      onChange({
        [entryKey]: products.map((product) =>
          product.id === active.id ? { ...product, ...patch } : product,
        ),
      });
  };
  return (
    <div className="space-y-4">
      <FormEditorInput
        label={copy.headline}
        value={block.title}
        placeholder={
          testimonial ? labels.customerTestimonials : labels.productOfferings
        }
        maxLength={30}
        showCount
        onChange={(title) => onChange({ title })}
      />
      <FormEditorInput
        label={copy.descriptionLabel}
        value={block.text}
        placeholder={
          testimonial
            ? labels.testimonialsDescriptionHint
            : labels.productsDescriptionHint
        }
        maxLength={50}
        showCount
        multiline
        hint={labels.optional}
        onChange={(text) => onChange({ text })}
      />
      <div className="space-y-2">
        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {labels.imageSet}{" "}
          <span className="font-normal text-slate-400">
            ({products.filter((product) => isFormImage(product.image)).length}/
            {max})
          </span>
        </p>
        {testimonial && (
          <div className="flex items-center gap-2">
            <VisibilitySwitch
              compact
              checked={showDetails}
              onChange={(imageDescriptionsEnabled) =>
                onChange({ imageDescriptionsEnabled })
              }
              label={labels.imageDescriptions}
            />
            <span className="text-[13px] font-semibold">
              {labels.imageDescriptions}
            </span>
          </div>
        )}
        <div
          role="group"
          aria-label={labels.imageSet}
          className="flex flex-wrap gap-2"
        >
          {Array.from({ length: max }, (_, index) => {
            const product = products[index];
            return (
              <button
                key={product?.id ?? index}
                type="button"
                disabled={!product && index !== products.length}
                aria-label={`${entryLabel} ${index + 1}`}
                aria-pressed={!!product && active?.id === product.id}
                onClick={() => {
                  if (product) setSelected(product.id);
                  else {
                    const id = createRuntimeId();
                    onChange({
                      [entryKey]: [
                        ...products,
                        { id, image: "", title: "", description: "" },
                      ],
                    });
                    setSelected(id);
                  }
                }}
                className={`relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition disabled:cursor-default disabled:opacity-40 ${product?.id === active?.id ? "theme-soft border-[var(--theme-primary)]" : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.03] dark:hover:bg-white/10"}`}
              >
                {product ? (
                  <>
                    <span className="absolute start-1 top-1 z-10 rounded bg-slate-950/60 px-1 text-[10px] text-white">
                      {index + 1}
                    </span>
                    {isFormImage(product.image) ? (
                      <Image
                        unoptimized
                        src={product.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <ImageIcon
                        aria-hidden
                        className="size-5 text-slate-400"
                      />
                    )}
                  </>
                ) : index === products.length ? (
                  <Plus aria-hidden className="size-5 text-slate-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {active && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold">
              {entryLabel} {products.indexOf(active) + 1}
            </h4>
            <IconActionButton
              label={`${copy.remove} ${entryLabel} ${products.indexOf(active) + 1}`}
              tone="danger"
              disabled={products.length <= 2}
              onClick={() => {
                const next = products.filter(
                  (product) => product.id !== active.id,
                );
                onChange({ [entryKey]: next });
                setSelected(next[0]?.id ?? "");
              }}
            >
              <Trash2 aria-hidden className="size-4" />
            </IconActionButton>
          </div>
          <FormImagePicker
            key={active.id}
            variant="component"
            labels={labels}
            label={`${labels.image} ${products.indexOf(active) + 1}`}
            images={active.image ? [active.image] : []}
            onChange={(images) => update({ image: images[0] ?? "" })}
            copy={copy}
            hint={
              testimonial
                ? labels.testimonialImageHint
                : labels.productImageHint
            }
          />
          {showDetails && (
            <>
              <FormEditorInput
                label={
                  testimonial
                    ? labels.testimonialHeadline
                    : labels.productHeadline
                }
                value={active.title}
                placeholder={
                  testimonial
                    ? labels.testimonialHeadlineHint
                    : labels.productHeadlineHint
                }
                maxLength={30}
                showCount
                onChange={(title) => update({ title })}
              />
              <FormEditorInput
                label={
                  testimonial
                    ? labels.testimonialDescription
                    : labels.productDescription
                }
                value={active.description}
                placeholder={
                  testimonial
                    ? labels.testimonialTextHint
                    : labels.productBenefitsHint
                }
                maxLength={100}
                showCount
                multiline
                onChange={(description) => update({ description })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
