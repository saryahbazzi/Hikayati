import "server-only";
import { createHmac } from "node:crypto";
import { appSecret } from "./config";
import { safeEqual } from "./crypto";

/**
 * Guest-facing credentials are HMAC-signed ids rather than stored secrets:
 *   invitation link  i1.<invitationId>.<linkVersion>.<sig>
 *   entry pass (QR)  HK1.<passId>.<sig>
 * They carry no personal data, cannot be forged without the server secret, and are revoked in the database
 * (invitations.link_version / entry_passes.status), so a host can re-show a link without invalidating it.
 */
const mac = (payload: string) => createHmac("sha256", appSecret()).update(payload).digest("base64url").slice(0, 27);

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const INV = new RegExp(`^i1\\.(${UUID})\\.(\\d{1,6})\\.([A-Za-z0-9_-]{27})$`, "i");
const PASS = new RegExp(`^HK1\\.(${UUID})\\.([A-Za-z0-9_-]{27})$`, "i");

export const signInvitationToken = (id: string, version: number) => `i1.${id}.${version}.${mac(`inv:${id}:${version}`)}`;
export const signPassToken = (id: string) => `HK1.${id}.${mac(`pass:${id}`)}`;

export function verifyInvitationToken(token: string): { id: string; version: number } | null {
  const m = INV.exec(token.trim());
  if (!m) return null;
  const [, id, v, sig] = m;
  return safeEqual(sig, mac(`inv:${id.toLowerCase()}:${Number(v)}`)) ? { id: id.toLowerCase(), version: Number(v) } : null;
}

export function verifyPassToken(token: string): { id: string } | null {
  const m = PASS.exec(token.trim());
  if (!m) return null;
  const [, id, sig] = m;
  return safeEqual(sig, mac(`pass:${id.toLowerCase()}`)) ? { id: id.toLowerCase() } : null;
}
