export function readTikTokSummary(input: unknown): { delivered: number; deliveryRate: number } {
  if (!input || typeof input !== "object") throw new Error("Invalid TikTok summary");
  const { delivered, deliveryRate } = input as Record<string, unknown>;
  if (typeof delivered !== "number" || !Number.isSafeInteger(delivered) || delivered < 0 ||
      typeof deliveryRate !== "number" || !Number.isFinite(deliveryRate) || deliveryRate < 0 || deliveryRate > 100) {
    throw new Error("Invalid TikTok summary");
  }
  return { delivered, deliveryRate };
}
