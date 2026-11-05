import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformLocaleProvider } from '@/features/platform-admin/i18n/PlatformLocaleProvider';
import { campaignCopy } from '../campaign-copy';
import { PlatformTikTokAdAccountTab } from './PlatformTikTokAdAccountTab';

describe('unavailable TikTok Ads integration', () => {
  afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/'); });
  it.each(['en', 'ar', 'ckb'] as const)('ignores forged callbacks and removes old credentials in %s', async (locale) => {
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { removeItem });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/?tab=tiktok-ads&connected=true&auth_code=untrusted');
    render(<PlatformLocaleProvider initialLocale={locale}><PlatformTikTokAdAccountTab /></PlatformLocaleProvider>);
    expect(screen.getByText(campaignCopy[locale].connectionUnavailable)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await waitFor(() => expect(removeItem).toHaveBeenCalledWith('platform_tiktok_ad_account'));
    expect(window.location.search).toBe('?tab=tiktok-ads');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
