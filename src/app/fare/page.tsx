"use client";

import { AppHeader } from "@/components/AppHeader";
import { useT } from "@/i18n/I18nProvider";
import { FareCalculator } from "./FareCalculator";

/** 油费怎么算：公式说明 + 可以改数字的示例（默认是需求里的测试数据） */
export default function FarePage() {
  const t = useT();
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <AppHeader title={t("fare.title")} back />
      <main className="flex flex-col gap-4 px-4 py-4">
        <p className="text-[15px] leading-relaxed">{t("fare.intro")}</p>
        <FareCalculator />
      </main>
    </div>
  );
}
