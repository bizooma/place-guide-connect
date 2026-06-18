import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, BookOpen, Heart, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/help", label: "Help", icon: HelpCircle },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/donate", label: "Donate", icon: Heart },
] as const;

export function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Bottom navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-accent/95 backdrop-blur supports-[backdrop-filter]:bg-accent/85 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map((item) => {
          const active =
            pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          const Icon = item.icon;
          // Fallback label if translation key is missing
          const rawLabel = t(item.labelKey);
          const label = rawLabel === item.labelKey ? item.to.replace("/", "") || "Home" : rawLabel;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex h-full min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary-foreground" : "text-white/70 hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-transparent",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="truncate max-w-full leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
