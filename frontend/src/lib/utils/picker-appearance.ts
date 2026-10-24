export function pickerAppearance(anchor: HTMLElement | null): "light" | "dark" {
  const appearance = anchor?.closest('.dark, .light, [data-appearance="dark"], [data-appearance="light"]');
  if (appearance) {
    return (appearance.getAttribute("data-appearance") ??
      (appearance.classList.contains("dark") ? "dark" : "light")) === "dark" ? "dark" : "light";
  }
  return anchor && anchor.ownerDocument.defaultView?.getComputedStyle(anchor).colorScheme === "dark" ? "dark" : "light";
}
