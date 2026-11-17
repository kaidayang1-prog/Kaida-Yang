"use client";

import { Check, GraduationCap, MapPin } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Button, FieldError, Notice, Segmented, inputClass } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { MyCommunity } from "@/lib/community/useMyCommunities";
import { errorMessageKey } from "@/lib/errors";
import { ADDRESS_SEARCH_IS_MOCK, searchAddresses, type AddressResult } from "@/lib/geo/addressSearch";
import { supabase } from "@/lib/supabase/client";

type Method = "address" | "email";

/**
 * 加入小区或学校（邻居级认证）：
 *  - 用住址：选地址 → 保存到隐私资料 → 列出住址范围内的小区 → 加入
 *  - 用学校邮箱：发验证码到邮箱 → 输入验证码 → 自动加入对应学校
 */
export function CommunityJoin({
  joined,
  onJoined,
}: {
  joined: readonly MyCommunity[];
  onJoined: () => Promise<unknown>;
}) {
  const { t } = useI18n();
  const [method, setMethod] = useState<Method>("address");
  return (
    <div className="flex flex-col gap-4">
      <Segmented<Method>
        label={t("onboarding.communityTitle")}
        value={method}
        onChange={setMethod}
        options={[
          { value: "address", label: t("join.byAddress") },
          { value: "email", label: t("join.bySchoolEmail") },
        ]}
      />
      {method === "address" ? (
        <AddressJoin joined={joined} onJoined={onJoined} />
      ) : (
        <SchoolEmailJoin onJoined={onJoined} />
      )}
    </div>
  );
}

interface Nearby {
  id: string;
  name_zh: string;
  name_en: string;
  distance_m: number;
}

function AddressJoin({ joined, onJoined }: { joined: readonly MyCommunity[]; onJoined: () => Promise<unknown> }) {
  const { t, locale } = useI18n();
  const { session, refreshProfile } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [chosen, setChosen] = useState<AddressResult | null>(null);
  const [nearby, setNearby] = useState<Nearby[] | null>(null);
  const [busy, setBusy] = useState<"checking" | string | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [request, setRequest] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const latestQuery = useRef("");

  const joinedIds = new Set(joined.map((c) => c.id));

  function onQueryChange(value: string) {
    setQuery(value);
    setChosen(null);
    setNearby(null);
    latestQuery.current = value;
    void searchAddresses(value).then((results) => {
      if (latestQuery.current === value) setSuggestions(results);
    });
  }

  async function choose(address: AddressResult) {
    if (!session) return;
    setChosen(address);
    setQuery(address.label);
    setSuggestions([]);
    setBusy("checking");
    setError(null);
    try {
      const { error: saveError } = await supabase()
        .from("user_private")
        .update({ home_address: address.label, home_lat: address.lat, home_lng: address.lng })
        .eq("user_id", session.user.id);
      if (saveError) throw saveError;
      const { data, error: nearbyError } = await supabase().rpc("nearby_communities");
      if (nearbyError) throw nearbyError;
      setNearby(data ?? []);
    } catch (caught) {
      setError(errorMessageKey(caught));
    } finally {
      setBusy(null);
    }
  }

  async function join(id: string) {
    setBusy(id);
    setError(null);
    try {
      const { error: joinError } = await supabase().rpc("join_community_by_address", { p_community: id });
      if (joinError) throw joinError;
      await Promise.all([onJoined(), refreshProfile()]);
    } catch (caught) {
      setError(errorMessageKey(caught));
    } finally {
      setBusy(null);
    }
  }

  async function sendRequest(event: FormEvent) {
    event.preventDefault();
    if (!session || request.trim().length < 2) return;
    setError(null);
    const { error: insertError } = await supabase()
      .from("community_requests")
      .insert({ user_id: session.user.id, building_or_area: request.trim() });
    if (insertError) {
      setError(errorMessageKey(insertError));
      return;
    }
    setRequestSent(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="home-address" className="text-sm font-medium">
        {t("join.addressLabel")}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="home-address"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("join.addressPlaceholder")}
          autoComplete="off"
          className={`${inputClass} pl-10`}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="home-address-list"
          aria-autocomplete="list"
        />
      </div>
      {suggestions.length > 0 ? (
        <ul id="home-address-list" role="listbox" className="overflow-hidden rounded-xl border border-line bg-surface">
          {suggestions.map((address) => (
            <li key={address.label} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => void choose(address)}
                className="w-full border-b border-line px-3 py-3 text-left text-sm last:border-0 active:bg-surface-2"
              >
                {address.label}
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim() !== "" && !chosen ? (
        <p className="text-sm text-muted">{t("join.noResults")}</p>
      ) : null}
      <p className="text-xs leading-relaxed text-muted">{t("join.addressPrivacy")}</p>
      {ADDRESS_SEARCH_IS_MOCK && process.env.NODE_ENV !== "production" ? (
        <p className="text-xs text-muted">{t("join.addressMock")}</p>
      ) : null}

      {busy === "checking" ? <p className="text-sm text-muted">{t("join.checking")}</p> : null}
      <FieldError>{error ? t(error) : null}</FieldError>

      {nearby && nearby.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("join.nearbyTitle")}</p>
          <ul className="flex flex-col gap-2">
            {nearby.map((community) => {
              const isJoined = joinedIds.has(community.id);
              return (
                <li key={community.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{locale === "zh" ? community.name_zh : community.name_en}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {t("join.distance", { km: (community.distance_m / 1000).toFixed(1) })}
                    </p>
                  </div>
                  {isJoined ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                      <Check className="size-4" aria-hidden="true" />
                      {t("join.joined")}
                    </span>
                  ) : (
                    <Button className="min-h-10" disabled={busy !== null} onClick={() => void join(community.id)}>
                      {busy === community.id ? t("join.joining") : t("join.join")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {nearby && nearby.length === 0 ? (
        requestSent ? (
          <Notice>{t("join.requestSent")}</Notice>
        ) : (
          <form onSubmit={sendRequest} className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
            <p className="text-sm leading-relaxed">{t("join.noneNearby")}</p>
            <label htmlFor="community-request" className="text-sm font-medium">
              {t("join.requestLabel")}
            </label>
            <input
              id="community-request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder={t("join.requestPlaceholder")}
              maxLength={120}
              className={inputClass}
            />
            <Button type="submit" variant="secondary" disabled={request.trim().length < 2}>
              {t("join.requestSubmit")}
            </Button>
          </form>
        )
      ) : null}
    </div>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SchoolEmailJoin({ onJoined }: { onJoined: () => Promise<unknown> }) {
  const { t, locale } = useI18n();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [result, setResult] = useState<{ joinedName: string | null } | null>(null);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setError("join.emailInvalid");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase().auth.updateUser({ email: address });
    setBusy(false);
    if (updateError) {
      setError(errorMessageKey(updateError));
      return;
    }
    setSentTo(address);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!sentTo || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase().auth.verifyOtp({ email: sentTo, token: code, type: "email_change" });
      if (verifyError) throw verifyError;
      // 验证通过后，数据库触发器会按邮箱域名自动加入对应的学校
      const [communities] = await Promise.all([onJoined(), refreshProfile()]);
      const list = Array.isArray(communities) ? (communities as MyCommunity[]) : [];
      const school = list.find((c) => c.kind === "school" && c.source === "school_email");
      setResult({ joinedName: school ? (locale === "zh" ? school.name_zh : school.name_en) : null });
    } catch (caught) {
      setError(errorMessageKey(caught));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Notice>
        {result.joinedName ? t("join.emailJoined", { name: result.joinedName }) : t("join.emailNoSchool")}
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!sentTo ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3" noValidate>
          <label htmlFor="school-email" className="text-sm font-medium">
            {t("join.emailLabel")}
          </label>
          <div className="relative">
            <GraduationCap className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="school-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("join.emailPlaceholder")}
              className={`${inputClass} pl-10`}
            />
          </div>
          <FieldError>{error ? t(error) : null}</FieldError>
          <Button type="submit" disabled={busy || email.trim() === ""}>
            {t("join.emailSend")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3" noValidate>
          <Notice>{t("join.emailSent", { email: sentTo })}</Notice>
          <label htmlFor="school-email-code" className="text-sm font-medium">
            {t("join.emailCodeLabel")}
          </label>
          <input
            id="school-email-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputClass} text-center text-xl tracking-[0.4em] tabular-nums`}
          />
          <FieldError>{error ? t(error) : null}</FieldError>
          <Button type="submit" disabled={busy || code.length !== 6}>
            {t("join.emailVerify")}
          </Button>
        </form>
      )}
    </div>
  );
}
