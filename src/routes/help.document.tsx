import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Camera, FileText, Calendar, Phone, MapPin, ListChecks, Sparkles, Trash2, ArrowLeft, Languages } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disclaimer } from "@/components/Disclaimer";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument, type DocumentAnalysis } from "@/lib/document-ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/help/document")({
  head: () => ({
    meta: [
      { title: "Document Helper — The PLACE Online" },
      { name: "description", content: "Upload or photograph a document and we'll explain it in plain English." },
      { property: "og:title", content: "Document Helper — The PLACE Online" },
      { property: "og:description", content: "Plain-English explanations for letters, bills, and forms." },
    ],
  }),
  component: DocumentPage,
});

// Languages the user can ask the AI to explain the document in.
// These are sent to Gemini as the target language for both summary and TTS.
const LANGUAGES = [
  { label: "🇺🇸 English", value: "English" },
  { label: "🇪🇸 Español (Spanish)", value: "Spanish" },
  { label: "🇦🇫 دری (Dari)", value: "Dari" },
  { label: "🇦🇫 پښتو (Pashto)", value: "Pashto" },
  { label: "🇸🇴 Soomaali (Somali)", value: "Somali" },
  { label: "🇸🇦 العربية (Arabic)", value: "Arabic" },
] as const;

interface Result extends DocumentAnalysis {
  fileName: string;
}

function DocumentPage() {
  const { t } = useI18n();
  const [consent, setConsent] = useState(false);
  const [language, setLanguage] = useState<string>("English");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const runAnalysis = useServerFn(analyzeDocument);

  const { data: resources = [] } = useQuery({
    queryKey: ["resources", "doc-helper"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id,name,description")
        .eq("active", true)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleFile(f: File | null) {
    if (!f) return;
    if (!consent) { toast.error("Please check the consent box first."); return; }
    setFile(f);
    setLoading(true);
    try {
      const ext = f.name.split(".").pop() ?? "bin";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("document-uploads")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("document_uploads").insert({
        storage_path: path,
        original_filename: f.name,
        mime_type: f.type,
        size_bytes: f.size,
      });
      if (insErr) throw insErr;

      const analysis = await runAnalysis({
        data: { storagePath: path, mimeType: f.type || "application/octet-stream", language },
      });
      setResult({ fileName: f.name, ...analysis });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function deleteAll() {
    setFile(null); setResult(null);
    toast.success("Document and result deleted.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <Button variant="ghost" asChild className="mb-4 gap-2"><Link to="/help"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>

      <header>
        <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("document.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("document.intro")}</p>
      </header>

      {!result && (
        <div className="mt-8 surface-card p-6 md:p-8">
          <Disclaimer tone="warn" className="mb-6">{t("disclaimer.upload")}</Disclaimer>

          <div className="mb-5">
            <Label htmlFor="lang" className="flex items-center gap-2 text-base font-medium">
              <Languages className="h-4 w-4 text-primary" />
              Read this document to me in…
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="lang" className="mt-2 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l} className="text-base">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-1" />
            <Label htmlFor="consent" className="text-base leading-relaxed cursor-pointer">{t("document.consent")}</Label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className={"surface-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition " + (consent ? "border-primary/30 hover:border-primary hover:bg-secondary/40" : "opacity-60 cursor-not-allowed")}>
              <Upload className="h-8 w-8 text-primary" />
              <span className="font-medium text-primary-deep">{t("document.upload")}</span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG, HEIC</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,image/*" className="hidden" disabled={!consent || loading} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className={"surface-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition " + (consent ? "border-accent/30 hover:border-accent hover:bg-accent/5" : "opacity-60 cursor-not-allowed")}>
              <Camera className="h-8 w-8 text-accent" />
              <span className="font-medium text-primary-deep">{t("document.takePhoto")}</span>
              <span className="text-xs text-muted-foreground">Use your camera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={!consent || loading} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {loading && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse text-accent" /> Reading your document in {language}…
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <div className="surface-card p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{result.fileName}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-primary-deep">{result.kind}</h2>
              </div>
              <ReadAloudButton
                language={language}
                text={[
                  result.kind,
                  result.summary,
                  result.important.length ? "Important: " + result.important.join(". ") : "",
                  result.dates.length ? "Dates: " + result.dates.join(". ") : "",
                  result.nextSteps.length ? "Next steps: " + result.nextSteps.join(". ") : "",
                  result.contact,
                ].filter(Boolean).join(". ")}
              />
            </div>
          </div>

          <ResultCard icon={FileText} title="Plain language summary">
            <p>{result.summary}</p>
          </ResultCard>

          {result.important.length > 0 && (
            <ResultCard icon={ListChecks} title="Important information">
              <ul className="space-y-2">{result.important.map((s, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{s}</li>)}</ul>
            </ResultCard>
          )}

          {result.dates.length > 0 && (
            <ResultCard icon={Calendar} title="Dates or deadlines">
              <ul className="space-y-2">{result.dates.map((s, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{s}</li>)}</ul>
            </ResultCard>
          )}

          {result.nextSteps.length > 0 && (
            <ResultCard icon={Sparkles} title="What you may need to do next">
              <ol className="list-decimal space-y-2 pl-5">{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </ResultCard>
          )}

          {resources.length > 0 && (
            <ResultCard icon={MapPin} title="Helpful resources">
              <ul className="grid gap-2 sm:grid-cols-2">
                {resources.slice(0, 4).map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-3">
                    <p className="font-medium text-primary-deep">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {result.contact && (
            <ResultCard icon={Phone} title="Who to contact">
              <p>{result.contact}</p>
            </ResultCard>
          )}

          <Disclaimer>{t("disclaimer.ai")}</Disclaimer>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" className="rounded-full gap-2" onClick={deleteAll}><Trash2 className="h-4 w-4" /> {t("document.delete")}</Button>
            <Button asChild className="rounded-full bg-primary hover:bg-primary-deep"><Link to="/resources">{t("cta.contact")}</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary-deep"><Icon className="h-4 w-4" /></span>
        <h3 className="font-display text-lg font-semibold text-primary-deep">{title}</h3>
      </div>
      <div className="mt-3 text-base leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
