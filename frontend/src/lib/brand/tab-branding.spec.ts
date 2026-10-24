import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { createPortal } from "react-dom";
import { cleanup, render } from "@testing-library/react";
import { brandIconUrl, applyTabIcon } from "./tab-branding";
import { BUSINESS_FAVICON_PLACEHOLDER, SPONSOR_KRD_FAVICON } from "./brand-assets";

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('link[rel*="icon"]').forEach((link) => link.remove());
});
describe("owner tab icon selection", () => {
  it("keeps explicit icons and derives missing icons from the owner's logo", () => {
    expect(brandIconUrl('/images/upload/businesses/a/icon.ico', '/images/upload/businesses/a/logo.png')).toBe('/images/upload/businesses/a/icon.ico');
    expect(brandIconUrl(BUSINESS_FAVICON_PLACEHOLDER, '/images/upload/businesses/a/logo.jpg')).toBe('/api/public/brand-icon?asset=%2Fimages%2Fupload%2Fbusinesses%2Fa%2Flogo.jpg');
    expect(brandIconUrl(null, null)).toBe('/images/business-favicon.ico');
    expect(brandIconUrl(null, null, true)).toBe(SPONSOR_KRD_FAVICON);
    expect(brandIconUrl('//untrusted.invalid/icon')).toBe('/images/business-favicon.ico');
  });
  it("updates existing candidates without removing them and retains the Apple touch icon", () => {
    for (const rel of ['icon', 'shortcut icon', 'apple-touch-icon']) {
      const link = document.createElement('link');
      link.rel = rel; link.href = '/old.png'; link.sizes = '512x512';
      document.head.appendChild(link);
    }
    applyTabIcon('/images/upload/businesses/b/icon.ico');
    const icons = document.head.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]');
    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon).toHaveAttribute('href', '/images/upload/businesses/b/icon.ico');
      expect(icon).not.toHaveAttribute('sizes');
    }
    expect(document.head.querySelector('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/old.png');
  });
  it.each([false, true])("preserves React-owned head nodes during teardown (platform=%s)", (platform) => {
    const view = render(createPortal([
      createElement('link', { key: 'icon', rel: 'icon', href: '/old-icon.ico' }),
      createElement('link', { key: 'shortcut', rel: 'shortcut icon', href: '/old-shortcut.ico' }),
    ], document.head));
    const nodes = Array.from(document.head.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]'));
    expect(nodes).toHaveLength(2);
    applyTabIcon('/new-icon.ico', null, platform);
    for (const node of nodes) {
      expect(node.isConnected).toBe(true);
      expect(node).toHaveAttribute('href', '/new-icon.ico');
    }
    expect(() => view.unmount()).not.toThrow();
  });
  it("reuses its created candidate when metadata has no icon", () => {
    applyTabIcon('/first.ico');
    const node = document.head.querySelector('link[rel="icon"]');
    applyTabIcon('/second.ico');
    expect(document.head.querySelectorAll('link[rel="icon"]')).toHaveLength(1);
    expect(node).toHaveAttribute('href', '/second.ico');
  });
});
