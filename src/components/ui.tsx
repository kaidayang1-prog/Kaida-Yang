import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** 基础界面组件：卡片、按钮、空状态、分段选择。颜色都来自 globals.css 的设计令牌。 */

/** 卡片。padded={false} 用于里面是整行可点的列表（每行自己加左右内边距） */
export function Card({ className = "", padded = true, ...props }: ComponentProps<"section"> & { padded?: boolean }) {
  return <section className={`rounded-card border border-line bg-surface ${padded ? "p-4" : ""} ${className}`} {...props} />;
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg active:opacity-90",
  secondary: "border border-line bg-surface text-fg active:bg-surface-2",
  ghost: "text-accent active:bg-accent-soft",
  danger: "bg-danger text-accent-fg active:opacity-90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-8 text-center">
      {icon ? <div className="text-muted [&_svg]:size-8">{icon}</div> : null}
      <p className="max-w-[30ch] text-sm leading-relaxed text-balance text-muted">{children}</p>
    </div>
  );
}

/** 输入框统一样式 */
export const inputClass =
  "min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-fg placeholder:text-muted/70 focus:border-accent";

/** 表单下方的错误提示（读屏器会读出来） */
export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

/** 成功提示 */
export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-fg">{children}</p>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-fg">{children}</h2>;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
              selected ? "bg-surface text-fg shadow-sm" : "text-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
