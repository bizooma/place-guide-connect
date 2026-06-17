import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Trash2, FileText, RefreshCw, AlertCircle, CheckCircle2, Loader2, MessagesSquare, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ingestChatbotDocument,
  listChatbotDocuments,
  deleteChatbotDocument,
  listChatbotConversations,
  getChatbotConversation,
} from "@/lib/chatbot.functions";

type Doc = {
  id: string;
  title: string;
  source_filename: string;
  mime_type: string | null;
  byte_size: number | null;
  status: string;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
};

type Convo = {
  id: string;
  started_at: string;
  last_message_at: string;
  visitor_label: string | null;
  message_count: number;
};

type ConvoMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    );
  if (status === "processing")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900">
      <AlertCircle className="h-3 w-3" /> Error
    </span>
  );
}

export function TrainingDocsEditor() {
  const list = useServerFn(listChatbotDocuments);
  const ingest = useServerFn(ingestChatbotDocument);
  const del = useServerFn(deleteChatbotDocument);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await list();
      setDocs(data as Doc[]);
    } catch (err) {
      console.error(err);
      toast.error("Could not load training documents.");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10 MB).");
      return;
    }
    setUploading(true);
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const storagePath = `chatbot/${Date.now()}-${crypto.randomUUID()}${ext}`;
    try {
      const { error: upErr } = await supabase.storage
        .from("document-uploads")
        .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;

      toast.message("Indexing document…", { description: "This can take a moment." });
      await ingest({
        data: {
          title: title.trim() || file.name,
          storagePath,
          sourceFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          byteSize: file.size,
        },
      });
      toast.success("Document added to the chatbot's knowledge.");
      setFile(null);
      setTitle("");
      (document.getElementById("training-file-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("training-file-input") as HTMLInputElement).value = "");
      await refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Upload failed.";
      toast.error(message);
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this document from the chatbot? This can't be undone.")) return;
    try {
      await del({ data: { documentId: id } });
      toast.success("Document removed.");
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete document.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <section className="surface-card p-5">
        <header className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary-deep" />
          <h2 className="font-semibold text-primary-deep">Add training document</h2>
        </header>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF, Word doc, or text file. The chatbot will use it to answer visitors' questions on the home page.
        </p>
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="training-title">Title (optional)</Label>
            <Input
              id="training-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hours and location"
              disabled={uploading}
            />
          </div>
          <div>
            <Label htmlFor="training-file-input">File</Label>
            <Input
              id="training-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.rtf,application/pdf,text/plain,text/markdown"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
          </div>
          <Button type="submit" disabled={uploading || !file} className="rounded-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Indexing…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </>
            )}
          </Button>
        </form>
      </section>

      {/* Documents list */}
      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 font-semibold text-primary-deep">
            <FileText className="h-4 w-4" /> Training documents
          </h2>
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No documents yet. Upload one above to teach the chatbot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Chunks</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Added</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-border align-top">
                    <td className="px-4 py-2">
                      <div className="font-medium text-primary-deep">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.source_filename}</div>
                      {d.status === "error" && d.error_message && (
                        <div className="mt-1 text-xs text-red-700">{d.error_message}</div>
                      )}
                    </td>
                    <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-2">{d.chunk_count}</td>
                    <td className="px-4 py-2">{formatSize(d.byte_size)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConversationsPanel />
    </div>
  );
}

function ConversationsPanel() {
  const list = useServerFn(listChatbotConversations);
  const get = useServerFn(getChatbotConversation);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ConvoMsg[]>>({});

  useEffect(() => {
    list()
      .then((data) => setConvos(data as Convo[]))
      .catch((err) => {
        console.error(err);
        toast.error("Could not load conversations.");
      })
      .finally(() => setLoading(false));
  }, [list]);

  async function toggle(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!messages[id]) {
      try {
        const data = await get({ data: { conversationId: id } });
        setMessages((m) => ({ ...m, [id]: data as ConvoMsg[] }));
      } catch (err) {
        console.error(err);
        toast.error("Could not load conversation.");
      }
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-semibold text-primary-deep">
          <MessagesSquare className="h-4 w-4" /> Recent visitor conversations
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Review what visitors are asking to spot gaps in your training docs.
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : convos.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No conversations yet.</div>
      ) : (
        <ul className="divide-y divide-border">
          {convos.map((c) => {
            const open = expanded === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-warm/60"
                >
                  {open ? <ChevronDown className="mt-1 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-1 h-4 w-4 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-primary-deep">
                      {c.visitor_label || "Conversation"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleString()}
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="space-y-2 bg-warm/40 px-4 pb-4 pt-1">
                    {(messages[c.id] ?? []).map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          m.role === "user"
                            ? "bg-white border border-border"
                            : "bg-primary-deep/5 border border-primary-deep/10 text-primary-deep"
                        }`}
                      >
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {m.role}
                        </div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                    {!messages[c.id] && (
                      <div className="text-xs text-muted-foreground">Loading…</div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
