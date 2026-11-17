"use client";

import { useCallback } from "react";
import { localeStore } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/types";
import { roleStore, type Role } from "@/lib/preferences";
import { useAuth } from "./AuthProvider";

/** 切换语言、当前身份：本机马上生效；登录后同时保存到用户资料，换手机也一样 */
export function usePreferenceSetters() {
  const { profile, updateProfile } = useAuth();

  const setLocale = useCallback(
    (locale: Locale) => {
      localeStore.set(locale);
      if (profile && profile.locale !== locale) void updateProfile({ locale }).catch(() => {});
    },
    [profile, updateProfile],
  );

  const setRole = useCallback(
    (role: Role) => {
      roleStore.set(role);
      if (profile && profile.active_role !== role) void updateProfile({ active_role: role }).catch(() => {});
    },
    [profile, updateProfile],
  );

  return { setLocale, setRole };
}
