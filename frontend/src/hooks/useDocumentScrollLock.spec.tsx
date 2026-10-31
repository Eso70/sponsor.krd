import { useRef } from "react";
import { createPortal } from "react-dom";
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { useDocumentScrollLock } from "./useDocumentScrollLock";

function Lock({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useDocumentScrollLock(enabled, ref);
  return <div ref={ref} />;
}

it("retains nested locks until the final owner closes and restores existing styles", () => {
  document.body.style.overflow = "auto";
  document.documentElement.style.scrollbarGutter = "stable both-edges";
  const first = render(<Lock />);
  const second = render(<Lock />);
  first.unmount();
  expect(document.body.style.overflow).toBe("hidden");
  second.unmount();
  expect(document.body.style.overflow).toBe("auto");
  expect(document.documentElement.style.scrollbarGutter).toBe("stable both-edges");
  document.body.style.overflow = "";
  document.documentElement.style.scrollbarGutter = "";
});

it("locks only the iframe document for an embedded panel", () => {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const previewDocument = iframe.contentDocument!;
  const preview = render(createPortal(<Lock />, previewDocument.body));
  expect(previewDocument.body.style.overflow).toBe("hidden");
  expect(document.body.style.overflow).toBe("");
  const dashboard = render(<Lock />);
  preview.unmount();
  expect(previewDocument.body.style.overflow).toBe("");
  expect(document.body.style.overflow).toBe("hidden");
  dashboard.unmount();
  expect(document.body.style.overflow).toBe("");
  iframe.remove();
});
