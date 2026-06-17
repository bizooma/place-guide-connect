import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import logoAsset from "@/assets/theplace-logo.webp.asset.json";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-border/60 bg-primary-deep text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <img
            src={logoAsset.url}
            alt="The PLACE Online"
            className="h-10 w-auto object-contain"
          />
          <p className="mt-3 text-sm text-primary-foreground/80">{t("app.inspiredBy")}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-primary-foreground/60">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/help" className="hover:underline">{t("nav.help")}</Link></li>
            <li><Link to="/schedule" className="hover:underline">{t("nav.schedule")}</Link></li>
            <li><Link to="/resources" className="hover:underline">{t("nav.resources")}</Link></li>
            <li><Link to="/about" className="hover:underline">{t("nav.about")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-primary-foreground/60">Trust</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms & Responsible Use</Link></li>
          </ul>
          <p className="mt-4 text-xs text-primary-foreground/60">{t("disclaimer.compassion")}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-foreground/60">© {new Date().getFullYear()} The PLACE Online</p>
      </div>
    </footer>
  );
}
