export function tiktokContentName(pageName: string, actionName?: string | null, platform?: unknown): string;
export function tiktokContentProperties(input: {
  pageId: string;
  pageName: string;
  actionId?: string | null;
  actionName?: string | null;
  platform?: unknown;
  description?: string | null;
}): {
  content_id: string;
  content_ids: string[];
  content_name: string;
  contents: Array<{ content_id: string; content_name: string }>;
  description?: string;
};
