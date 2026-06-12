import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Camera, FileText, Calendar, Phone, MapPin, ListChecks, Sparkles, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/Disclaimer";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { useI18n } from "@/lib/i18n";
import { resources } from "@/data/mock";
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

interface FakeResult {
  fileName: string;
  kind: string;
  summary: string;
  important: string[];
  dates: string[];
  nextSteps: string[];
  contact: string;
}

function DocumentPage() {
  const { t } = useI18n();
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FakeResult | null>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!consent) { toast.error("Please check the consent box first."); return; }
    setFile(f);
    setLoading(true);
    // Placeholder for AI analysis. Real implementation will upload to Supabase
    // Storage and call a server function that runs the model.
    setTimeout(() => {
      setResult({
        fileName: f.name,
        kind: "This looks like a utility bill.",
        summary: "This is a monthly bill from an electric or gas company. It shows how much energy you used and what you owe. There is a due date — if you pay after that date, there is usually a late fee.",
        important: ["Amount due: appears near the top right.", "Account number: keep this private.", "A customer service phone number is usually at the top or bottom."],
        dates: ["Due date — pay by this date to avoid a late fee.", "Statement date — the date the bill was created."],
        nextSteps: ["Find the amount due and the due date.", "If you cannot pay the full amount, call the company and ask about payment plans or hardship help.", "Bring the bill to The PLACE during Document Help Hour for help in person."],
        contact: "The PLACE — Document Help Hour (Wednesday afternoons), or call 2-1-1 in Texas for assistance programs.",
      });
      setLoading(false);
    }, 1200);
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

          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-1" />
            <Label htmlFor="consent" className="text-base leading-relaxed cursor-pointer">{t("document.consent")}</Label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className={"surface-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition " + (consent ? "border-primary/30 hover:border-primary hover:bg-secondary/40" : "opacity-60 cursor-not-allowed")}>
              <Upload className="h-8 w-8 text-primary" />
              <span className="font-medium text-primary-deep">{t("document.upload")}</span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG, HEIC</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,image/*" className="hidden" disabled={!consent} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className={"surface-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center transition " + (consent ? "border-accent/30 hover:border-accent hover:bg-accent/5" : "opacity-60 cursor-not-allowed")}>
              <Camera className="h-8 w-8 text-accent" />
              <span className="font-medium text-primary-deep">{t("document.takePhoto")}</span>
              <span className="text-xs text-muted-foreground">Use your camera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={!consent} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {loading && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse text-accent" /> Reading your document…
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
              <ReadAloudButton text={`${result.kind}. ${result.summary}`} />
            </div>
          </div>

          <ResultCard icon={FileText} title="Plain English summary">
            <p>{result.summary}</p>
          </ResultCard>

          <ResultCard icon={ListChecks} title="Important information">
            <ul className="space-y-2">{result.important.map((s, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{s}</li>)}</ul>
          </ResultCard>

          <ResultCard icon={Calendar} title="Dates or deadlines">
            <ul className="space-y-2">{result.dates.map((s, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{s}</li>)}</ul>
          </ResultCard>

          <ResultCard icon={Sparkles} title="What you may need to do next">
            <ol className="list-decimal space-y-2 pl-5">{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </ResultCard>

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

          <ResultCard icon={Phone} title="Who to contact">
            <p>{result.contact}</p>
          </ResultCard>

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
