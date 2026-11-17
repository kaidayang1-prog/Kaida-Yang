"use client";

import { MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function NotFound() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <MapPin className="size-10 text-muted" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t("notFound.title")}</h1>
      <p className="text-sm leading-relaxed text-muted">{t("notFound.body")}</p>
      <ButtonLink href="/home">{t("common.goHome")}</ButtonLink>
    </main>
  );
}
