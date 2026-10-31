import type { PoolClient } from 'pg';

/** Only saved page-owned questions/links can be attributed; message bodies stay out. */
export async function whatsappQuestionAttribution(
  client: PoolClient,
  page: { id: string; business_id: string; page_type: string },
  action: { action_type: string } | null,
  eventName: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const properties = { ...input };
  for (const key of [
    'whatsappQuestionId',
    'whatsappQuestionLabel',
    'whatsappQuestionMessage',
    'whatsappQuestionVideoUrl',
  ])
    delete properties[key];
  if (page.page_type !== 'linktree') return properties;
  if (
    typeof input.whatsappQuestionId === 'string' &&
    typeof properties.destination === 'string'
  ) {
    try {
      const destination = new URL(properties.destination);
      destination.search = '';
      destination.hash = '';
      properties.destination = destination.href;
    } catch {
      delete properties.destination;
    }
  }
  if (
    eventName === 'whatsapp_click' &&
    action?.action_type === 'whatsapp' &&
    typeof input.whatsappQuestionId === 'string' &&
    input.whatsappQuestionId.length <= 200
  ) {
    const result = await client.query<{ id: string; label: string }>(
      `
      SELECT question.id::text AS id, question.question_text AS label
      FROM public_pages page JOIN linktrees tree ON tree.id=page.source_linktree_id AND tree.business_id=page.business_id
      JOIN whatsapp_questions question ON question.linktree_id=tree.id
      WHERE page.id=$1 AND page.business_id=$3
        AND COALESCE(tree.whatsapp_modal_enabled, tree.template_config->'whatsapp_modal'->>'enabled'='true', false)
        AND question.id::text=$2 LIMIT 1`,
      [page.id, input.whatsappQuestionId, page.business_id],
    );
    const question = result.rows[0];
    if (question?.id && typeof question.label === 'string') {
      properties.whatsappQuestionId = question.id;
      properties.whatsappQuestionLabel = question.label.slice(0, 500);
    }
  }
  if (input.measurement === 'whatsapp_questions') {
    delete properties.measurement;
    delete properties.step;
    delete properties.linkId;
    if (
      eventName !== 'action_open' ||
      !['opened', 'dismissed'].includes(String(input.step)) ||
      typeof input.linkId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.linkId,
      )
    )
      return properties;
    const result = await client.query(
      `SELECT id FROM public_page_actions WHERE public_page_id=$1 AND source_link_id=$2::uuid AND action_type='whatsapp' LIMIT 1`,
      [page.id, input.linkId],
    );
    if (result.rows.length) {
      properties.measurement = 'whatsapp_questions';
      properties.step = input.step;
      properties.linkId = input.linkId;
    }
  }
  return properties;
}
