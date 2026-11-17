"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { createPersistentStore, usePersistentValue } from "@/lib/persistentStore";
import { en } from "./en";
import { translate } from "./translate";
import type { Locale, MessageKey, Messages, MessageVars } from "./types";
import { zh } from "./zh";

const DICTIONARIES: Record<Locale, Messages> = { zh, en };

/** 语言先存在本机；登录后（M1）同步到用户资料 */
export const localeStore = createPersistentStore<Locale>(
  "carpool.locale",
  "zh",
  (value): value is Locale => value === "zh" || value === "en",
);

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: MessageVars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = usePersistentValue(localeStore);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: MessageVars) => translate(DICTIONARIES[locale], key, vars),
    [locale],
  );

  const value = useMemo<I18nValue>(() => ({ locale, setLocale: localeStore.set, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

export function useT() {
  return useI18n().t;
}
