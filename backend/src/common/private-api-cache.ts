import type { onSendAsyncHookHandler } from 'fastify';

/** Registered router paths also cover alternate encoded URL spellings. */
export function isPrivateApiPath(path: string): boolean {
  return /^\/api(?:\/|$)/.test(path) && !/^\/api\/public(?:\/|$)/.test(path);
}

export const preventPrivateApiCaching: onSendAsyncHookHandler = async (
  request,
  reply,
  payload,
) => {
  if (isPrivateApiPath(request.routeOptions?.url || request.url.split('?')[0]))
    reply.header('Cache-Control', 'no-store, private');
  return payload;
};
