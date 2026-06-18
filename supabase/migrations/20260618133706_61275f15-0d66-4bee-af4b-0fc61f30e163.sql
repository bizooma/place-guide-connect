
CREATE TABLE public.volunteer_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  availability TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

GRANT INSERT ON public.volunteer_signups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_signups TO authenticated;
GRANT ALL ON public.volunteer_signups TO service_role;

ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a volunteer signup"
  ON public.volunteer_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(phone) BETWEEN 3 AND 50
    AND char_length(availability) BETWEEN 1 AND 2000
  );

CREATE POLICY "Admins can view volunteer signups"
  ON public.volunteer_signups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update volunteer signups"
  ON public.volunteer_signups FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete volunteer signups"
  ON public.volunteer_signups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
