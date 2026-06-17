import { useEffect, useState } from "react";
import { Loader2, Languages as LanguagesIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { translateRow } from "@/lib/translate.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Resource = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  languages: string[] | null;
  translations?: Record<string, Record<string, string>> | null;
};

const REQUIRED_LANGS = ["es", "fa", "ps", "so", "ar"];

export function ResourcesTranslateList() {
  const [rows, setRows] = useState<Resource[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const translateFn = useServerFn(translateRow);

  async function load() {
    const { data, error } = await supabase
      .from("resources")
      .select("id,name,category,phone,languages,translations")
      .order("sort_order");
    if (error) return toast.error("Failed to load resources");
    setRows((data ?? []) as Resource[]);
  }

  useEffect(() => { load(); }, []);

  function status(r: Resource) {
    const tr = r.translations ?? {};
    const present = REQUIRED_LANGS.filter((l) => tr[l] && Object.keys(tr[l]).length > 0).length;
    return { present, total: REQUIRED_LANGS.length, complete: present === REQUIRED_LANGS.length };
  }

  async function translateOne(id: string) {
    setBusyId(id);
    try {
      await translateFn({ data: { table: "resources", id } });
      toast.success("Translations generated");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Translation failed");
    } finally {
      setBusyId(null);
    }
  }

  async function translateAllMissing() {
    if (!rows) return;
    const missing = rows.filter((r) => !status(r).complete);
    if (missing.length === 0) {
      toast.info("Everything is already translated");
      return;
    }
    setBulk(true);
    let ok = 0;
    for (const r of missing) {
      try {
        await translateFn({ data: { table: "resources", id: r.id } });
        ok++;
      } catch (e: any) {
        toast.error(`${r.name}: ${e?.message ?? "failed"}`);
      }
    }
    setBulk(false);
    toast.success(`Translated ${ok} of ${missing.length}`);
    await load();
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-primary-deep">Resources</h2>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5" disabled={bulk || !rows} onClick={translateAllMissing}>
          {bulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <LanguagesIcon className="h-4 w-4" />}
          Translate all missing
        </Button>
      </div>
      <div className="overflow-x-auto">
        {rows === null ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No resources yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr>
                {["Name", "Category", "Phone", "Languages", "Translations"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = status(r);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.category}</td>
                    <td className="px-4 py-2">{r.phone ?? "—"}</td>
                    <td className="px-4 py-2">{(r.languages ?? []).join(", ")}</td>
                    <td className="px-4 py-2">
                      {st.complete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <Check className="h-3 w-3" />All {st.total}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {st.present}/{st.total}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Generate translations"
                        disabled={busyId === r.id}
                        onClick={() => translateOne(r.id)}
                      >
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LanguagesIcon className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
