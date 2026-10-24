"use client";
import { useId, useState } from "react";

/** Keep short, stable thumbnail keys across moves, replacement and duplicate URLs. */
export function useImageEntries(images: string[]) {
  const prefix = useId();
  const [cache, setCache] = useState(() => ({ images, nextId: images.length,
    entries: images.map((image, index) => ({ id: `${prefix}-image-${index}`, image })) }));
  if (cache.images === images) return cache.entries;
  const available = new Map<string, typeof cache.entries>();
  for (const entry of cache.entries) {
    const matches = available.get(entry.image) ?? [];
    matches.push(entry);
    available.set(entry.image, matches);
  }
  let nextId = cache.nextId;
  const entries = images.map((image) => available.get(image)?.shift() ?? { id: `${prefix}-image-${nextId++}`, image });
  setCache({ images, nextId, entries });
  return entries;
}
