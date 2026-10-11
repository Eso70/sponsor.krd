import { FileText, Layers } from "lucide-react";
import type { FormsCopy } from "../forms-copy";
import type { FormDraft } from "../types";

/** Native radio cards keep the creation choice accessible with keyboard arrows. */
export function FormLayoutChooser({
  value,
  onChange,
  copy,
}: {
  value: FormDraft["layout"];
  onChange: (layout: FormDraft["layout"]) => void;
  copy: FormsCopy;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{copy.chooseLayout}</legend>
      <div className="mx-auto grid max-w-3xl gap-5 py-4 sm:grid-cols-2">
        {(["form", "card"] as const).map((layout) => {
          const Icon = layout === "form" ? FileText : Layers;
          const selected = value === layout;
          const title =
            layout === "form" ? copy.formLayoutName : copy.cardLayoutName;
          return (
            <label
              key={layout}
              className={`relative flex cursor-pointer flex-col gap-4 rounded-2xl border p-5 transition-colors ${selected ? "border-[var(--theme-primary,#64748b)] bg-slate-50 text-[var(--theme-primary,#64748b)] dark:bg-white/5" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <Icon
                  className="h-6 w-6 text-slate-500 dark:text-slate-300"
                  aria-hidden="true"
                />
                <input
                  type="radio"
                  name="form-creation-layout"
                  value={layout}
                  checked={selected}
                  onChange={() => onChange(layout)}
                  aria-label={title}
                  className="h-4 w-4 accent-[var(--theme-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary,#64748b)]"
                />
              </div>
              <div
                aria-hidden="true"
                className="flex h-40 items-center justify-center rounded-xl bg-slate-100/70 dark:bg-black/10"
              >
                <div className="w-32 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1c222b]">
                  {(layout === "form" ? [0, 1, 2] : [0]).map((index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="h-1.5 w-12 rounded bg-slate-200 dark:bg-white/15" />
                      <div className="h-4 rounded border border-slate-200 dark:border-white/10" />
                    </div>
                  ))}
                  {layout === "card" && (
                    <div className="flex justify-center gap-1">
                      <span className="theme-fill h-1.5 w-3 rounded-full" />
                      <span className="h-1.5 w-3 rounded-full bg-slate-200 dark:bg-white/15" />
                      <span className="h-1.5 w-3 rounded-full bg-slate-200 dark:bg-white/15" />
                    </div>
                  )}
                  <div className="theme-fill h-5 rounded-md" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {layout === "form"
                    ? copy.formLayoutDescription
                    : copy.cardLayoutDescription}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
