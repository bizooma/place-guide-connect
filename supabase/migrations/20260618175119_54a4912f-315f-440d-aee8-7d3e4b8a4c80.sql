CREATE TABLE public.triage_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'HelpCircle',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.triage_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.triage_categories TO authenticated;
GRANT ALL ON public.triage_categories TO service_role;

ALTER TABLE public.triage_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Triage categories are viewable by everyone"
  ON public.triage_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert triage categories"
  ON public.triage_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update triage categories"
  ON public.triage_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete triage categories"
  ON public.triage_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_triage_categories_updated_at
  BEFORE UPDATE ON public.triage_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.triage_categories (slug, title, description, icon, sort_order, active) VALUES
  ('bill', 'Pay a bill', 'Understand what you owe and explore options.', 'Receipt', 1, true),
  ('job', 'Find a job', 'Get help with applications, resumes, and work search.', 'Briefcase', 2, true),
  ('document', 'What does this document mean?', 'Upload a letter, form, or photo to get a plain-English explanation.', 'FileText', 3, true),
  ('english', 'Learn English', 'Find classes and practice that fit your level.', 'Languages', 4, true),
  ('needs', 'Find food, housing, or transportation help', 'Local programs and community resources.', 'HeartHandshake', 5, true),
  ('unsure', 'I''m not sure', 'That''s okay. We''ll ask a few simple questions.', 'HelpCircle', 6, true);
