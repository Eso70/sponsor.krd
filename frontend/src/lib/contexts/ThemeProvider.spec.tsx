import { render, renderHook } from '@testing-library/react';
import { memo } from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, useTheme } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('updates the cursor outline with the tenant color and restores the previous cursor on unmount', () => {
    const root = document.documentElement;
    root.style.setProperty('--app-default-cursor', 'url("/platform.svg"), default');
    root.style.setProperty('--app-pointer-cursor', 'pointer');
    root.style.setProperty('--app-cursor-accent', '#25F4EE');
    const view = render(<ThemeProvider websiteColor="#8754df" documentTheme="business"><span>Content</span></ThemeProvider>);
    expect(decodeURIComponent(root.style.getPropertyValue('--app-default-cursor'))).toContain('stroke="#8754df"');
    view.rerender(<ThemeProvider websiteColor="#00b4cc" documentTheme="business"><span>Content</span></ThemeProvider>);
    expect(decodeURIComponent(root.style.getPropertyValue('--app-default-cursor'))).toContain('stroke="#00b4cc"');
    expect(decodeURIComponent(root.style.getPropertyValue('--app-pointer-cursor'))).toContain('stroke="#00b4cc"');
    expect(root.style.getPropertyValue('--app-cursor-accent')).toBe('#00b4cc');
    view.unmount();
    expect(root.style.getPropertyValue('--app-default-cursor')).toBe('url("/platform.svg"), default');
    expect(root.style.getPropertyValue('--app-pointer-cursor')).toBe('pointer');
    expect(root.style.getPropertyValue('--app-cursor-accent')).toBe('#25F4EE');
    root.style.removeProperty('--app-pointer-cursor');
    root.style.removeProperty('--app-cursor-accent');
    root.style.removeProperty('--app-default-cursor');
  });

  it.each([
    { documentTheme: 'business' as const, color: '#8754df', expected: '#8754df' },
    { documentTheme: 'theme-only' as const, color: '#00b4cc', expected: '#00b4cc' },
    { documentTheme: 'business' as const, color: 'gradient:to-r:#ff0000:#0066ff', expected: 'linear-gradient(to right, #ff0000 0%, #0066ff 100%)' },
  ])('renders the palette before hydration for $documentTheme / $color', ({ documentTheme, color, expected }) => {
    const html = renderToString(
      <ThemeProvider websiteColor={color} documentTheme={documentTheme}>
        <section aria-busy="true"><button className="theme-fill">Create</button></section>
      </ThemeProvider>,
    );
    const serverDocument = new DOMParser().parseFromString(html, 'text/html');
    const scope = serverDocument.querySelector<HTMLElement>('[data-theme-scope]')!;
    expect(scope.style.getPropertyValue('--theme-css')).toBe(expected);
    expect(scope.style.display).toBe('contents');
    expect(scope.querySelector('[aria-busy="true"] button')?.textContent).toBe('Create');
    // Server rendering runs no effects: first paint must not depend on root mutations.
    expect(document.documentElement.style.getPropertyValue('--theme-css')).toBe('');
  });

  it('does not notify palette consumers when only the surrounding appearance changes', () => {
    const consume = vi.fn();
    const Consumer = memo(function Consumer() {
      consume(useTheme());
      return null;
    });
    const { rerender } = render(<ThemeProvider websiteColor="#123456"><Consumer /></ThemeProvider>);
    expect(consume).toHaveBeenCalledOnce();
    rerender(<ThemeProvider websiteColor="#123456"><Consumer /></ThemeProvider>);
    expect(consume).toHaveBeenCalledOnce();
    rerender(<ThemeProvider websiteColor="#654321"><Consumer /></ThemeProvider>);
    expect(consume).toHaveBeenCalledTimes(2);
  });

  beforeEach(() => {
    // Clear any inline styles on documentElement before each test
    document.documentElement.style.cssText = '';
  });

  describe('CSS custom properties are set on mount', () => {
    it('sets --theme-primary, --theme-css, and --theme-type on document.documentElement for a solid color', () => {
      render(
        <ThemeProvider websiteColor="#ff0000">
          <div>children</div>
        </ThemeProvider>,
      );

      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#ff0000');
      expect(document.documentElement.style.getPropertyValue('--theme-css')).toBe('#ff0000');
      expect(document.documentElement.style.getPropertyValue('--theme-type')).toBe('solid');
    });

    it('sets gradient CSS values when websiteColor is a gradient string', () => {
      render(
        <ThemeProvider websiteColor="gradient:to-r:#ff0000:#0066ff">
          <div>children</div>
        </ThemeProvider>,
      );

      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#ff0000');
      // Explicit 0%/100% stops keep the two colours at an even 50/50 split.
      expect(document.documentElement.style.getPropertyValue('--theme-css')).toBe(
        'linear-gradient(to right, #ff0000 0%, #0066ff 100%)',
      );
      expect(document.documentElement.style.getPropertyValue('--theme-type')).toBe('gradient');
    });

    it('falls back to default black when websiteColor is null', () => {
      render(
        <ThemeProvider websiteColor={null}>
          <div>children</div>
        </ThemeProvider>,
      );

      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#000000');
      expect(document.documentElement.style.getPropertyValue('--theme-css')).toBe('#000000');
      expect(document.documentElement.style.getPropertyValue('--theme-type')).toBe('solid');
    });

    it('publishes the tenant color to every document-level business theme token', () => {
      render(
        <ThemeProvider websiteColor="#123456" documentTheme="business">
          <div>children</div>
        </ThemeProvider>,
      );

      const root = document.documentElement;
      expect(root.getAttribute('data-business-theme-active')).toBe('true');
      expect(root.style.getPropertyValue('--business-website-color')).toBe('#123456');
      expect(root.style.getPropertyValue('--business-website-css')).toBe('#123456');
      expect(root.style.getPropertyValue('--sponsor-krd-accent')).toBe('#123456');
      expect(root.style.getPropertyValue('--sponsor-krd-accent-gradient')).toBe('#123456');
      expect(root.style.getPropertyValue('--sponsor-krd-accent-ink')).toBe('#ffffff');
    });

    it('keeps template-only providers from replacing the platform accent', () => {
      render(
        <ThemeProvider websiteColor="#123456">
          <div>children</div>
        </ThemeProvider>,
      );

      expect(
        document.documentElement.style.getPropertyValue('--business-website-color'),
      ).toBe('');
      expect(
        document.documentElement.style.getPropertyValue('--sponsor-krd-accent'),
      ).toBe('');
    });
  });

  describe('CSS custom properties are cleaned up on unmount', () => {
    it('removes --theme-primary, --theme-css, and --theme-type from document.documentElement on unmount', () => {
      const { unmount } = render(
        <ThemeProvider websiteColor="#ff0000">
          <div>children</div>
        </ThemeProvider>,
      );

      // Verify properties are set
      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#ff0000');

      unmount();

      // Verify properties are removed
      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--theme-css')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--theme-type')).toBe('');
    });

    it('restores the previous platform accent after a business theme unmounts', () => {
      document.documentElement.style.setProperty('--sponsor-krd-accent', '#25F4EE');
      const { unmount } = render(
        <ThemeProvider websiteColor="#123456" documentTheme="business">
          <div>children</div>
        </ThemeProvider>,
      );

      unmount();

      expect(
        document.documentElement.style.getPropertyValue('--sponsor-krd-accent'),
      ).toBe('#25F4EE');
      expect(
        document.documentElement.style.getPropertyValue('--business-website-color'),
      ).toBe('');
    });
  });

  describe('useTheme throws when used outside provider', () => {
    it('throws "useTheme must be used within ThemeProvider" when used outside ThemeProvider', () => {
      // Suppress React error boundary console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});
