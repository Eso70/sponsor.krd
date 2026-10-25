import {
  AlignLeft,
  ImageIcon,
  Images,
  PackageCheck,
  Quote,
  ListChecks,
  Contact,
  CircleHelp,
} from "lucide-react";
import type { FormContentBlock } from "./types";

export const FORM_CONTENT_COMPONENTS = [
  { value: "text", icon: AlignLeft },
  { value: "image", icon: ImageIcon },
  { value: "carousel", icon: Images },
  { value: "products", icon: PackageCheck },
  { value: "testimonials", icon: Quote },
  { value: "steps", icon: ListChecks },
  { value: "about", icon: Contact },
  { value: "faq", icon: CircleHelp },
] as const;

export function formContentIcon(type: FormContentBlock["type"]) {
  return (
    FORM_CONTENT_COMPONENTS.find((item) => item.value === type)?.icon ??
    AlignLeft
  );
}
