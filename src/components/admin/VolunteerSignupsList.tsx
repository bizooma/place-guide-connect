import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Users, Mail, Phone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  availability: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const STATUSES = ["new", "contacted", "active", "archived"] as const;

export function VolunteerSignupsList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("volunteer_signups")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Failed to load volunteer signups", { description: error.message });
      return;
    }
    setRows(data as Row[]);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("volunteer_signups_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "volunteer_signups" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, statusFilter]);

  async function updateStatus(row: Row, status: string) {
    const { error } = await supabase
      .from("volunteer_signups")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null);
  }

  async function remove(row: Row) {
    if (!confirm(`Delete signup from ${row.name}?`)) return;
    const { error } = await supabase.from("volunteer_signups").delete().eq("id", row.id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null);
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
        <div>
          <h2 className="font-semibold text-primary-deep">Volunteer signups</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {rows?.length ?? 0} submissions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {rows === null ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No volunteer signups yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Submitted</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Availability</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary-deep">{r.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${r.email}`}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {r.email}
                    </a>
                    <div className="mt-1">
                      <a
                        href={`tel:${r.phone}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {r.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="text-sm whitespace-pre-wrap">{r.availability}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r, v)}>
                      <SelectTrigger className="h-8 w-[130px] rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => remove(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
