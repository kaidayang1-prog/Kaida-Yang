"use client";

import { Building2, Car, House, MessageCircle, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";

const TABS: { href: string; label: MessageKey; icon: LucideIcon }[] = [
  { href: "/home", label: "tabs.home", icon: House },
  { href: "/explore", label: "tabs.explore", icon: Car },
  { href: "/community", label: "tabs.community", icon: Building2 },
  { href: "/inbox", label: "tabs.inbox", icon: MessageCircle },
  { href: "/me", label: "tabs.me", icon: UserRound },
];

/** 底部 5 个 Tab，固定在屏幕底部，避开 iPhone 底部横条 */
export function TabBar() {
  const t = useT();
  const pathname = (usePathname() ?? "/").replace(/\/$/, "") || "/";
  return (
    <nav
      aria-label={t("tabs.navLabel")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
