"use client";

import { Calculator, ChevronRight, UserRound } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Card, SectionTitle, Segmented } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/types";
import { useRole, type Role } from "@/lib/preferences";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

export default function MePage() {
  const { t, locale, setLocale } = useI18n();
  const [role, setRole] = useRole();

  return (
    <>
      <AppHeader title={t("me.title")} />
      <main className="flex flex-col gap-6 px-4 py-4">
        <Card className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
            <UserRound className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t("me.guest")}</p>
            <p className="text-sm text-muted">{t("me.guestHint")}</p>
          </div>
        </Card>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("me.settings")}</SectionTitle>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t("common.languageLabel")}</p>
              <Segmented<Locale>
                label={t("common.languageLabel")}
                value={locale}
                onChange={setLocale}
                options={[
                  { value: "zh", label: t("common.switchToChinese") },
                  { value: "en", label: t("common.switchToEnglish") },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">{t("roles.switchLabel")}</p>
              <Segmented<Role>
                label={t("roles.switchLabel")}
                value={role}
                onChange={setRole}
                options={[
                  { value: "rider", label: t("roles.rider") },
                  { value: "driver", label: t("roles.driver") },
                ]}
              />
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("me.about")}</SectionTitle>
          <Card className="p-0">
            <Link href="/fare" className="flex min-h-14 items-center gap-3 px-4">
              <Calculator className="size-5 text-accent" aria-hidden="true" />
              <span className="flex-1">{t("me.howFareWorks")}</span>
              <ChevronRight className="size-5 text-muted" aria-hidden="true" />
            </Link>
          </Card>
          <p className="text-center text-xs text-muted">{t("common.version", { version: APP_VERSION })}</p>
        </section>
      </main>
    </>
  );
}
