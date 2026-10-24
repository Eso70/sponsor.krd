-- Register media engagement for existing and future pages without rewriting content.
CREATE OR REPLACE FUNCTION public.fn_register_linktree_media_actions() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.page_type = 'linktree' THEN
    INSERT INTO public.public_page_actions (public_page_id, action_key, action_type, label, metadata)
    VALUES
      (NEW.id, 'page:image-open', 'custom', 'Open image', '{"engagement_only":true}'),
      (NEW.id, 'page:banner-change', 'custom', 'Change banner image', '{"engagement_only":true}')
    ON CONFLICT (public_page_id, action_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS register_linktree_media_actions ON public.public_pages;
CREATE TRIGGER register_linktree_media_actions
AFTER INSERT ON public.public_pages FOR EACH ROW
EXECUTE FUNCTION public.fn_register_linktree_media_actions();

INSERT INTO public.public_page_actions (public_page_id, action_key, action_type, label, metadata)
SELECT page.id, action.key, 'custom', action.label, '{"engagement_only":true}'::jsonb
FROM public.public_pages page
CROSS JOIN (VALUES ('page:image-open', 'Open image'), ('page:banner-change', 'Change banner image')) AS action(key, label)
WHERE page.page_type = 'linktree'
ON CONFLICT (public_page_id, action_key) DO NOTHING;
