DELETE FROM public.languages;
INSERT INTO public.languages (code, name, native_name, active, sort_order) VALUES
  ('en','English','English',true,1),
  ('es','Spanish','Español',true,2),
  ('fa','Dari','دری',true,3),
  ('ps','Pashto','پښتو',true,4),
  ('so','Somali','Soomaali',true,5),
  ('ar','Arabic','العربية',true,6);