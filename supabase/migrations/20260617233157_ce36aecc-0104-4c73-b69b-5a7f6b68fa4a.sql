CREATE POLICY "Admins can insert languages" ON public.languages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update languages" ON public.languages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete languages" ON public.languages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.languages TO authenticated;