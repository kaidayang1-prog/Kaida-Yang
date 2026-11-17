import type { zh } from "./zh";

export type Locale = "zh" | "en";
export const LOCALES: readonly Locale[] = ["zh", "en"];

/** 把中文文案的字面量类型放宽成 string，英文文案必须有完全相同的结构 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Messages = Widen<typeof zh>;

/** 所有文案的点路径，如 "tabs.home"、"fare.errors.invalid_km" */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;

export type MessageVars = Record<string, string | number>;
