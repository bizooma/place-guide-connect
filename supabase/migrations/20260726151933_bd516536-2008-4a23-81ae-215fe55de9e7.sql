CREATE TABLE public.rep_lookup_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rep_lookup_cache_cache_key_idx ON public.rep_lookup_cache(cache_key);

GRANT ALL ON public.rep_lookup_cache TO service_role;
ALTER TABLE public.rep_lookup_cache ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rep_lookup_rate_limit (
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

GRANT ALL ON public.rep_lookup_rate_limit TO service_role;
ALTER TABLE public.rep_lookup_rate_limit ENABLE ROW LEVEL SECURITY;