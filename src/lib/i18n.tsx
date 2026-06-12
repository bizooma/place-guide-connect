import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "@/locales/en.json";

// Supported languages. Only English is active for the MVP.
// `code` matches a Languages table in Supabase later.
export type LanguageCode = "en" | "es" | "lang2" | "lang3" | "lang4" | "lang5";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  active: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", active: true },
  { code: "es", name: "Spanish", nativeName: "Español", active: false },
  { code: "lang2", name: "Language 2", nativeName: "Language 2", active: false },
  { code: "lang3", name: "Language 3", nativeName: "Language 3", active: false },
  { code: "lang4", name: "Language 4", nativeName: "Language 4", active: false },
  { code: "lang5", name: "Language 5", nativeName: "Language 5", active: false },
];

type Dict = Record<string, string>;
const dictionaries: Partial<Record<LanguageCode, Dict>> = { en: en as Dict };

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
