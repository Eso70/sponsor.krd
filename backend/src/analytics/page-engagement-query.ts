/** Retention-window insights; snapshots are cumulative, so take MAX per visit. */
export const PAGE_ENGAGEMENT_QUERY = `
WITH events AS (
  SELECT event.public_page_id, event.session_id, event.properties, event.event_name,
    event.visitor_id, event.source, event.is_conversion, event.conversion_value,
    event.currency, event.channel, event.device_type, event.occurred_at,
    event.public_page_action_id, event.action_label_snapshot FROM analytics_events event
  JOIN public_pages page ON page.id = event.public_page_id
  WHERE event.business_id = $1 AND page.business_id = $1 AND event.is_bot = false
    AND ($2::uuid IS NULL OR page.id = $2 OR page.source_linktree_id = $2)
    AND ($3::varchar IS NULL OR page.page_type = $3)
    AND ($4::date IS NULL OR event.occurred_at >= ($4::date::timestamp AT TIME ZONE page.timezone))
    AND ($5::date IS NULL OR event.occurred_at < (($5::date + 1)::timestamp AT TIME ZONE page.timezone))
), visits AS (
  SELECT public_page_id, session_id, properties->>'pageViewId' AS visit,
    MAX(CASE WHEN properties->>'activeSeconds' ~ '^[0-9]{1,5}$'
      THEN LEAST((properties->>'activeSeconds')::int, 86400) ELSE 0 END) AS seconds
  FROM events WHERE event_name = 'engaged_view' AND properties->>'measurement' = 'active_time'
    AND properties->>'pageViewId' ~ '^[0-9a-fA-F-]{36}$'
  GROUP BY public_page_id, session_id, properties->>'pageViewId'
), channels AS (
  SELECT COALESCE(channel, 'direct') AS name, COUNT(*) AS views
  FROM events WHERE event_name = 'page_view' GROUP BY channel
), devices AS (
  SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*) AS views
  FROM events WHERE event_name = 'page_view' GROUP BY device_type
), revenue AS (
  SELECT currency, SUM(conversion_value) AS value FROM events
  WHERE source = 'server' AND is_conversion AND conversion_value IS NOT NULL AND currency IS NOT NULL
  GROUP BY currency
), question_config AS (
  SELECT DISTINCT ON(page.id,question->>'id') page.id AS public_page_id, question->>'id' AS question_id, question->>'text' AS label
  FROM public_pages page JOIN linktrees tree ON tree.id=page.source_linktree_id AND tree.business_id=page.business_id
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(tree.template_config->'whatsapp_modal'->'questions')='array' THEN tree.template_config->'whatsapp_modal'->'questions' ELSE '[]'::jsonb END) question
  WHERE page.business_id=$1 AND $2::uuid IS NOT NULL AND tree.template_config->'whatsapp_modal'->>'enabled'='true'
    AND jsonb_typeof(question->'id')='string' AND jsonb_typeof(question->'text')='string' AND jsonb_typeof(question->'message')='string'
    AND ($2::uuid IS NULL OR page.id=$2 OR page.source_linktree_id=$2)
    AND ($3::varchar IS NULL OR page.page_type=$3)
), question_clicks AS (
  SELECT public_page_id, properties->>'whatsappQuestionId' AS question_id,
    (array_agg(properties->>'whatsappQuestionLabel' ORDER BY occurred_at DESC))[1] AS label,
    COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_id)::int AS unique_visitors,
    MAX(occurred_at) AS last_selected_at
  FROM events WHERE $2::uuid IS NOT NULL AND event_name='whatsapp_click' AND public_page_action_id IS NOT NULL
    AND properties->>'whatsappQuestionId' IS NOT NULL AND properties->>'whatsappQuestionLabel' IS NOT NULL
  GROUP BY public_page_id, properties->>'whatsappQuestionId'
), question_links AS (
  SELECT public_page_id, properties->>'whatsappQuestionId' AS question_id, public_page_action_id,
    (array_agg(action_label_snapshot ORDER BY occurred_at DESC))[1] AS label, COUNT(*)::int AS clicks
  FROM events WHERE event_name='whatsapp_click' AND properties->>'whatsappQuestionId' IS NOT NULL AND properties->>'whatsappQuestionLabel' IS NOT NULL
  GROUP BY public_page_id, properties->>'whatsappQuestionId', public_page_action_id
), question_keys AS (
  SELECT public_page_id, question_id FROM question_config UNION SELECT public_page_id, question_id FROM question_clicks
), question_rows AS (
  SELECT keys.public_page_id, keys.question_id, COALESCE(config.label, clicks.label, keys.question_id) AS label,
    config.question_id IS NULL AS historical, COALESCE(clicks.clicks,0) AS clicks,
    COALESCE(clicks.unique_visitors,0) AS unique_visitors, clicks.last_selected_at,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('label', links.label, 'clicks', links.clicks) ORDER BY links.clicks DESC) FROM question_links links WHERE links.public_page_id=keys.public_page_id AND links.question_id=keys.question_id),'[]'::jsonb) AS links
  FROM question_keys keys LEFT JOIN question_config config USING(public_page_id,question_id)
  LEFT JOIN question_clicks clicks USING(public_page_id,question_id)
)
SELECT
  (SELECT COUNT(*) FROM visits)::int AS measured_visits,
  (SELECT COALESCE(AVG(seconds), 0) FROM visits)::numeric AS average_active_seconds,
  (SELECT COUNT(*) FROM visits WHERE seconds >= 15)::int AS engaged_visits,
  COUNT(*) FILTER (WHERE (event_name IN ('whatsapp_click','call_click','email_click') OR (is_conversion AND event_name NOT IN ('lead_created','order_completed','form_submit'))))::int AS contact_actions,
  COUNT(DISTINCT visitor_id) FILTER (WHERE (event_name IN ('whatsapp_click','call_click','email_click') OR (is_conversion AND event_name NOT IN ('lead_created','order_completed','form_submit'))))::int AS contact_visitors,
  COUNT(*) FILTER (WHERE source = 'server' AND is_conversion)::int AS confirmed_outcomes,
  COUNT(*) FILTER (WHERE source = 'server' AND is_conversion AND conversion_value IS NOT NULL AND currency IS NOT NULL)::int AS valued_outcomes,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('name', name, 'views', views) ORDER BY views DESC) FROM channels), '[]'::jsonb) AS channels,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('name', name, 'views', views) ORDER BY views DESC) FROM devices), '[]'::jsonb) AS devices
  ,COALESCE((SELECT jsonb_agg(jsonb_build_object('currency', currency, 'value', value)) FROM revenue), '[]'::jsonb) AS revenue
  ,jsonb_build_object(
    'opened', COUNT(*) FILTER (WHERE event_name='action_open' AND properties->>'measurement'='whatsapp_questions' AND properties->>'step'='opened'),
    'dismissed', COUNT(*) FILTER (WHERE event_name='action_open' AND properties->>'measurement'='whatsapp_questions' AND properties->>'step'='dismissed'),
    'selected', (SELECT COALESCE(SUM(clicks),0) FROM question_clicks),
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', public_page_id::text || ':' || question_id, 'label',label,'historical',historical,'clicks',clicks,'uniqueVisitors',unique_visitors,'lastSelectedAt',last_selected_at,'links',links) ORDER BY clicks DESC,label) FROM question_rows),'[]'::jsonb)
  ) AS whatsapp
FROM events`;
