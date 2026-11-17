"use client";

import { Building2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function CommunityPage() {
  const t = useT();
  return (
    <>
      <AppHeader title={t("community.title")} />
      <main className="px-4 py-4">
        <EmptyState icon={<Building2 />}>{t("community.empty")}</EmptyState>
      </main>
    </>
  );
}
