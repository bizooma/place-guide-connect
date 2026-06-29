import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, Globe, MapPin, Search, ExternalLink, Clock, Languages as LanguagesIcon, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { resourceCategories } from "@/data/mock";
import { supabase } from "@/integrations/supabase/client";
import { categoryImage } from "@/lib/resourceCategoryImage";
import jacksonLogo from "@/assets/jackson-logo.png.asset.json";
import jacksonPortrait from "@/assets/jackson-portrait.jpg.asset.json";


export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — The PLACE Online" },
      { name: "description", content: "Community resources for food, housing, jobs, health, legal help, and more." },
      { property: "og:title", content: "Resources — The PLACE Online" },
      { property: "og:description", content: "Find help in your community." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { t, language } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [lang, setLang] = useState("All");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const langs = useMemo(
    () => Array.from(new Set(resources.flatMap((r) => r.languages ?? []))),
    [resources]
  );

  // Build override map from DB translations for the active language.
  const dbOverrides = useMemo(() => {
    const map = new Map<string, string>();
    if (language === "en") return map;
    const fields = ["name", "category", "description", "hours", "eligibility"] as const;
    for (const r of resources as any[]) {
      const tr = r.translations?.[language];
      if (!tr) continue;
      for (const f of fields) {
        const src = r[f];
        const dst = tr[f];
        if (typeof src === "string" && typeof dst === "string" && src && dst) {
          map.set(src, dst);
        }
      }
    }
    return map;
  }, [resources, language]);

  const allTexts = useMemo(() => {
    const out: string[] = [];
    for (const r of resources) {
      if (r.name && !dbOverrides.has(r.name)) out.push(r.name);
      if (r.category && !dbOverrides.has(r.category)) out.push(r.category);
      if (r.description && !dbOverrides.has(r.description)) out.push(r.description);
      if (r.hours && !dbOverrides.has(r.hours)) out.push(r.hours);
      if (r.eligibility && !dbOverrides.has(r.eligibility)) out.push(r.eligibility);
    }
    for (const c of resourceCategories) out.push(c);
    out.push(
      "Your U.S. Congressman",
      "Need help with a federal agency?",
      "Congressman Ronny Jackson's office can help residents of Texas's 13th District with issues involving federal agencies — including immigration, Social Security, veterans' benefits, IRS, and more.",
      "Request help from his office",
      "Amarillo Office",
    );
    return out;
  }, [resources, dbOverrides]);
  const txAi = useTranslatedTexts(allTexts);
  const tx = (s: string | null | undefined) => {
    if (!s) return s ?? "";
    return dbOverrides.get(s) ?? txAi(s);
  };

  const filtered = useMemo(
    () =>
      resources.filter((r) => {
        if (cat !== "All" && r.category !== cat) return false;
        if (lang !== "All" && !(r.languages ?? []).includes(lang)) return false;
        if (q) {
          const text = (r.name + " " + r.description + " " + (r.tags ?? []).join(" ")).toLowerCase();
          if (!text.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [q, cat, lang, resources]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <header>
        <h1 className="font-display text-4xl font-semibold text-primary-deep md:text-5xl">{t("resources.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("resources.subtitle")}</p>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("resources.search")} className="h-12 pl-9 rounded-full" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-12 rounded-full border border-input bg-background px-4 text-sm">
          <option value="All">{t("resources.allCategories")}</option>
          {resourceCategories.map((c) => <option key={c} value={c}>{tx(c)}</option>)}
        </select>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-12 rounded-full border border-input bg-background px-4 text-sm">
          <option value="All">{t("resources.allLanguages")}</option>
          {langs.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="col-span-full text-muted-foreground">{t("resources.loading")}</p>}
        {!isLoading && filtered.length === 0 && <p className="col-span-full text-muted-foreground">{t("resources.none")}</p>}
        {filtered.map((r) => (
          <article key={r.id} className="surface-card flex flex-col p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">{tx(r.category)}</span>
            <h3 className="mt-1 font-display text-xl font-semibold text-primary-deep">{tx(r.name)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tx(r.description)}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {r.hours && <li className="text-muted-foreground">{tx(r.hours)}</li>}
              {r.address && <li className="text-muted-foreground">{r.address}</li>}
              <li className="text-muted-foreground">{t("resources.languages")}: {(r.languages ?? []).join(", ")}</li>
              <li className="text-muted-foreground">{t("resources.cost")}: {r.cost}{r.eligibility ? ` · ${tx(r.eligibility)}` : ""}</li>
            </ul>
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {r.phone && <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary-deep gap-1.5"><a href={`tel:${r.phone}`}><Phone className="h-3.5 w-3.5" />{t("resources.call")}</a></Button>}
              {r.website && <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5"><a href={r.website} target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" />{t("resources.website")}</a></Button>}
              {r.address && <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5"><a href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`} target="_blank" rel="noreferrer"><MapPin className="h-3.5 w-3.5" />{t("resources.directions")}</a></Button>}
            </div>
          </article>
        ))}
      </div>

      <section className="mt-16 surface-card overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[auto_1fr]">
          <div className="bg-warm flex items-center justify-center p-6 md:p-8">
            <img
              src={jacksonPortrait.url}
              alt="Congressman Ronny Jackson"
              className="h-48 w-48 md:h-56 md:w-56 rounded-full object-cover shadow-md ring-4 ring-background"
              loading="lazy"
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <img
              src={jacksonLogo.url}
              alt="Ronny Jackson, Congressman for Texas 13"
              className="h-14 w-auto self-start"
              loading="lazy"
            />
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                {tx("Your U.S. Congressman")}
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold text-primary-deep md:text-3xl">
                {tx("Need help with a federal agency?")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {tx(
                  "Congressman Ronny Jackson's office can help residents of Texas's 13th District with issues involving federal agencies — including immigration, Social Security, veterans' benefits, IRS, and more."
                )}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                <div>
                  <div className="font-medium text-foreground">{tx("Amarillo Office")}</div>
                  <div>620 South Taylor St., Suite 200</div>
                  <div>Amarillo, TX 79101</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0 text-accent" />
                <a href="tel:+18066415600" className="hover:text-primary-deep">(806) 641-5600</a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild className="rounded-full bg-primary hover:bg-primary-deep gap-1.5">
                <a href="https://jackson.house.gov/services/help-federal-agency.htm" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {tx("Request help from his office")}
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full gap-1.5">
                <a href="tel:+18066415600">
                  <Phone className="h-3.5 w-3.5" />
                  {t("resources.call")}
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full gap-1.5">
                <a
                  href="https://maps.google.com/?q=620+South+Taylor+St+Suite+200+Amarillo+TX+79101"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {t("resources.directions")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
