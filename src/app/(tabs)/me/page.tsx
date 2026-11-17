"use client";

import { Calculator, ChevronRight, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, FieldError, SectionTitle, Segmented } from "@/components/ui";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale, MessageKey } from "@/i18n/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePreferenceSetters } from "@/lib/auth/usePreferenceSetters";
import { useMyCommunities } from "@/lib/community/useMyCommunities";
import { errorMessageKey } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { useRole, type Role } from "@/lib/preferences";
import { supabase } from "@/lib/supabase/client";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

const SOURCE_LABEL: Record<string, MessageKey> = {
  address: "me.sourceAddress",
  school_email: "me.sourceSchoolEmail",
  admin: "me.sourceAdmin",
};

export default function MePage() {
  const { t, locale } = useI18n();
  const { profile, session, signOut } = useAuth();
  const { setLocale, setRole } = usePreferenceSetters();
  const [role] = useRole();
  const { communities } = useMyCommunities();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  if (!profile) return null;

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    const { error: rpcError } = await supabase().rpc("delete_my_account");
    if (rpcError) {
      setDeleting(false);
      setConfirmDelete(false);
      setError(errorMessageKey(rpcError));
      return;
    }
    await signOut();
    router.replace("/welcome");
  }

  return (
    <>
      <AppHeader title={t("me.title")} />
      <main className="flex flex-col gap-6 px-4 py-4">
        <Card className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{profile.display_name}</p>
            <p className="text-sm text-muted tabular-nums">{maskPhone(session?.user.phone)}</p>
          </div>
          <VerificationBadge level={profile.verification_level} />
        </Card>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("me.myCommunities")}</SectionTitle>
          <Card padded={false} className="flex flex-col">
            {communities && communities.length > 0 ? (
              <ul>
                {communities.map((community) => (
                  <li key={community.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <span className="font-medium">{locale === "zh" ? community.name_zh : community.name_en}</span>
                    <span className="text-xs text-muted">{t(SOURCE_LABEL[community.source])}</span>
                  </li>
                ))}
              </ul>
            ) : communities ? (
              <p className="border-b border-line px-4 py-3 text-sm leading-relaxed text-muted">{t("me.noCommunity")}</p>
            ) : null}
            <Link href="/me/verify" className="flex min-h-14 items-center gap-3 px-4">
              <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
              <span className="flex-1">{t("me.verifyCenter")}</span>
              <ChevronRight className="size-5 text-muted" aria-hidden="true" />
            </Link>
          </Card>
        </section>

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
          <Card padded={false}>
            <Link href="/fare" className="flex min-h-14 items-center gap-3 px-4">
              <Calculator className="size-5 text-accent" aria-hidden="true" />
              <span className="flex-1">{t("me.howFareWorks")}</span>
              <ChevronRight className="size-5 text-muted" aria-hidden="true" />
            </Link>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("me.account")}</SectionTitle>
          <Card padded={false}>
            <button type="button" onClick={() => void signOut()} className="flex min-h-14 w-full items-center gap-3 border-b border-line px-4 text-left">
              <LogOut className="size-5 text-muted" aria-hidden="true" />
              <span className="flex-1">{t("me.signOut")}</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-danger"
            >
              <Trash2 className="size-5" aria-hidden="true" />
              <span className="flex-1">{t("me.deleteAccount")}</span>
            </button>
          </Card>
          <FieldError>{error ? t(error) : null}</FieldError>
          <p className="text-center text-xs text-muted">{t("common.version", { version: APP_VERSION })}</p>
        </section>
      </main>

      <ConfirmDialog
        open={confirmDelete}
        title={t("me.deleteTitle")}
        body={t("me.deleteBody")}
        confirmLabel={deleting ? t("me.deleting") : t("me.deleteConfirm")}
        cancelLabel={t("me.cancel")}
        busy={deleting}
        onConfirm={() => void deleteAccount()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
