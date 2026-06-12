import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Briefcase, Receipt, CalendarDays, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useI18n } from "@/lib/i18n";
import hero from "@/assets/hero-community.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The PLACE Online — Help is closer than you think." },
      { name: "description", content: "Online support inspired by The PLACE in Amarillo. Understand documents, find resources, view classes, connect with help." },
      { property: "og:title", content: "The PLACE Online" },
      { property: "og:description", content: "Help is closer than you think." },
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
      {/* Hero */}
      <section className="bg-hero-warm">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-warm/60 px-3 py-1 text-xs font-medium text-primary-deep">
              <HeartHandshake className="h-3.5 w-3.5 text-accent" /> {t("app.inspiredBy")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] text-primary-deep sm:text-5xl md:text-6xl">
              {t("app.tagline")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/80">
              {t("app.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 rounded-full px-7 text-base bg-primary hover:bg-primary-deep">
                <Link to="/help">{t("cta.help")} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-7 text-base border-primary/30 hover:bg-secondary">
                <Link to="/schedule">{t("cta.schedule")}</Link>
              </Button>
              <InstallAppButton />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-accent/10 blur-2xl" aria-hidden />
            <img
              src={hero}
              alt="People from many backgrounds learning and helping each other at a community table."
              width={1536}
              height={1024}
              className="relative rounded-[2rem] border border-border shadow-lift"
            />
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
