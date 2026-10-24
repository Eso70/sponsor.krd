import { FittedPhoneMockup } from "@/components/shared/FittedPhoneMockup";
import { EditorSection } from "@/components/shared/EditorSection";
import type { EditorCopy } from "../editor-copy";
import { SkeletonLinktreeBasicInfo } from "@/components/shared/SkeletonModalLayouts";
import { Skeleton } from "@/components/shared/Skeleton";
import { EditorPreviewLayout } from "@/components/shared/EditorPreviewLayout";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import { linktreeSeoCopy } from "../linktree-seo-copy";

export function LinktreeEditorPreviewSkeleton({ label }: { label: string }) {
  return <FittedPhoneMockup ariaLabel={label} name="" statusBarClassName="mix-blend-difference !text-white">
    <div role="status" aria-busy="true" aria-label={label} className="min-h-full space-y-5 bg-white p-5 dark:bg-[#161B22]">
      <Skeleton className="mx-auto size-20" rounded="rounded-full" />
      <Skeleton className="mx-auto h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      {[0, 1, 2].map((index) => <Skeleton key={index} className="h-12 w-full" />)}
    </div>
  </FittedPhoneMockup>;
}

export function LinktreeEditorLoadingContent({ label, previewLabel, copy }: { label: string; previewLabel: string; copy?: EditorCopy }) {
  return <EditorPreviewLayout previewLabel={previewLabel} preview={
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid shrink-0 grid-cols-3 gap-2" aria-hidden>
        {[0, 1, 2].map((index) => <Skeleton key={index} className="h-10 w-full" rounded="rounded-xl" />)}
      </div>
      <LinktreeEditorPreviewSkeleton label={previewLabel} />
    </div>
  }>
    <div className="space-y-3">
      <EditorSection title={formEditorCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb").banner} open={false} disabled onToggle={() => undefined} enabled={false} onEnabled={() => undefined}><span /></EditorSection>
      <EditorSection title={copy?.basicStep ?? "زانیارییەکان"} open disabled onToggle={() => undefined}>
        <SkeletonLinktreeBasicInfo loadingLabel={label} labels={{ upload: copy?.logo ?? "لۆگۆ", name: copy?.headline ?? "سەردێڕ", subtitle: copy?.slogan ?? "درووشمی بانگەشە", description: copy?.description ?? "وەسف" }} />
      </EditorSection>
      {[linktreeSeoCopy(copy?.language === "en" ? "en" : copy ? "ar" : "ckb").section, copy?.selectStep ?? "پلاتفۆڕمەکان", copy?.linksStep ?? "لینکەکان", copy?.whatsappQuestions ?? "پرسیارەکانی واتساپ"].map((title) => <EditorSection key={title} title={title} open={false} disabled onToggle={() => undefined}><span /></EditorSection>)}
    </div>
  </EditorPreviewLayout>;
}
