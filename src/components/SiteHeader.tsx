import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Languages, Home, HeartHandshake, CalendarDays, BookOpen, Info, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";

const nav = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/help", labelKey: "nav.help", icon: HeartHandshake },
  { to: "/schedule", labelKey: "nav.schedule", icon: CalendarDays },
  { to: "/resources", labelKey: "nav.resources", icon: BookOpen },
  { to: "/about", labelKey: "nav.about", icon: Info },
  { to: "/admin", labelKey: "nav.admin", icon: Shield },
] as const;

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-warm/85 backdrop-blur supports-[backdrop-filter]:bg-warm/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label={t("app.name")}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition group-hover:scale-105">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold text-primary-deep">The PLACE</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-accent">Online</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-primary-deep/80 hover:bg-secondary hover:text-primary-deep",
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSelector />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-11 w-11"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-warm">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium",
                    active ? "bg-primary text-primary-foreground" : "text-primary-deep hover:bg-secondary",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center gap-2 px-2">
              <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
              <LanguageSelector />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
