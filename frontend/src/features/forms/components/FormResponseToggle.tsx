import { ChevronDown, ChevronUp } from "lucide-react";
import { IconActionButton } from "@/components/shared/IconActionButton";
import type { FormsCopy } from "../forms-copy";

export function FormResponseToggle({
  expanded,
  onClick,
  copy,
}: {
  expanded: boolean;
  onClick: () => void;
  copy: FormsCopy;
}) {
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <IconActionButton
      expanded={expanded}
      label={expanded ? copy.hideDetails : copy.viewDetails}
      onClick={onClick}
    >
      <Icon aria-hidden className="size-4" />
    </IconActionButton>
  );
}
