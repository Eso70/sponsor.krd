-- Sponsor attribution is engagement only; it is never a marketing conversion.
CREATE OR REPLACE FUNCTION public.fn_register_linktree_sponsor_action() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  sponsor jsonb;
  sponsor_destination text;
  sponsor_name text;
  visible boolean;
BEGIN
  IF NEW.page_type <> 'linktree' THEN RETURN NEW; END IF;
  sponsor := COALESCE(NEW.theme_config->'sponsor', '{}'::jsonb);
  sponsor_destination := NULLIF(BTRIM(sponsor->>'url'), '');
  sponsor_name := LEFT(COALESCE(NULLIF(BTRIM(sponsor->>'name'), ''), 'Sponsor'), 100);
  visible := sponsor->>'enabled' = 'true'
    AND (
      (COALESCE(sponsor->>'style', 'text') <> 'wordmark' AND NULLIF(BTRIM(sponsor->>'name'), '') IS NOT NULL)
      OR (sponsor->>'style' = 'wordmark' AND sponsor->>'logo' ~* '^/images/upload/[A-Za-z0-9._/-]+\.(png|jpe?g)$')
    )
    AND (sponsor_destination = '/' OR sponsor_destination ~* '^https?://' OR sponsor_destination ~ '^tel:\+[1-9][0-9]{6,14}$');
  IF COALESCE(visible, false) THEN
    INSERT INTO public.public_page_actions
      (public_page_id, action_key, action_type, label, destination, metadata)
    VALUES
      (NEW.id, 'page:sponsor-click', 'custom', sponsor_name, sponsor_destination,
       '{"engagement_only":true,"measurement":"sponsor"}'::jsonb)
    ON CONFLICT (public_page_id, action_key) DO UPDATE SET
      label=EXCLUDED.label, destination=EXCLUDED.destination, status='active',
      metadata=EXCLUDED.metadata, updated_at=NOW();
  ELSE
    UPDATE public.public_page_actions SET status='hidden', updated_at=NOW()
      WHERE public_page_id=NEW.id AND action_key='page:sponsor-click';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS register_linktree_sponsor_action ON public.public_pages;
CREATE TRIGGER register_linktree_sponsor_action
AFTER INSERT OR UPDATE OF theme_config ON public.public_pages FOR EACH ROW
EXECUTE FUNCTION public.fn_register_linktree_sponsor_action();

-- Re-run the trigger for existing rows, preserving existing action IDs and history.
UPDATE public.public_pages SET theme_config=theme_config
WHERE page_type='linktree' AND theme_config ? 'sponsor';
