import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "md" | "sm";

const base =
  "tracked inline-flex items-center justify-center gap-3 whitespace-nowrap font-medium uppercase transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-50";
const sizes: Record<Size, string> = { md: "px-8 py-3.5 text-[0.78rem] tracking-[0.2em]", sm: "px-5 py-2.5 text-[0.72rem] tracking-[0.18em]" };
const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-olive",
  secondary: "border border-ink/35 text-ink hover:border-olive hover:text-olive",
  quiet: "px-0 py-0 tracking-[0.18em] text-ink underline decoration-champagne decoration-1 underline-offset-8 hover:text-olive",
  danger: "border border-[#8a3b32]/50 text-[#8a3b32] hover:bg-[#8a3b32] hover:text-paper",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsLink = Common & { href: string; prefetch?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** One button for the whole product. Links render as <a>, everything else as <button>. */
export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const cls = `${base} ${variant === "quiet" ? "" : sizes[size]} ${variants[variant]} ${className}`;
  if (props.href !== undefined) {
    const { href, prefetch, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as AsLink;
    void _v; void _s; void _c; void _ch;
    const external = /^(https?:|mailto:|tel:|#)/.test(href);
    return external ? <a href={href} className={cls} {...rest}>{children}</a> : <Link href={href} prefetch={prefetch} className={cls} {...rest}>{children}</Link>;
  }
  const { variant: _v, size: _s, className: _c, children: _ch, type = "button", ...rest } = props as AsButton;
  void _v; void _s; void _c; void _ch;
  return <button type={type} className={cls} {...rest}>{children}</button>;
}
