import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useI18n } from "@/lib/i18n";
import { triageCategories } from "@/data/mock";
import heroBg from "@/assets/place-computer-lab.jpg.asset.json";

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

const features = [
  { icon: FileText, titleKey: "feature.document.title", descKey: "feature.document.desc", to: "/help/document" },
  { icon: Briefcase, titleKey: "feature.job.title", descKey: "feature.job.desc", to: "/help" },
  { icon: Receipt, titleKey: "feature.bill.title", descKey: "feature.bill.desc", to: "/help" },
  { icon: CalendarDays, titleKey: "feature.classes.title", descKey: "feature.classes.desc", to: "/schedule" },
] as const;

function HomePage() {
  const { t } = useI18n();
  return (
    <>
      {/* Hero with background image */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: `url(${heroBg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-primary-deep/85" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-28">
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

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="font-display text-3xl font-semibold text-primary-deep md:text-4xl">What can we help with?</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Tap any card to get started. You don't have to know exactly what you need.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.titleKey}
              to={f.to}
              className="group surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:-translate-y-0.5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary-deep transition group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-primary-deep">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Start <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <Disclaimer tone="warn">{t("disclaimer.compassion")}</Disclaimer>
      </section>
    </>
  );
}
