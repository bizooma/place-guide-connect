import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { triageCategories as fallback, type TriageCategory } from "@/data/mock";

export function useTriageCategories(): TriageCategory[] {
  const [cats, setCats] = useState<TriageCategory[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("triage_categories")
      .select("id,slug,title,description,icon,sort_order,active")
      .order("sort_order")
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setCats(
          data.map((r: any) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            description: r.description,
            icon: r.icon,
            order: r.sort_order,
            active: r.active,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return cats;
}
