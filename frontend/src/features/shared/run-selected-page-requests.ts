export class SelectedPageRequestError extends Error {
  constructor(
    readonly failedIds: readonly string[],
    message: string,
  ) {
    super(message);
    this.name = "SelectedPageRequestError";
  }
}

/** Bound concurrency and preserve failed IDs so partial writes can be retried. */
export async function runSelectedPageRequests(
  ids: readonly string[],
  request: (id: string) => Promise<unknown>,
  failureMessage: string,
) {
  const uniqueIds = [...new Set(ids)];
  const failedIds: string[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 5) {
    const batch = uniqueIds.slice(offset, offset + 5);
    const results = await Promise.allSettled(batch.map(async (id) => request(id)));
    results.forEach((result, index) => {
      if (result.status === "rejected") failedIds.push(batch[index]);
    });
  }
  if (failedIds.length)
    throw new SelectedPageRequestError(failedIds, failureMessage);
}
