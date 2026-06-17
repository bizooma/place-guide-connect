import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fa from "@/locales/fa.json";
import ps from "@/locales/ps.json";
import so from "@/locales/so.json";
import ar from "@/locales/ar.json";

// Supported languages
// `code` matches a Languages table in Supabase later.
export type LanguageCode = "en" | "es" | "fa" | "ps" | "so" | "ar";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  active: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", active: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", active: true },
  { code: "fa", name: "Dari", nativeName: "دری", flag: "🇦🇫", active: true },
  { code: "ps", name: "Pashto", nativeName: "پښتو", flag: "🇦🇫", active: true },
  { code: "so", name: "Somali", nativeName: "Soomaali", flag: "🇸🇴", active: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", active: true },
];

type Dict = Record<string, string>;
const dictionaries: Partial<Record<LanguageCode, Dict>> = {
  en: en as Dict,
  es: es as Dict,
  fa: fa as Dict,
  ps: ps as Dict,
  so: so as Dict,
  ar: ar as Dict,
};

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  const setLanguage = useCallback((code: LanguageCode) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (!lang?.active) return; // Only allow active languages for now
    setLanguageState(code);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = dictionaries[language] ?? dictionaries.en ?? {};
      return dict[key] ?? fallback ?? key;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
