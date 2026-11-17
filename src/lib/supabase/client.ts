import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase 客户端（只在手机端 / 浏览器里用）。
 * 地址和 anon key 在构建时写进前端；数据安全靠数据库的 RLS，anon key 本身可以公开。
 * 以后打包成 APP 时，登录状态改存到 Capacitor Preferences（在 src/lib/platform 里切换）。
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export type Db = SupabaseClient<Database>;

let client: Db | null = null;

export function supabase(): Db {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    client = createClient<Database>(url, anonKey, {
      auth: {
        storageKey: "carpool.auth",
        persistSession: true,
        autoRefreshToken: true,
        // 不用邮件里的登录链接（打包成 APP 后不用处理深链接）
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
