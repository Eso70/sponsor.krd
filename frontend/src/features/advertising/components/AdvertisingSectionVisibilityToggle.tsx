import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";

export function AdvertisingSectionVisibilityToggle({
  checked,
  onChange,
  translate = (text) => text,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  translate?: (text: string) => string;
}) {
  const t = translate;
  const tooltipText = t(
    checked ? "شاردنەوە لە پەڕەی گشتی" : "پیشاندان لە پەڕەی گشتی",
  );
  return (
    <VisibilitySwitch
      checked={checked}
      onChange={onChange}
      tooltip={tooltipText}
      label={
        checked
          ? t("بەشەکە لە پەڕەی گشتی نیشان دەدرێت")
          : t("بەشەکە لە پەڕەی گشتی شاردراوە")
      }
      stateLabel={t(checked ? "پیشان دەدرێت" : "شاردراوە")}
    />
  );
}
