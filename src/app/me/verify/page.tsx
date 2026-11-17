"use client";

import { BadgeCheck, Home, Phone, type LucideIcon } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CommunityJoin } from "@/components/community/CommunityJoin";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, SectionTitle } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMyCommunities } from "@/lib/community/useMyCommunities";

const LEVELS: { level: "phone" | "neighbor" | "full"; icon: LucideIcon; title: MessageKey; body: MessageKey }[] = [
  { level: "phone", icon: Phone, title: "verify.phoneTitle", body: "verify.phoneBody" },
  { level: "neighbor", icon: Home, title: "verify.neighborTitle", body: "verify.neighborBody" },
  { level: "full", icon: BadgeCheck, title: "verify.fullTitle", body: "verify.fullBody" },
];

/** 认证与社区：三个等级的说明 + 加入小区或学校。完整认证（实名和驾照）先只留入口。 */
export default function VerifyCenterPage() {
  return (
    <RequireAuth>
      <VerifyCenter />
    </RequireAuth>
  );
}

function VerifyCenter() {
  const t = useT();
  const { profile } = useAuth();
  const { communities, reload } = useMyCommunities();
  if (!profile) return null;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <AppHeader title={t("verify.title")} back />
      <main className="flex flex-col gap-6 px-4 py-4">
        <ol className="flex flex-col gap-2">
          {LEVELS.map(({ level, icon: Icon, title, body }) => {
            const current = profile.verification_level === level;
            return (
              <li
                key={level}
                className={`flex gap-3 rounded-card border p-4 ${current ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${current ? "text-accent" : "text-muted"}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t(title)}
                    {current ? <span className="ml-2 text-xs font-medium text-accent">{t("verify.current")}</span> : null}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{t(body)}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("verify.joinMore")}</SectionTitle>
          <Card>
            <CommunityJoin joined={communities ?? []} onJoined={reload} />
          </Card>
        </section>
      </main>
    </div>
  );
}
