import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { questionVideoUrl } from '../common/whatsapp-question-video';

/** Input IDs are hints only; only this page's existing IDs may be retained. */
export type WhatsappQuestionInput = {
  id?: unknown;
  videoUrl?: unknown;
  text?: unknown;
  message?: unknown;
};

/** Caller holds the owning Linktree row lock in its authenticated transaction. */
export async function syncWhatsAppQuestions(
  client: PoolClient,
  linktreeId: string,
  questions: readonly WhatsappQuestionInput[],
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM whatsapp_questions WHERE linktree_id=$1',
    [linktreeId],
  );
  const owned = new Set(existing.rows.map((row) => row.id));
  const retained = new Set<string>();
  for (const [order, question] of questions.entries()) {
    if (
      typeof question?.text !== 'string' ||
      typeof question.message !== 'string' ||
      !question.text.trim() ||
      !question.message.trim()
    )
      continue;
    const existingId =
      typeof question.id === 'string' && owned.has(question.id)
        ? question.id
        : undefined;
    if (existingId && retained.has(existingId)) {
      throw new BadRequestException('A WhatsApp question cannot appear twice');
    }
    const id = existingId ?? randomUUID();
    retained.add(id);
    const values = [
      linktreeId,
      id,
      question.text.trim(),
      question.message.trim(),
      order,
      questionVideoUrl(question.videoUrl),
    ];
    if (existingId) {
      await client.query(
        `UPDATE whatsapp_questions SET question_text=$3, message=$4, display_order=$5, video_url=$6
         WHERE linktree_id=$1 AND id=$2`,
        values,
      );
    } else {
      await client.query(
        `INSERT INTO whatsapp_questions(linktree_id,id,question_text,message,display_order,video_url)
         VALUES($1,$2,$3,$4,$5,$6)`,
        values,
      );
    }
  }
  await client.query(
    'DELETE FROM whatsapp_questions WHERE linktree_id=$1 AND NOT (id=ANY($2::uuid[]))',
    [linktreeId, [...retained]],
  );
}
