import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { InstallAppButton } from "@/components/InstallAppButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { HeroChat } from "@/components/home/HeroChat";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { useTriageCategories } from "@/hooks/useTriageCategories";

const ASSISTANT_STRINGS = {
  title: "Ask the assistant",
  subtitle: "Get answers based on The PLACE's resources and guides.",
};
import heroBg from "@/assets/find-hero-gentle-valley-1920x600.png.asset.json";
import cardBill from "@/assets/cards/bill.jpg";
import cardJob from "@/assets/cards/job.jpg";
import cardDocument from "@/assets/cards/document.jpg";
import cardEnglish from "@/assets/cards/english.jpg";
import cardNeeds from "@/assets/cards/needs.jpg";
import cardUnsure from "@/assets/cards/unsure.jpg";

const CARD_IMAGES: Record<string, string> = {
  bill: cardBill,
  job: cardJob,
  document: cardDocument,
  english: cardEnglish,
  needs: cardNeeds,
  unsure: cardUnsure,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The PLACE Online — Everyone deserves a PLACE." },
      { name: "description", content: "Online support inspired by The PLACE in Amarillo. Understand documents, find resources, view classes, connect with help." },
      { property: "og:title", content: "The PLACE Online" },
      { property: "og:description", content: "Everyone deserves a PLACE." },
      { property: "og:image", content: "/icon-512.png" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const triageCategories = useTriageCategories();
  const active = triageCategories.filter((c) => c.active).sort((a, b) => a.order - b.order);
  const tx = useTranslatedTexts(Object.values(ASSISTANT_STRINGS));

  return (
    <>
      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 scale-x-[-1]"
          style={{ backgroundImage: `url(${heroBg.url})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-deep/75 via-primary-deep/45 to-primary-deep/25" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <HeartHandshake className="h-3.5 w-3.5 text-accent" /> {t("app.inspiredBy")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl md:text-6xl">
              {t("app.tagline")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              {t("app.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 rounded-full px-7 text-base bg-accent hover:bg-accent/90 text-white">
                <Link to="/help">{t("cta.help")} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-7 text-base border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/schedule">{t("cta.schedule")}</Link>
              </Button>
              <InstallAppButton />
            </div>
          </div>
        </div>
      </section>

      {/* Triage cards */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{t("home.cards.title")}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t("home.cards.subtitle")}</p>
          </div>
          <LanguageSelector />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((cat) => {
            const img = CARD_IMAGES[cat.slug];
            const isDoc = cat.slug === "document";
            return (
              <Link
                key={cat.id}
                to={isDoc ? "/help/document" : "/help"}
                search={isDoc ? undefined : { category: cat.slug }}
                className="group flex w-full items-start gap-4 rounded-2xl border border-white/50 bg-white/40 p-4 text-left shadow-card backdrop-blur-xl backdrop-saturate-150 transition hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-lift focus-visible:-translate-y-0.5"
              >
                {img && (
                  <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <img
                      src={img}
                      alt=""
                      width={512}
                      height={512}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </span>
                )}
                <span className="flex-1 py-1">
                  <span className="block font-display text-lg font-semibold text-primary-deep">{t(`triage.${cat.slug}.title`, cat.title)}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{t(`triage.${cat.slug}.desc`, cat.description)}</span>
                </span>
                <ArrowRight className="mt-2 h-5 w-5 text-accent transition group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Ask the assistant */}
      <section className="bg-secondary/40 border-y border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
          <div className="mb-6 text-center">
            <h2 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">{tx(ASSISTANT_STRINGS.title)}</h2>
            <p className="mt-2 text-muted-foreground">{tx(ASSISTANT_STRINGS.subtitle)}</p>
          </div>
          <HeroChat />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <Disclaimer tone="warn">{t("disclaimer.compassion")}</Disclaimer>
      </section>
    </>
  );
}
