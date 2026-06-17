import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, useI18n, type LanguageCode } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
      <SelectTrigger className="h-11 min-w-[160px] rounded-full border-2 border-primary/30 bg-white text-base font-semibold shadow-sm hover:shadow-md transition-shadow" aria-label={t("language.label")}>
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{currentLang?.flag}</span>
            <span>{currentLang?.nativeName}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} disabled={!lang.active}>
            <span className="flex items-center gap-2 text-base">
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.nativeName}</span>
              {!lang.active && <span className="text-xs text-muted-foreground">({t("language.comingSoon")})</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
