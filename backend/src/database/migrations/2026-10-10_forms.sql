CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug varchar(80) NOT NULL,
  name varchar(100) NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'ready' CHECK (status IN ('draft','ready','paused','archived')),
  definition jsonb NOT NULL CHECK (jsonb_typeof(definition)='object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  submission_count integer NOT NULL DEFAULT 0 CHECK (submission_count>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$')
);
CREATE INDEX IF NOT EXISTS forms_owner_updated_idx ON public.forms(business_id,updated_at DESC,id);
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  revision integer NOT NULL,
  answers jsonb NOT NULL CHECK (jsonb_typeof(answers)='array'),
  consent boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, request_id)
);
CREATE INDEX IF NOT EXISTS form_submissions_form_created_idx ON public.form_submissions(form_id,created_at DESC,id);

-- Forms have independent capabilities; existing plan grants start with Linktree parity.
INSERT INTO public.auth_permissions(permission_key,resource,action,description,risk_level,category,display_order)
SELECT replace(permission_key,':linktrees:',':forms:'),replace(resource,'linktrees','forms'),action,
       initcap(action)||' forms','standard',split_part(permission_key,':',1)||' forms',950
FROM public.auth_permissions WHERE permission_key ~ '^(business|platform):linktrees:(read|create|update|delete|upload)$'
ON CONFLICT (permission_key) DO NOTHING;
INSERT INTO public.billing_plan_permissions(plan_configuration_id,permission_id,access_mode,resource_scope,conditions)
SELECT grant_row.plan_configuration_id,target.id,grant_row.access_mode,grant_row.resource_scope,grant_row.conditions
FROM public.billing_plan_permissions grant_row
JOIN public.auth_permissions source ON source.id=grant_row.permission_id
JOIN public.auth_permissions target ON target.permission_key=replace(source.permission_key,':linktrees:',':forms:')
WHERE source.permission_key ~ '^business:linktrees:(read|create|update|delete|upload)$'
ON CONFLICT (plan_configuration_id,permission_id) DO NOTHING;

ALTER TABLE public.public_pages ADD COLUMN IF NOT EXISTS source_form_id uuid UNIQUE REFERENCES public.forms(id) ON DELETE CASCADE;
ALTER TABLE public.public_pages DROP CONSTRAINT public_pages_page_type_check;
ALTER TABLE public.public_pages ADD CONSTRAINT public_pages_page_type_check CHECK(page_type IN ('linktree','advertising','route','form'));
ALTER TABLE public.public_pages DROP CONSTRAINT public_pages_source_check;
ALTER TABLE public.public_pages ADD CONSTRAINT public_pages_source_check CHECK (
 (page_type='linktree' AND source_linktree_id IS NOT NULL AND source_advertising_page_id IS NULL AND source_form_id IS NULL) OR
 (page_type='advertising' AND source_advertising_page_id IS NOT NULL AND source_linktree_id IS NULL AND source_form_id IS NULL) OR
 (page_type='form' AND source_form_id IS NOT NULL AND source_linktree_id IS NULL AND source_advertising_page_id IS NULL) OR
 (page_type='route' AND source_form_id IS NULL AND source_linktree_id IS NULL AND source_advertising_page_id IS NULL)
);
CREATE OR REPLACE FUNCTION public.sync_form_public_page() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE page_id uuid; item jsonb;
BEGIN
 INSERT INTO public.public_pages(business_id,page_type,source_form_id,name,slug,status,current_version)
 VALUES(NEW.business_id,'form',NEW.id,CASE WHEN length(NEW.name)<2 THEN 'Form: '||NEW.name ELSE NEW.name END,NEW.slug,
 CASE NEW.status WHEN 'ready' THEN 'published' ELSE NEW.status END,NEW.revision)
 ON CONFLICT(source_form_id) DO UPDATE SET name=EXCLUDED.name,status=EXCLUDED.status,current_version=EXCLUDED.current_version,updated_at=now()
 RETURNING id INTO page_id;
 UPDATE public.public_page_actions SET status='archived' WHERE public_page_id=page_id;
 INSERT INTO public.public_page_actions(public_page_id,action_key,action_type,label,tiktok_event)
 VALUES(page_id,'form:submit','form',NEW.name,'SubmitForm')
 ON CONFLICT(public_page_id,action_key) DO UPDATE SET label=EXCLUDED.label,status='active';
 IF coalesce((NEW.definition->>'actionsEnabled')::boolean,true) THEN
 FOR item IN SELECT * FROM jsonb_array_elements(coalesce(NEW.definition->'actions','[]'::jsonb)) LOOP
 INSERT INTO public.public_page_actions(public_page_id,action_key,action_type,label,destination,tiktok_event)
 VALUES(page_id,'form:action:'||(item->>'id'),'link',item->>'text',item->>'url','ClickButton')
 ON CONFLICT(public_page_id,action_key) DO UPDATE SET label=EXCLUDED.label,destination=EXCLUDED.destination,status='active';
 END LOOP;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS forms_public_page_sync ON public.forms;
CREATE TRIGGER forms_public_page_sync AFTER INSERT OR UPDATE OF definition,status,name,revision ON public.forms FOR EACH ROW EXECUTE FUNCTION public.sync_form_public_page();
