/** Owner-scoped retained start sessions matched only to durable accepted responses. */
export const FORM_COMPLETION_CTES = `
  period AS (
    SELECT (((now() AT TIME ZONE 'UTC')::date - 13)::timestamp AT TIME ZONE 'UTC') AS from_at,now() AS to_at
  ), owned_events AS (
    SELECT event.id,event.public_page_id,event.session_id,event.visitor_id,event.event_name,event.occurred_at,event.utm_source
    FROM analytics_events event JOIN public_pages page ON page.id=event.public_page_id
    WHERE page.business_id=$1 AND event.business_id=$1 AND page.page_type='form'
      AND ($2::uuid IS NULL OR page.source_form_id=$2) AND event.is_bot=false
  ), recent_events AS (
    SELECT event.* FROM owned_events event,period WHERE event.occurred_at>=period.from_at AND event.occurred_at<=period.to_at
  ), tracked_starts AS (
    SELECT DISTINCT ON (public_page_id,session_id) public_page_id,session_id,coalesce(nullif(utm_source,''),'') AS source
    FROM recent_events WHERE event_name='form_view' ORDER BY public_page_id,session_id,occurred_at,id
  ), completed_sessions AS (
    SELECT DISTINCT event.public_page_id,event.session_id FROM recent_events event
    JOIN form_submissions response ON response.analytics_event_id=event.id
    JOIN forms form ON form.id=response.form_id AND form.business_id=$1
    JOIN public_pages page ON page.id=event.public_page_id AND page.source_form_id=form.id
    WHERE event.event_name='form_submit' AND ($2::uuid IS NULL OR form.id=$2)
  ), session_results AS (
    SELECT starts.*,completed.session_id IS NOT NULL AS completed FROM tracked_starts starts
    LEFT JOIN completed_sessions completed USING(public_page_id,session_id)
  ), completion AS (
    SELECT count(*)::integer starts,count(*) FILTER (WHERE completed)::integer responses,
      round(100.0*count(*) FILTER (WHERE completed)/nullif(count(*),0),1) AS rate FROM session_results
  )`;
