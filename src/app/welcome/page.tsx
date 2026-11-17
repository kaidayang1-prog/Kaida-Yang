"use client";

import { HandHeart, PiggyBank, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { AppMark } from "@/components/AppMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ButtonLink } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";

const FEATURES: { icon: LucideIcon; title: MessageKey; body: MessageKey }[] = [
  { icon: PiggyBank, title: "welcome.featureSaveTitle", body: "welcome.featureSaveBody" },
  { icon: HandHeart, title: "welcome.featureNeighborsTitle", body: "welcome.featureNeighborsBody" },
  { icon: ShieldCheck, title: "welcome.featureSafeTitle", body: "welcome.featureSafeBody" },
];

export default function WelcomePage() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>

      <section className="mt-8 flex flex-col items-start gap-4">
        <AppMark size={64} />
        <p className="text-sm font-semibold tracking-wide text-accent">{t("app.name")}</p>
        <h1 className="text-[28px] font-bold leading-tight text-balance">{t("welcome.title")}</h1>
        <p className="text-[15px] leading-relaxed text-muted">{t("welcome.lead")}</p>
      </section>

      <ul className="mt-8 flex flex-col gap-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-card bg-surface p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{t(title)}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{t(body)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <ButtonLink href="/home" className="w-full">
          {t("welcome.start")}
        </ButtonLink>
        <Link href="/fare" className="py-2 text-center text-sm font-medium text-accent">
          {t("welcome.howFareWorks")}
        </Link>
        <p className="text-center text-xs text-muted">{t("welcome.openToAll")}</p>
      </div>
    </main>
  );
}
