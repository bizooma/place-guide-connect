import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, useI18n, type LanguageCode } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
      <SelectTrigger className="h-10 min-w-[150px] rounded-full" aria-label={t("language.label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} disabled={!lang.active}>
            <span className="flex items-center gap-2">
              {lang.nativeName}
              {!lang.active && <span className="text-xs text-muted-foreground">({t("language.comingSoon")})</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
