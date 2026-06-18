import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

const baseClassName =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] border px-6 py-3 text-sm font-medium transition-all duration-160 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

const baseStyle = {
  background: "var(--color-bg-tertiary)",
  color: "var(--color-text-secondary)",
  borderColor: "var(--color-border-secondary)",
} as const;

type SecondaryButtonBaseProps = {
  children: ReactNode;
  className?: string;
};

type SecondaryButtonAsLink = SecondaryButtonBaseProps & {
  href: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

type SecondaryButtonAsButton = SecondaryButtonBaseProps & {
  href?: never;
} & ComponentPropsWithoutRef<"button">;

export type SecondaryButtonProps = SecondaryButtonAsLink | SecondaryButtonAsButton;

export function SecondaryButton({
  children,
  className,
  ...props
}: SecondaryButtonProps) {
  const classes = className ? `${baseClassName} ${className}` : baseClassName;

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} style={baseStyle} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonProps } = props as SecondaryButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      style={baseStyle}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
