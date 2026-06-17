import { useEffect, useState } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Lang = {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  active: boolean;
  sort_order: number;
};

type Draft = Omit<Lang, "id"> & { id?: string; _dirty?: boolean };

export function LanguagesEditor() {
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("Failed to load languages", { description: error.message });
      return;
    }
    setRows((data ?? []) as Draft[]);
  }

  useEffect(() => {
    load();
  }, []);

  function update(idx: number, patch: Partial<Draft>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)));
  }

  function addNew() {
    setRows((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        native_name: "",
        active: true,
        sort_order: (prev[prev.length - 1]?.sort_order ?? 0) + 1,
        _dirty: true,
      },
    ]);
  }

  async function save(idx: number) {
    const r = rows[idx];
    if (!r.code.trim() || !r.name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    setSavingId(r.id ?? `new-${idx}`);
    const payload = {
      code: r.code.trim().toLowerCase(),
      name: r.name.trim(),
      native_name: r.native_name?.trim() || null,
      active: r.active,
      sort_order: r.sort_order,
    };
    let error;
    if (r.id) {
      ({ error } = await supabase.from("languages").update(payload).eq("id", r.id));
    } else {
      const { data, error: insErr } = await supabase
        .from("languages")
        .insert(payload)
        .select()
        .single();
      error = insErr;
      if (!error && data) {
        setRows((prev) => prev.map((row, i) => (i === idx ? { ...(data as Lang), _dirty: false } : row)));
      }
    }
    setSavingId(null);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    toast.success("Saved");
    if (r.id) update(idx, { _dirty: false });
  }

  async function remove(idx: number) {
    const r = rows[idx];
    if (!r.id) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm(`Delete language "${r.name}"?`)) return;
    const { error } = await supabase.from("languages").delete().eq("id", r.id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Deleted");
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
        <div>
          <h2 className="font-semibold text-primary-deep">Languages</h2>
          <p className="text-xs text-muted-foreground">{rows.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button size="sm" className="rounded-full gap-1.5" onClick={addNew}>
            <Plus className="h-4 w-4" />Add language
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-warm">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium w-[90px]">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Native name</th>
              <th className="px-4 py-2 font-medium w-[90px]">Order</th>
              <th className="px-4 py-2 font-medium w-[90px]">Active</th>
              <th className="px-4 py-2 w-[180px]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`} className="border-t border-border align-middle">
                <td className="px-4 py-2">
                  <Input value={r.code} onChange={(e) => update(i, { code: e.target.value })} placeholder="en" className="h-9" />
                </td>
                <td className="px-4 py-2">
                  <Input value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="English" className="h-9" />
                </td>
                <td className="px-4 py-2">
                  <Input value={r.native_name ?? ""} onChange={(e) => update(i, { native_name: e.target.value })} placeholder="English" className="h-9" />
                </td>
                <td className="px-4 py-2">
                  <Input type="number" value={r.sort_order} onChange={(e) => update(i, { sort_order: Number(e.target.value) || 0 })} className="h-9" />
                </td>
                <td className="px-4 py-2">
                  <Switch checked={r.active} onCheckedChange={(v) => update(i, { active: v })} />
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                      onClick={() => save(i)}
                      disabled={!r._dirty || savingId === (r.id ?? `new-${i}`)}
                    >
                      <Save className="h-4 w-4" />Save
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full text-red-600 hover:text-red-700" onClick={() => remove(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No languages yet. Click "Add language" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
