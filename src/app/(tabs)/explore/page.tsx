"use client";

import { Car, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function ExplorePage() {
  const t = useT();
  return (
    <>
      <AppHeader title={t("explore.title")} />
      <main className="flex flex-col gap-4 px-4 py-4">
        <EmptyState icon={<Car />}>{t("explore.empty")}</EmptyState>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("explore.privacyNote")}
        </p>
      </main>
    </>
  );
}
