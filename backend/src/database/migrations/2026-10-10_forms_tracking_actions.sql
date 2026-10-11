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
 INSERT INTO public.public_page_actions(public_page_id,action_key,action_type,label,tiktok_event)
 VALUES(page_id,'form:start','form',NEW.name,'ClickButton')
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

UPDATE public.forms SET revision=revision;
