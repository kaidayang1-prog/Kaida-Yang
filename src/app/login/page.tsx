"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SetupNotice } from "@/components/StatusScreens";
import { Button, FieldError, inputClass } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pendingPhone } from "@/lib/auth/pendingPhone";
import { errorMessageKey } from "@/lib/errors";
import { normalizeNanpPhone } from "@/lib/phone";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { status } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === "signedIn") router.replace("/");
  }, [status, router]);

  if (status === "unconfigured") return <SetupNotice />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeNanpPhone(phone);
    if (!normalized) {
      setError("auth.invalidPhone");
      return;
    }
    setSending(true);
    setError(null);
    const { error: otpError } = await supabase().auth.signInWithOtp({ phone: normalized });
    setSending(false);
    if (otpError) {
      setError(errorMessageKey(otpError));
      return;
    }
    pendingPhone.set(normalized);
    router.push("/login/verify");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <AppHeader title={t("auth.loginTitle")} back />
      <main className="flex flex-col gap-5 px-4 py-6">
        <p className="text-[15px] leading-relaxed text-muted">{t("auth.loginLead")}</p>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <label htmlFor="phone" className="text-sm font-medium">
            {t("auth.phoneLabel")}
          </label>
          <div className="flex items-center gap-2">
            <span className="flex min-h-12 items-center rounded-xl border border-line bg-surface-2 px-3 text-base tabular-nums text-muted">
              +1
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("auth.phonePlaceholder")}
              className={`${inputClass} tabular-nums`}
              aria-invalid={error === "auth.invalidPhone"}
              aria-describedby="phone-hint"
            />
          </div>
          <p id="phone-hint" className="text-xs text-muted">
            {t("auth.phoneHint")}
          </p>
          <FieldError>{error ? t(error) : null}</FieldError>
          <Button type="submit" disabled={sending || phone.trim() === ""} className="mt-2 w-full">
            {sending ? t("auth.sending") : t("auth.sendCode")}
          </Button>
        </form>
        <p className="text-xs leading-relaxed text-muted">{t("auth.agree")}</p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">{t("auth.devHint")}</p>
        ) : null}
      </main>
    </div>
  );
}
