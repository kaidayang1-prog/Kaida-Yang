"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

/** 没有网络时 service worker 显示这一页 */
export default function OfflinePage() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-10 text-muted" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t("offline.title")}</h1>
      <p className="text-sm leading-relaxed text-muted">{t("offline.body")}</p>
      <Button onClick={() => window.location.reload()}>{t("common.retry")}</Button>
    </main>
  );
}
