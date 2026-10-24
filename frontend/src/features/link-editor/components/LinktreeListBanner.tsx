import {
  readLinktreeBanner,
  type LinktreeTemplateConfig,
} from "@linktree/types";
import { PageListBanner } from "@/components/shared/PageListBanner";

/** Saved Linktree banner adapter for the shared collection cover. */
export function LinktreeListBanner({
  config,
  compact = false,
}: {
  config?: LinktreeTemplateConfig | null;
  compact?: boolean;
}) {
  const banner = readLinktreeBanner(config?.banner);
  return (
    <PageListBanner
      src={banner.enabled ? banner.images[0] : null}
      compact={compact}
    />
  );
}
