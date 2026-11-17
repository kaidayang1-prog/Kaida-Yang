"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";

/** 页面顶部标题栏：吸顶，避开刘海屏的安全区域 */
export function AppHeader({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const t = useT();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-4">
        {back ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-fg"
            aria-label={t("common.back")}
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  );
}
