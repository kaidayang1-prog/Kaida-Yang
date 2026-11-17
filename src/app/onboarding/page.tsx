"use client";

import { Car, CheckCircle2, UserRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CommunityJoin } from "@/components/community/CommunityJoin";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoadError, SetupNotice, Splash } from "@/components/StatusScreens";
import { Button, FieldError, inputClass } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMyCommunities } from "@/lib/community/useMyCommunities";
import { errorMessageKey } from "@/lib/errors";
import type { Role } from "@/lib/preferences";

type Step = "name" | "role" | "community" | "done";
const STEPS: Step[] = ["name", "role", "community", "done"];

/** 注册引导：昵称 → 主要身份 → 加入小区或学校 → 完成 */
export default function OnboardingPage() {
  const { status, profile, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut") router.replace("/welcome");
    else if (status === "signedIn" && profile?.onboarded_at) router.replace("/home");
  }, [status, profile, router]);

  if (status === "unconfigured") return <SetupNotice />;
  if (status === "error") return <LoadError onRetry={() => void refreshProfile()} />;
  if (status !== "signedIn" || !profile || profile.onboarded_at) return <Splash />;
  return <Onboarding initialName={profile.display_name} initialRole={profile.primary_role ?? "rider"} />;
}

function Onboarding({ initialName, initialRole }: { initialName: string; initialRole: Role }) {
  const { t, locale } = useI18n();
  const { updateProfile } = useAuth();
  const router = useRouter();
  const { communities, reload } = useMyCommunities();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState<Role>(initialRole);
  const [error, setError] = useState<MessageKey | null>(null);
  const [saving, setSaving] = useState(false);

  const index = STEPS.indexOf(step);
  const goBack = () => setStep(STEPS[Math.max(0, index - 1)]);

  function submitName(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setError("onboarding.nameInvalid");
      return;
    }
    setError(null);
    setName(trimmed);
    setStep("role");
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        display_name: name.trim(),
        primary_role: role,
        active_role: role,
        locale,
        onboarded_at: new Date().toISOString(),
      });
      router.replace("/home");
    } catch (caught) {
      setError(errorMessageKey(caught));
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted tabular-nums">
          {t("onboarding.stepOf", { step: Math.min(index + 1, 3), total: 3 })}
        </p>
        <LanguageToggle />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 rounded-full ${i <= index ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      {step === "name" ? (
        <form onSubmit={submitName} className="mt-8 flex flex-1 flex-col gap-4" noValidate>
          <h1 className="text-2xl font-bold text-balance">{t("onboarding.nameTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t("onboarding.nameLead")}</p>
          <label htmlFor="display-name" className="text-sm font-medium">
            {t("onboarding.nameLabel")}
          </label>
          <input
            id="display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("onboarding.namePlaceholder")}
            maxLength={30}
            autoComplete="nickname"
            className={inputClass}
          />
          <FieldError>{error ? t(error) : null}</FieldError>
          <Button type="submit" className="mt-auto w-full" disabled={name.trim() === ""}>
            {t("onboarding.next")}
          </Button>
        </form>
      ) : null}

      {step === "role" ? (
        <section className="mt-8 flex flex-1 flex-col gap-4">
          <h1 className="text-2xl font-bold text-balance">{t("onboarding.roleTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t("onboarding.roleLead")}</p>
          <div role="radiogroup" aria-label={t("onboarding.roleTitle")} className="flex flex-col gap-3">
            <RoleCard
              icon={UserRound}
              selected={role === "rider"}
              title={t("onboarding.riderTitle")}
              body={t("onboarding.riderBody")}
              onSelect={() => setRole("rider")}
            />
            <RoleCard
              icon={Car}
              selected={role === "driver"}
              title={t("onboarding.driverTitle")}
              body={t("onboarding.driverBody")}
              onSelect={() => setRole("driver")}
            />
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={goBack}>
              {t("onboarding.back")}
            </Button>
            <Button onClick={() => setStep("community")}>{t("onboarding.next")}</Button>
          </div>
        </section>
      ) : null}

      {step === "community" ? (
        <section className="mt-8 flex flex-1 flex-col gap-4">
          <h1 className="text-2xl font-bold text-balance">{t("onboarding.communityTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t("onboarding.communityLead")}</p>
          <CommunityJoin joined={communities ?? []} onJoined={reload} />
          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <Button variant="secondary" onClick={goBack}>
              {t("onboarding.back")}
            </Button>
            <Button onClick={() => setStep("done")}>
              {communities && communities.length > 0 ? t("onboarding.next") : t("onboarding.skip")}
            </Button>
          </div>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="mt-8 flex flex-1 flex-col gap-4">
          <CheckCircle2 className="size-12 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold">{t("onboarding.doneTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            {communities && communities.length > 0 ? t("onboarding.doneLead") : t("onboarding.doneNoCommunity")}
          </p>
          <FieldError>{error ? t(error) : null}</FieldError>
          <div className="mt-auto grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={goBack} disabled={saving}>
              {t("onboarding.back")}
            </Button>
            <Button onClick={() => void finish()} disabled={saving}>
              {saving ? t("onboarding.saving") : t("onboarding.finish")}
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function RoleCard({
  icon: Icon,
  selected,
  title,
  body,
  onSelect,
}: {
  icon: LucideIcon;
  selected: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-card border-2 p-4 text-left transition-colors ${
        selected ? "border-accent bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          selected ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted">{body}</span>
      </span>
    </button>
  );
}
