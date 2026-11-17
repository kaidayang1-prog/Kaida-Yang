"use client";

import { useEffect, type ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { isNativeApp } from "@/lib/platform";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ServiceWorkerRegistration />
      {children}
    </I18nProvider>
  );
}

/** 只在正式构建的网页版注册 service worker（推送通知、离线页）；开发模式和 APP 里不注册 */
function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || isNativeApp() || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // 注册失败不影响使用，只是没有推送和离线页
    });
  }, []);
  return null;
}
