import { isAuthApiError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import type { MessageKey } from "@/i18n/types";

/** 数据库函数抛出的固定错误代码 → 文案 */
const RPC_ERRORS: Record<string, MessageKey> = {
  outside_community_area: "join.errors.outside_community_area",
  no_home_address: "join.errors.no_home_address",
  community_not_found: "join.errors.community_not_found",
  account_suspended: "join.errors.account_suspended",
  not_authenticated: "join.errors.not_authenticated",
};

/** 登录系统的错误代码 → 文案 */
const AUTH_ERRORS: Record<string, MessageKey> = {
  over_sms_send_rate_limit: "auth.errors.tooMany",
  over_email_send_rate_limit: "auth.errors.tooMany",
  over_request_rate_limit: "auth.errors.tooMany",
  otp_expired: "auth.errors.badCode",
  otp_disabled: "auth.errors.smsFailed",
  sms_send_failed: "auth.errors.smsFailed",
  phone_provider_disabled: "auth.errors.smsFailed",
  validation_failed: "auth.invalidPhone",
  email_exists: "auth.errors.emailTaken",
  email_address_invalid: "join.emailInvalid",
};

/** 把任何错误变成可以显示给用户的文案 key */
export function errorMessageKey(error: unknown): MessageKey {
  if (isAuthRetryableFetchError(error)) return "auth.errors.network";
  if (isAuthApiError(error)) {
    if (error.code && AUTH_ERRORS[error.code]) return AUTH_ERRORS[error.code];
    if (error.status === 429) return "auth.errors.tooMany";
    return "auth.errors.generic";
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (RPC_ERRORS[message]) return RPC_ERRORS[message];
    if (/fetch|network/i.test(message)) return "auth.errors.network";
  }
  return "auth.errors.generic";
}
