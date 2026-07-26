GRANT SELECT, INSERT, UPDATE, DELETE ON public.rep_lookup_cache TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rep_lookup_rate_limit TO anon, authenticated;

DROP POLICY IF EXISTS "rep_cache_all" ON public.rep_lookup_cache;
CREATE POLICY "rep_cache_all" ON public.rep_lookup_cache FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rep_rl_all" ON public.rep_lookup_rate_limit;
CREATE POLICY "rep_rl_all" ON public.rep_lookup_rate_limit FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);