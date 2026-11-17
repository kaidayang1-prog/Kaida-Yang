"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localeStore } from "@/i18n/I18nProvider";
import { roleStore } from "@/lib/preferences";
import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = Pick<
  TablesUpdate<"profiles">,
  "display_name" | "avatar_path" | "bio" | "locale" | "primary_role" | "active_role" | "onboarded_at"
>;

/**
 * unconfigured：没有配置 Supabase（本地还没填 .env.local）
 * loading：正在读取登录状态或资料
 * signedOut：没登录
 * signedIn：已登录，资料已加载
 * error：已登录，但资料加载失败（通常是网络问题）
 */
export type AuthStatus = "unconfigured" | "loading" | "signedOut" | "signedIn" | "error";

interface AuthValue {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (patch: ProfileUpdate) => Promise<Profile>;
  signOut: () => Promise<void>;
}

interface ProfileState {
  userId: string;
  profile: Profile | null;
  failed: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

/** 登录状态 + 当前用户的公开资料。登录后以资料里的语言和当前身份为准，同步到本机设置。 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = 还在读取本机保存的登录状态
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);

  const applyProfile = useCallback((userId: string, profile: Profile) => {
    setProfileState({ userId, profile, failed: false });
    localeStore.set(profile.locale === "en" ? "en" : "zh");
    roleStore.set(profile.active_role);
  }, []);

  const loadProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase().from("profiles").select("*").eq("id", userId).maybeSingle();
        if (error) throw error;
        if (!data) {
          // 账号已被删除（比如在另一台手机上删的）：退出登录
          setProfileState({ userId, profile: null, failed: false });
          await supabase().auth.signOut();
          return null;
        }
        applyProfile(userId, data);
        return data;
      } catch {
        setProfileState({ userId, profile: null, failed: true });
        return null;
      }
    },
    [applyProfile],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfileState(null);
        return;
      }
      // 不能在这个回调里直接 await 其他 Supabase 请求，放到下一轮执行
      setTimeout(() => void loadProfile(nextSession.user.id), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  const userId = session?.user.id ?? null;
  const current = profileState && profileState.userId === userId ? profileState : null;

  const refreshProfile = useCallback(async () => (userId ? loadProfile(userId) : null), [userId, loadProfile]);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate) => {
      if (!userId) throw new Error("not signed in");
      const { data, error } = await supabase().from("profiles").update(patch).eq("id", userId).select("*").single();
      if (error) throw error;
      applyProfile(userId, data);
      return data;
    },
    [userId, applyProfile],
  );

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
  }, []);

  let status: AuthStatus;
  if (!isSupabaseConfigured) status = "unconfigured";
  else if (session === undefined) status = "loading";
  else if (session === null) status = "signedOut";
  else if (!current) status = "loading";
  else if (current.failed) status = "error";
  else if (current.profile) status = "signedIn";
  else status = "loading"; // 正在退出

  const profile = current?.profile ?? null;

  const value = useMemo<AuthValue>(
    () => ({ status, session: session ?? null, profile, refreshProfile, updateProfile, signOut }),
    [status, session, profile, refreshProfile, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
