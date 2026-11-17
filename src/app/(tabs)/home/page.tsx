"use client";

import { CalendarClock, Car, Inbox, MapPin } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState, SectionTitle, Segmented } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { useRole, type Role } from "@/lib/preferences";
import { useIsClient } from "@/lib/useIsClient";

function greetingKey(hour: number): MessageKey {
  if (hour < 12) return "home.greetingMorning";
  if (hour < 18) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

export default function HomePage() {
  const t = useT();
  const [role, setRole] = useRole();
  const isClient = useIsClient();

  return (
    <>
      <AppHeader title={isClient ? t(greetingKey(new Date().getHours())) : t("tabs.home")} />
      <main className="flex flex-col gap-6 px-4 py-4">
        <Segmented<Role>
          label={t("roles.switchLabel")}
          value={role}
          onChange={setRole}
          options={[
            { value: "rider", label: t("roles.iAmRider") },
            { value: "driver", label: t("roles.iAmDriver") },
          ]}
        />

        {role === "rider" ? (
          <>
            <section className="flex flex-col gap-3">
              <SectionTitle>{t("home.riderNearbyTitle")}</SectionTitle>
              <EmptyState icon={<MapPin />}>{t("home.riderNearbyEmpty")}</EmptyState>
            </section>
            <section className="flex flex-col gap-3">
              <SectionTitle>{t("home.riderMineTitle")}</SectionTitle>
              <EmptyState icon={<CalendarClock />}>{t("home.riderMineEmpty")}</EmptyState>
            </section>
          </>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <SectionTitle>{t("home.driverTripsTitle")}</SectionTitle>
              <EmptyState icon={<Car />}>{t("home.driverTripsEmpty")}</EmptyState>
            </section>
            <section className="flex flex-col gap-3">
              <SectionTitle>{t("home.driverRequestsTitle")}</SectionTitle>
              <EmptyState icon={<Inbox />}>{t("home.driverRequestsEmpty")}</EmptyState>
            </section>
          </>
        )}
      </main>
    </>
  );
}
