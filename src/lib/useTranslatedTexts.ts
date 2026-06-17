import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";
import { useI18n, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";

const CACHE_PREFIX = "tx:v1:";

function loadCache(lang: LanguageCode): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_PREFIX + lang) ?? "{}");
  } catch {
    return {};
  }
}

function saveCache(lang: LanguageCode, cache: Record<string, string>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(cache));
  } catch {
    // quota exceeded — ignore
  }
}

/**
 * Translate a list of source strings into the active language.
 * Returns a lookup function: tx(sourceText) -> translated (or source while loading).
 * Caches per language in localStorage so repeat visits are instant.
 */
export function useTranslatedTexts(texts: (string | undefined | null)[]) {
  const { language } = useI18n();
  const run = useServerFn(translateBatch);

  const targetName = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name ?? "English",
    [language],
  );

  const unique = useMemo(() => {
    const set = new Set<string>();
    for (const t of texts) {
      const s = (t ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set);
  }, [texts]);

  const [map, setMap] = useState<Record<string, string>>(() =>
    language === "en" ? {} : loadCache(language),
  );

  useEffect(() => {
    if (language === "en") {
      setMap({});
      return;
    }
    const cache = loadCache(language);
    setMap(cache);
    const missing = unique.filter((s) => !cache[s]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await run({ data: { texts: missing, target: targetName } });
        if (cancelled) return;
        const next = { ...cache };
        missing.forEach((src, i) => {
          next[src] = result[i] ?? src;
        });
        saveCache(language, next);
        setMap(next);
      } catch (err) {
        console.error("translate failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // unique is derived from texts; stringify to stabilize dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, targetName, unique.join("\u0001")]);

  return useMemo(() => {
    return (src: string | undefined | null) => {
      const s = (src ?? "").trim();
      if (!s) return src ?? "";
      if (language === "en") return s;
      return map[s] ?? s;
    };
  }, [map, language]);
}
