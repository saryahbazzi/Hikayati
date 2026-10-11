import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** Unpredictable URL-safe token (default 192 bits). */
export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomCode = (digits = 6) => String(randomInt(0, 10 ** digits)).padStart(digits, "0");

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Hash for credentials that are looked up by value (invitation links, entry passes, sessions). */
export const hashToken = (token: string) => sha256(`hikayati:v1:${token}`);
