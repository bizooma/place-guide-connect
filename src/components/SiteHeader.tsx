import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Languages, Home, HeartHandshake, CalendarDays, BookOpen, Info, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import logoAsset from "@/assets/theplace-logowhite.webp.asset.json";

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-accent backdrop-blur supports-[backdrop-filter]:bg-accent/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label={t("app.name")}>
          <img
            src={logoAsset.url}
            alt="The PLACE Online"
            className="h-10 w-auto max-w-[220px] object-contain"
          />
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
                    : "text-white/90 hover:bg-white/10 hover:text-white",
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
          className="lg:hidden h-11 w-11 text-white hover:bg-white/10"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-accent">
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
                    active ? "bg-primary text-primary-foreground" : "text-white/90 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center gap-2 px-2">
              <Languages className="h-4 w-4 text-white/70" aria-hidden />
              <LanguageSelector />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
