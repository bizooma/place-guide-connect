
-- Languages
CREATE TABLE public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text,
  active boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Languages are publicly readable" ON public.languages FOR SELECT USING (true);

-- Resources
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  phone text,
  website text,
  address text,
  languages text[] NOT NULL DEFAULT '{}',
  hours text,
  eligibility text,
  cost text NOT NULL DEFAULT 'Unknown',
  tags text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources are publicly readable" ON public.resources FOR SELECT USING (active);

-- Schedule items
CREATE TABLE public.schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  day text NOT NULL,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  location text NOT NULL,
  description text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  registration_required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedule_items TO anon, authenticated;
GRANT ALL ON public.schedule_items TO service_role;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedule items are publicly readable" ON public.schedule_items FOR SELECT USING (active);

-- Document uploads (anonymous; reviewed by admin via service role / dashboard)
CREATE TABLE public.document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  user_note text,
  help_category text,
  language text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- anon may submit uploads but cannot read them back
GRANT INSERT ON public.document_uploads TO anon, authenticated;
GRANT ALL ON public.document_uploads TO service_role;
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a document upload" ON public.document_uploads FOR INSERT WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_languages_updated_at BEFORE UPDATE ON public.languages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_schedule_items_updated_at BEFORE UPDATE ON public.schedule_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_document_uploads_updated_at BEFORE UPDATE ON public.document_uploads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed languages
INSERT INTO public.languages (code, name, native_name, active, sort_order) VALUES
  ('en', 'English', 'English', true, 1),
  ('es', 'Spanish', 'Español', false, 2),
  ('ar', 'Arabic', 'العربية', false, 3),
  ('sw', 'Swahili', 'Kiswahili', false, 4),
  ('fr', 'French', 'Français', false, 5),
  ('my', 'Burmese', 'မြန်မာ', false, 6);
