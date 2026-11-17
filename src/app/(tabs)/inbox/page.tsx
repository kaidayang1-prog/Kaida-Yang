"use client";

import { MessageCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function InboxPage() {
  const t = useT();
  return (
    <>
      <AppHeader title={t("inbox.title")} />
      <main className="px-4 py-4">
        <EmptyState icon={<MessageCircle />}>{t("inbox.empty")}</EmptyState>
      </main>
    </>
  );
}
