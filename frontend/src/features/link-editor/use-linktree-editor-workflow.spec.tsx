import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLinktreeEditorWorkflow } from './use-linktree-editor-workflow';

const request = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/request', async original => ({ ...(await original<typeof import('@/lib/api/request')>()), apiRequest: request }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));
const copy = { created: 'Created', updated: 'Updated', archived: 'Archived', restored: 'Restored', enabled: 'Enabled', disabled: 'Disabled', loadFailed: 'Load failed', saveFailed: 'Save failed', archiveFailed: 'Archive failed', statusFailed: 'Status failed' };
const page = (id: string) => ({ linktree: { id, uid: id, background_color: '#ffffff' }, links: [] });

describe.each(['business', 'platform'] as const)('%s shared editor lifecycle', scope => {
  it('cancels superseded reads, ignores late results and cancels on close', async () => {
    request.mockReset();
    const pending = new Map<string, (value: unknown) => void>();
    request.mockImplementation((url: string) => new Promise(resolve => pending.set(url, resolve)));
    const { result, unmount } = renderHook(() => useLinktreeEditorWorkflow({ scope, locale: 'en', copy, onSaved: vi.fn(), onPageUpdated: vi.fn() }));
    const base = scope === 'business' ? '/api/linktrees' : '/api/platform/linktrees';
    let first!: Promise<void>, second!: Promise<void>;
    act(() => { first = result.current.openEdit('first'); });
    const firstSignal = request.mock.calls[0][1].signal as AbortSignal;
    act(() => { second = result.current.openEdit('second'); });
    expect(firstSignal.aborted).toBe(true);
    await act(async () => { pending.get(`${base}/first/edit`)!(page('first')); await first; });
    expect(result.current.data).toBeNull();
    await act(async () => { pending.get(`${base}/second/edit`)!(page('second')); await second; });
    expect(result.current.data?.linktree.id).toBe('second');
    act(() => result.current.close());
    expect(result.current.open).toBe(false);
    expect(result.current.data).toBeNull();
    expect(request.mock.calls[1][1].signal.aborted).toBe(true);
    unmount();
  });
  it('keeps failures recoverable, validates reads and lets create cancel pending edits', async () => {
    request.mockReset().mockResolvedValueOnce({ invalid: true });
    const { result } = renderHook(() => useLinktreeEditorWorkflow({ scope, locale: 'en', copy, onSaved: vi.fn(), onPageUpdated: vi.fn() }));
    await act(async () => { await result.current.openEdit('invalid'); });
    expect(result.current.open).toBe(false);
    request.mockImplementationOnce(() => new Promise(() => {}));
    act(() => { void result.current.openEdit('pending'); });
    const signal = request.mock.calls[1][1].signal as AbortSignal;
    act(() => result.current.create());
    expect(signal.aborted).toBe(true);
    expect(result.current.open).toBe(true);
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(result.current.data).toBeNull());
  });
});
