"use client";

import { BadgeCheck, Home, Phone } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import type { Enums } from "@/lib/supabase/database.types";

const LEVELS = {
  phone: { icon: Phone, label: "me.levelPhone" },
  neighbor: { icon: Home, label: "me.levelNeighbor" },
  full: { icon: BadgeCheck, label: "me.levelFull" },
} as const;

/** 认证等级小标签：手机号 / 邻居级 / 完整认证 */
export function VerificationBadge({ level }: { level: Enums<"verification_level"> }) {
  const t = useT();
  const { icon: Icon, label } = LEVELS[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        level === "phone" ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent"
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {t(label)}
    </span>
  );
}
