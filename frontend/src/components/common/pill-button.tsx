import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-base tracking-[0.15em] transition duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Wine with a champagne edge; cream text keeps contrast above 6.5 on both fills.
  primary:
    "border border-champagne bg-wine font-medium text-cream hover:bg-wine-bright hover:shadow-[0_0_22px_var(--color-champagne-soft)]",
  ghost:
    "border border-champagne-soft text-cream hover:border-champagne hover:bg-wine/40 hover:text-champagne",
};

/** The fortune-house button used across the reading flow. */
export function PillButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

export function PillLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
