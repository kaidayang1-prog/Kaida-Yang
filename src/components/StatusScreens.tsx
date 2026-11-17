"use client";

import { Database, WifiOff } from "lucide-react";
import { AppMark } from "@/components/AppMark";
import { Button } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

/** 读取登录状态时的启动画面 */
export function Splash() {
  return (
    <main className="flex min-h-dvh items-center justify-center" aria-busy="true">
      <AppMark size={72} className="animate-pulse" />
    </main>
  );
}

/** 本地还没配置 Supabase 时的提示（只有开发时会看到） */
export function SetupNotice() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Database className="size-10 text-muted" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t("setup.title")}</h1>
      <p className="text-sm leading-relaxed text-muted">{t("setup.body")}</p>
    </main>
  );
}

/** 资料加载失败（通常是网络问题） */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-10 text-muted" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-muted">{t("auth.errors.network")}</p>
      <Button onClick={onRetry}>{t("common.retry")}</Button>
    </main>
  );
}
