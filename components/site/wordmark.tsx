/** Compact lockup used in the header and footer: stationary Latin + Arabic. */
export function Wordmark({ className = "", size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-baseline gap-3 ${className}`} dir="ltr" aria-label="Hikayati — حكايتي">
      <span className={`font-light tracking-[0.3em] text-ink ${size === "lg" ? "text-2xl" : "text-[1.3rem]"}`} style={{ fontFamily: "var(--font-cormorant), serif" }}>HIKAYATI</span>
      <span className={`font-arabic leading-none text-olive ${size === "lg" ? "text-3xl" : "text-xl"}`}>حكايتي</span>
    </span>
  );
}
