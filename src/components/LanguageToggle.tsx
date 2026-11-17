"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

/** 右上角的语言切换：中文界面显示“English”，英文界面显示“中文” */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "zh" ? "en" : "zh";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-fg"
      lang={next === "zh" ? "zh-CN" : "en"}
    >
      <Languages className="size-4" aria-hidden="true" />
      {next === "en" ? t("common.switchToEnglish") : t("common.switchToChinese")}
    </button>
  );
}
