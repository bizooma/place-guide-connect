import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { ArrowRight, ArrowLeft, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/Disclaimer";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { useI18n } from "@/lib/i18n";
import { triageCategories, triageFlows, resources } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "How Can We Help You? — The PLACE Online" },
      { name: "description", content: "Pick what's closest to your situation and we'll walk through it together." },
      { property: "og:title", content: "How Can We Help You? — The PLACE Online" },
      { property: "og:description", content: "Guided help in plain English." },
    ],
  }),
  validateSearch: (search) => ({
    category: (search.category as string | undefined) ?? undefined,
  }),
  component: HelpPage,
});

function HelpPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = useSearch({ from: "/help" });
  const [selected, setSelected] = useState<string | null>(search.category ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const active = triageCategories.filter((c) => c.active).sort((a, b) => a.order - b.order);
  const flow = selected ? triageFlows[selected] : null;

  function reset() {
    setSelected(null); setAnswers({}); setSubmitted(false);
    navigate({ to: "/help", search: {} });
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("help.title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("help.subtitle")}</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((cat) => {
            const Icon = (Icons as any)[cat.icon] ?? Icons.HelpCircle;
            const isDoc = cat.slug === "document";
            return (
              <button
                key={cat.id}
                onClick={() => isDoc ? navigate({ to: "/help/document" }) : setSelected(cat.slug)}
                className="surface-card group flex w-full items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:-translate-y-0.5"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary-deep transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold text-primary-deep">{cat.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{cat.description}</span>
                </span>
                <ArrowRight className="mt-2 h-5 w-5 text-accent transition group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <Disclaimer>{t("disclaimer.compassion")}</Disclaimer>
        </div>
      </div>
    );
  }

  if (!flow) return null;

  if (submitted) {
    const result = flow.summary(answers);
    const matched = resources.filter((r) => r.tags.some((tag) => result.relatedTags.includes(tag))).slice(0, 3);
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <Button variant="ghost" onClick={reset} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> Start over</Button>

        <div className="surface-card p-6 md:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold text-primary-deep">Here's what we heard</h1>
            <div className="ml-auto"><ReadAloudButton text={result.summary + ". Next steps: " + result.nextSteps.join(". ")} /></div>
          </div>
          <p className="mt-4 text-lg leading-relaxed">{result.summary}</p>

          <h2 className="mt-7 font-display text-lg font-semibold text-primary-deep">What you can do next</h2>
          <ul className="mt-2 space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-base"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{s}</li>
            ))}
          </ul>

          {matched.length > 0 && (
            <>
              <h2 className="mt-7 font-display text-lg font-semibold text-primary-deep">Helpful resources</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {matched.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border bg-warm/50 p-4">
                    <p className="font-medium text-primary-deep">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                    {r.phone && <a href={`tel:${r.phone}`} className="mt-2 inline-block text-sm font-medium text-accent">{r.phone}</a>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="rounded-full bg-primary hover:bg-primary-deep"><Link to="/resources">{t("cta.contact")}</Link></Button>
            <Button variant="outline" className="rounded-full" onClick={() => toast.success("Summary saved on this device.")}>{t("cta.save")}</Button>
          </div>
        </div>

        <Disclaimer className="mt-6">{t("disclaimer.ai")}</Disclaimer>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      <Button variant="ghost" onClick={reset} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>

      <div className="surface-card p-6 md:p-8">
        <h1 className="font-display text-2xl font-semibold text-primary-deep">{triageCategories.find((c) => c.slug === selected)?.title}</h1>
        <p className="mt-2 text-muted-foreground">{flow.intro}</p>

        <form
          className="mt-6 space-y-6"
          onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
        >
          {flow.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id} className="text-base font-medium">{q.label}</Label>
              {q.type === "text" ? (
                <div className="flex gap-2">
                  <Input
                    id={q.id}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="h-12 text-base"
                  />
                  <VoiceInputButton onTranscript={(text) => setAnswers((a) => ({ ...a, [q.id]: text }))} />
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options?.map((opt) => {
                    const active = answers[q.id] === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={"rounded-2xl border px-4 py-3 text-left text-base transition " + (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-warm/40 hover:border-primary/40")}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <Button type="submit" size="lg" className="w-full rounded-full bg-primary hover:bg-primary-deep h-12 text-base">
            See my summary <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
