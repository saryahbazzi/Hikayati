/**
 * Environment gates. Demo/dev access is OFF in production unless explicitly enabled with
 * HIKAYATI_DEMO_ACCESS=true (e.g. on a Vercel *preview* so the owner can review it). There is no
 * hardcoded login bypass: demo access just enables seeded fictional accounts and a visible OTP code.
 */
export const isProduction = () => process.env.NODE_ENV === "production";

export function demoAccessEnabled(): boolean {
  if (process.env.HIKAYATI_DEMO_ACCESS === "true") return true;
  if (process.env.HIKAYATI_DEMO_ACCESS === "false") return false;
  // Vercel *preview* deployments are for review, so they default to demo mode. Production never does.
  if (process.env.VERCEL_ENV === "preview") return true;
  return !isProduction();
}

/** Connection string for a persistent Postgres (Vercel/Neon/Supabase integrations set one of these). */
export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || undefined;

/** Secret used to sign cookies / CSRF-style tokens. Required in production. */
export function appSecret(): string {
  const s = process.env.HIKAYATI_SECRET;
  if (s && s.length >= 16) return s;
  if (isProduction() && !demoAccessEnabled()) throw new Error("HIKAYATI_SECRET must be set (16+ chars) in production");
  return "dev-only-secret-not-for-production";
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
