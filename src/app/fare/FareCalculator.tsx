"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/types";
import { FareInputError, splitFare, type FareErrorCode, type FareResult } from "@/lib/fare/splitFare";
import { formatCents, formatExactCents, formatKm } from "@/lib/format";

type PassengerId = "amy" | "ben";
const DRIVER = { id: "lily", name: "Lily" };
const PASSENGERS: { id: PassengerId; name: string }[] = [
  { id: "amy", name: "Amy" },
  { id: "ben", name: "Ben" },
];
const NAMES: Record<string, string> = { lily: "Lily", amy: "Amy", ben: "Ben" };

interface LegState {
  key: "l1" | "l2" | "l3" | "l4" | "l5" | "l6";
  km: string;
  onBoard: Record<PassengerId, boolean>;
}

/** 需求里的测试数据：油耗 8.5、油价 1.69，六段 1.7/2.4/8.5/8.8/2.9/1.7 km，车上 1/2/3/3/2/1 人 */
const EXAMPLE = {
  fuel: "8.5",
  gas: "1.69",
  legs: [
    { key: "l1", km: "1.7", onBoard: { amy: false, ben: false } },
    { key: "l2", km: "2.4", onBoard: { amy: true, ben: false } },
    { key: "l3", km: "8.5", onBoard: { amy: true, ben: true } },
    { key: "l4", km: "8.8", onBoard: { amy: true, ben: true } },
    { key: "l5", km: "2.9", onBoard: { amy: true, ben: false } },
    { key: "l6", km: "1.7", onBoard: { amy: false, ben: false } },
  ] satisfies LegState[],
};

const parseNumber = (value: string) => (value.trim() === "" ? Number.NaN : Number(value));

export function FareCalculator() {
  const { t, locale } = useI18n();
  const [fuel, setFuel] = useState(EXAMPLE.fuel);
  const [gas, setGas] = useState(EXAMPLE.gas);
  const [legs, setLegs] = useState<LegState[]>(EXAMPLE.legs);

  const outcome = useMemo((): { result: FareResult } | { error: FareErrorCode } => {
    try {
      const result = splitFare({
        fuelLPer100km: parseNumber(fuel),
        gasCentsPerLitre: Math.round(parseNumber(gas) * 100),
        legs: legs.map((leg) => ({
          km: parseNumber(leg.km),
          riders: [DRIVER.id, ...PASSENGERS.filter((p) => leg.onBoard[p.id]).map((p) => p.id)],
        })),
      });
      return { result };
    } catch (error) {
      if (error instanceof FareInputError) return { error: error.code };
      throw error;
    }
  }, [fuel, gas, legs]);

  const updateLeg = (index: number, patch: Partial<LegState>) =>
    setLegs((current) => current.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));

  const reset = () => {
    setFuel(EXAMPLE.fuel);
    setGas(EXAMPLE.gas);
    setLegs(EXAMPLE.legs);
  };

  const joinNames = (ids: string[]) => ids.map((id) => NAMES[id] ?? id).join(locale === "zh" ? "、" : ", ");

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-2">
        <SectionTitle>{t("fare.formulaTitle")}</SectionTitle>
        <ul className="flex flex-col gap-1 text-sm leading-relaxed">
          <li>{t("fare.formulaPerKm")}</li>
          <li>{t("fare.formulaLeg")}</li>
          <li>{t("fare.formulaShare")}</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted">{t("fare.rounding")}</p>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>{t("fare.exampleTitle")}</SectionTitle>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="fare-fuel">
            {t("fare.fuelLabel")}
            <input
              id="fare-fuel"
              inputMode="decimal"
              value={fuel}
              onChange={(event) => setFuel(event.target.value)}
              className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="fare-gas">
            {t("fare.gasLabel")}
            <input
              id="fare-gas"
              inputMode="decimal"
              value={gas}
              onChange={(event) => setGas(event.target.value)}
              className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg tabular-nums"
            />
          </label>
        </div>

        <ol className="flex flex-col gap-2">
          {legs.map((leg, index) => (
            <li key={leg.key} className="rounded-card border border-line bg-surface p-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold tabular-nums">
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-snug">{t(`fare.legNames.${leg.key}` as MessageKey)}</p>
                <label className="flex items-center gap-1 text-sm text-muted" htmlFor={`fare-km-${leg.key}`}>
                  <input
                    id={`fare-km-${leg.key}`}
                    inputMode="decimal"
                    value={leg.km}
                    onChange={(event) => updateLeg(index, { km: event.target.value })}
                    className="min-h-9 w-16 rounded-lg border border-line bg-surface px-2 text-right text-base text-fg tabular-nums"
                    aria-label={`${t("fare.legHeader")} ${index + 1} · ${t("fare.kmHeader")}`}
                  />
                  km
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-9" role="group" aria-label={t("fare.whoOnBoard")}>
                <span
                  className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                  title={t("fare.alwaysOnBoard")}
                >
                  {DRIVER.name} · {t("fare.driverTag")}
                </span>
                {PASSENGERS.map((passenger) => {
                  const on = leg.onBoard[passenger.id];
                  return (
                    <button
                      key={passenger.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => updateLeg(index, { onBoard: { ...leg.onBoard, [passenger.id]: !on } })}
                      className={`min-h-8 rounded-full border px-3 text-xs font-medium ${
                        on ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"
                      }`}
                    >
                      {passenger.name}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
        <Button variant="secondary" onClick={reset} className="self-start">
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("common.reset")}
        </Button>
      </section>

      {"error" in outcome ? (
        <p role="alert" className="rounded-card border border-danger/40 bg-surface p-4 text-sm text-danger">
          {t(`fare.errors.${outcome.error}` as MessageKey)}
        </p>
      ) : (
        <FareResultView result={outcome.result} fuel={parseNumber(fuel)} gas={parseNumber(gas)} joinNames={joinNames} />
      )}

      <p className="text-sm leading-relaxed text-muted">{t("fare.driverSoloNote")}</p>
    </div>
  );
}

function FareResultView({
  result,
  fuel,
  gas,
  joinNames,
}: {
  result: FareResult;
  fuel: number;
  gas: number;
  joinNames: (ids: string[]) => string;
}) {
  const { t, locale } = useI18n();
  const people = [DRIVER.id, ...PASSENGERS.map((p) => p.id)].filter((id) => id in result.shares);
  const cell = "px-2 py-2 text-right tabular-nums";

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <SectionTitle>{t("fare.resultTitle")}</SectionTitle>
      <p className="text-sm text-muted">
        {t("fare.perKmLine", {
          fuel: String(fuel),
          gas: `$${gas.toFixed(2)}`,
          perKm: formatExactCents(result.costPerKmCents, 5),
        })}
      </p>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-2 py-2 text-left font-medium">{t("fare.legHeader")}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{t("fare.kmHeader")}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{t("fare.legCostHeader")}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{t("fare.ridersHeader")}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{t("fare.perPersonHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {result.legs.map((leg) => (
              <tr key={leg.index} className="border-b border-line last:border-0">
                <td className="px-2 py-2 tabular-nums">{leg.index + 1}</td>
                <td className={cell}>{formatKm(leg.km)}</td>
                <td className={cell}>{formatExactCents(leg.costCents)}</td>
                <td className={cell}>{leg.headcount}</td>
                <td className={cell}>{formatExactCents(leg.perPersonCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-3 py-2 text-left font-medium">{t("fare.personHeader")}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{t("fare.exactHeader")}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{t("fare.payHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((id) => (
              <tr key={id} className="border-b border-line">
                <td className="px-3 py-2">
                  {NAMES[id]}
                  {id === DRIVER.id ? <span className="ml-1.5 text-xs text-muted">{t("fare.driverTag")}</span> : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted">{formatExactCents(result.exactShares[id])}</td>
                <td className="px-3 py-2 text-right text-base font-semibold tabular-nums">{formatCents(result.shares[id])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-3 py-2 font-semibold">{t("fare.totalLabel")}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">{formatExactCents(result.totalExactCents)}</td>
              <td className="px-3 py-2 text-right text-base font-bold tabular-nums text-accent">
                {formatCents(result.totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        {t("fare.totalLine", { exact: formatExactCents(result.totalExactCents), total: formatCents(result.totalCents) })}
        {locale === "zh" ? "" : " "}
        {result.rounding.rest > 0
          ? t("fare.roundingLine", {
              floorSum: formatCents(result.rounding.floorSum),
              rest: formatCents(result.rounding.rest),
              who: joinNames(result.rounding.bumped),
            })
          : t("fare.roundingLineNone")}
      </p>
    </section>
  );
}
