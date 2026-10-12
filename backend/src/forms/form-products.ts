import { BadRequestException } from '@nestjs/common';
import type { FormQuestion, FormProductAnswer } from '@linktree/types';

/** Prices and names always come from the locked, published definition. */
export function priceProductAnswer(
  question: FormQuestion,
  raw: string,
): FormProductAnswer {
  const config = question.productSelection;
  if (
    !config?.items.length ||
    config.items.some((item) => !item.name.trim() || item.unitPrice === null)
  )
    throw new BadRequestException('Invalid product configuration');
  let selection: unknown;
  try {
    selection = raw ? JSON.parse(raw) : {};
  } catch {
    throw new BadRequestException('Invalid product selection');
  }
  if (!selection || typeof selection !== 'object' || Array.isArray(selection))
    throw new BadRequestException('Invalid product selection');
  const entries = Object.entries(selection);
  if (
    entries.length > 20 ||
    entries.some(
      ([id, quantity]) =>
        !config.items.some((item) => item.id === id) ||
        typeof quantity !== 'string' ||
        (quantity !== '' &&
          (!/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(quantity) ||
            Number(quantity) > 100_000)),
    )
  )
    throw new BadRequestException('Invalid product quantity');
  const quantities = new Map(entries as [string, string][]);
  let totalMinor = 0;
  const items = config.items.flatMap((item) => {
    const quantity = Number(quantities.get(item.id) || 0);
    if (!quantity) return [];
    const unitPrice = item.unitPrice!;
    const minor = Number(
      (BigInt(Math.round(unitPrice * 100)) *
        BigInt(Math.round(quantity * 1000)) +
        500n) /
        1000n,
    );
    totalMinor += minor;
    return [
      {
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity,
        unitPrice,
        lineTotal: minor / 100,
      },
    ];
  });
  if (question.required && !items.length)
    throw new BadRequestException('Select at least one product');
  return { currency: config.currency, items, total: totalMinor / 100 };
}

export function productAnswerText(answer: FormProductAnswer): string {
  return [
    ...answer.items.map(
      (item) =>
        `${item.name}: ${item.quantity}${item.unit ? ` ${item.unit}` : ''} × ${item.unitPrice} ${answer.currency} = ${item.lineTotal} ${answer.currency}`,
    ),
    `Σ: ${answer.total} ${answer.currency}`,
  ].join('\n');
}
