import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { formImageEntries } from "../form-image-entries";
import { FormMediaPreview } from "./FormMediaPreview";

export function FormImageSetPreview({
  block,
  copy,
  labels,
  placeholders,
}: {
  block: FormContentBlock;
  copy: FormsCopy;
  labels: FormEditorCopy;
  placeholders: boolean;
}) {
  const testimonial = block.type === "testimonials";
  const products = formImageEntries(block);
  const showDetails = !testimonial || block.imageDescriptionsEnabled !== false;
  const entryLabel = testimonial ? labels.customer : labels.product;
  return (
    <section className="space-y-3 border-t border-slate-400/20 pt-4">
      <div className="space-y-1">
        <h4 className="break-words text-sm font-bold">
          {block.title ||
            (placeholders
              ? testimonial
                ? labels.customerTestimonials
                : labels.productOfferings
              : "")}
        </h4>
        {(block.text || placeholders) && (
          <p className="whitespace-pre-wrap break-words text-xs opacity-75">
            {block.text ||
              (testimonial
                ? labels.testimonialsDescriptionHint
                : labels.productsDescriptionHint)}
          </p>
        )}
      </div>
      <div
        className={
          testimonial
            ? "grid grid-cols-2 gap-x-3 gap-y-5 pb-2"
            : "flex snap-x gap-3 overflow-x-auto overscroll-x-contain pb-2"
        }
      >
        {products.map((product, index) => (
          <article
            key={product.id}
            className={
              testimonial
                ? "min-w-0 space-y-2 text-center"
                : "w-[calc(50%-6px)] min-w-[calc(50%-6px)] shrink-0 snap-start space-y-2"
            }
          >
            <div
              className={
                testimonial
                  ? "mx-auto w-fit overflow-hidden rounded-full"
                  : "overflow-hidden rounded-lg"
              }
            >
              <FormMediaPreview
                images={product.image ? [product.image] : []}
                avatar={testimonial}
                imageTitle={
                  (showDetails && product.title) || `${entryLabel} ${index + 1}`
                }
                placeholder={placeholders}
                copy={copy}
              />
            </div>
            {showDetails && (
              <>
                <h5 className="break-words text-xs font-bold">
                  {product.title ||
                    (placeholders ? `${entryLabel} ${index + 1}` : "")}
                </h5>
                <p className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75">
                  {product.description ||
                    (placeholders
                      ? testimonial
                        ? labels.testimonialTextHint
                        : labels.productBenefitsHint
                      : "")}
                </p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
