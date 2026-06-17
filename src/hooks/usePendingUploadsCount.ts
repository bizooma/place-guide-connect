import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePendingUploadsCount() {
  const [count, setCount] = useState<number>(0);

  async function refresh() {
    const { count: c } = await supabase
      .from("document_uploads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setCount(c ?? 0);
  }

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("document_uploads_badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_uploads" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
