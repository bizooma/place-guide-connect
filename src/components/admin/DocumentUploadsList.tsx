import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, FileText, Eye, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type DocRow = {
  id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  user_note: string | null;
  help_category: string | null;
  language: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
};

const STATUSES = ["pending", "in_review", "resolved", "archived"] as const;

function formatSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentUploadsList() {
  const [rows, setRows] = useState<DocRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_uploads")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Failed to load uploads", { description: error.message });
      return;
    }
    setRows(data as DocRow[]);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("document_uploads_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_uploads" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    rows?.forEach((r) => r.help_category && s.add(r.help_category));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      const status = r.status ?? "pending";
      if (showArchived) {
        if (status !== "archived") return false;
      } else {
        if (status === "archived") return false;
      }
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (categoryFilter !== "all" && r.help_category !== categoryFilter) return false;
      return true;
    });
  }, [rows, statusFilter, categoryFilter, showArchived]);

  async function openSigned(row: DocRow, mode: "view" | "download") {
    const opts = mode === "download" ? { download: row.original_filename ?? true } : undefined;
    const { data, error } = await supabase.storage
      .from("document-uploads")
      .createSignedUrl(row.storage_path, 300, opts);
    if (error || !data?.signedUrl) {
      toast.error("Could not generate link", { description: error?.message });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function updateStatus(row: DocRow, status: string) {
    const { error } = await supabase
      .from("document_uploads")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null);
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
        <div>
          <h2 className="font-semibold text-primary-deep">Document uploads</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} of {rows?.length ?? 0} submissions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-full"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={showArchived ? "default" : "outline"} size="sm" className="rounded-full gap-1.5" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? <><ArchiveRestore className="h-4 w-4" />Back to active</> : <><Archive className="h-4 w-4" />View archived</>}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </div>

      {rows === null ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No uploads match these filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Submitted</th>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Lang</th>
                <th className="px-4 py-2 font-medium">Note</th>
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
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary-deep break-all">{r.original_filename ?? r.storage_path}</div>
                    <div className="text-xs text-muted-foreground">{r.mime_type ?? "—"} · {formatSize(r.size_bytes)}</div>
                  </td>
                  <td className="px-4 py-3">{r.help_category ?? "—"}</td>
                  <td className="px-4 py-3">{r.language ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="text-sm whitespace-pre-wrap">{r.user_note || <span className="text-muted-foreground">—</span>}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={r.status ?? "pending"} onValueChange={(v) => updateStatus(r, v)}>
                      <SelectTrigger className="h-8 w-[130px] rounded-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => openSigned(r, "view")}>
                        <Eye className="h-4 w-4" />View
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full gap-1.5" onClick={() => openSigned(r, "download")}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
