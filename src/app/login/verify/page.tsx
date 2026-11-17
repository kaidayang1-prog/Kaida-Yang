"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Splash } from "@/components/StatusScreens";
import { Button, FieldError, Notice, inputClass } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { pendingPhone } from "@/lib/auth/pendingPhone";
import { errorMessageKey } from "@/lib/errors";
import { formatPhone } from "@/lib/phone";
import { supabase } from "@/lib/supabase/client";
import { useIsClient } from "@/lib/useIsClient";

const RESEND_SECONDS = 60;

export default function VerifyPage() {
  const t = useT();
  const router = useRouter();
  const isClient = useIsClient();
  const phone = isClient ? pendingPhone.get() : null;
  const [code, setCode] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const submitted = useRef<string | null>(null);

  // 没有待验证的手机号（比如直接打开了这个页面）：回到输入手机号
  useEffect(() => {
    if (isClient && !phone) router.replace("/login");
  }, [isClient, phone, router]);

  // 重新发送的倒计时
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  if (!phone) return <Splash />;

  async function verify(token: string) {
    if (!phone || verifying || submitted.current === token) return;
    submitted.current = token;
    setVerifying(true);
    setError(null);
    const { error: verifyError } = await supabase().auth.verifyOtp({ phone, token, type: "sms" });
    setVerifying(false);
    if (verifyError) {
      setError(errorMessageKey(verifyError));
      return;
    }
    pendingPhone.clear();
    router.replace("/");
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length < 6) submitted.current = null;
    if (digits.length === 6) void verify(digits);
  }

  async function resend() {
    if (!phone) return;
    setError(null);
    setResent(false);
    const { error: otpError } = await supabase().auth.signInWithOtp({ phone });
    if (otpError) {
      setError(errorMessageKey(otpError));
      return;
    }
    setResent(true);
    setSecondsLeft(RESEND_SECONDS);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    submitted.current = null;
    void verify(code);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <AppHeader title={t("auth.verifyTitle")} back />
      <main className="flex flex-col gap-5 px-4 py-6">
        <p className="text-[15px] leading-relaxed text-muted">
          {t("auth.verifyLead", { phone: formatPhone(phone) })}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <label htmlFor="code" className="text-sm font-medium">
            {t("auth.codeLabel")}
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(event) => onChange(event.target.value)}
            className={`${inputClass} text-center text-2xl tracking-[0.5em] tabular-nums`}
            aria-invalid={Boolean(error)}
          />
          <FieldError>{error ? t(error) : null}</FieldError>
          {resent ? <Notice>{t("auth.resent")}</Notice> : null}
          <Button type="submit" disabled={verifying || code.length !== 6} className="mt-2 w-full">
            {verifying ? t("auth.verifying") : t("auth.verify")}
          </Button>
        </form>
        <div className="flex flex-col items-center gap-1">
          {secondsLeft > 0 ? (
            <p className="text-sm text-muted tabular-nums">{t("auth.resendIn", { seconds: secondsLeft })}</p>
          ) : (
            <Button variant="ghost" onClick={() => void resend()}>
              {t("auth.resend")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.replace("/login")}>
            {t("auth.changePhone")}
          </Button>
        </div>
      </main>
    </div>
  );
}
