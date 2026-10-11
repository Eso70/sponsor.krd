CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug varchar(80) NOT NULL,
  name varchar(100) NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  definition jsonb NOT NULL CHECK (jsonb_typeof(definition)='object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  submission_count integer NOT NULL DEFAULT 0 CHECK (submission_count>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug),
  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$')
);
CREATE INDEX forms_owner_archive_updated_idx ON public.forms(business_id,is_archived,updated_at DESC,id);
CREATE INDEX forms_owner_updated_idx ON public.forms(business_id,updated_at DESC,id);
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  analytics_event_id uuid,
  duration_ms integer CHECK(duration_ms IS NULL OR duration_ms BETWEEN 0 AND 86400000),
  revision integer NOT NULL,
  answers jsonb NOT NULL CHECK (jsonb_typeof(answers)='array'),
  consent boolean NOT NULL,
  privacy_version varchar(10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, request_id)
);
CREATE INDEX form_submissions_form_created_idx ON public.form_submissions(form_id,created_at DESC,id);

CREATE INDEX form_submissions_analytics_idx ON public.form_submissions(analytics_event_id) WHERE analytics_event_id IS NOT NULL;
