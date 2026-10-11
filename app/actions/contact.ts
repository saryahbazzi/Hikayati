"use server";

import { publicAction } from "@/lib/server/action";
import { ValidationError } from "@/lib/server/permissions";
import { rateLimit } from "@/lib/server/rate-limit";

const clean = (v: string, max: number) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

/** Public contact form: validated, rate-limited per IP, stored for staff (Admin → Messaging). */
export async function submitContactAction(input: { name: string; replyTo: string; message: string; locale: string }) {
  return publicAction(async ({ db, ip }) => {
    const name = clean(input.name, 80), replyTo = clean(input.replyTo, 120), message = clean(input.message, 2000);
    const errors: Record<string, string> = {};
    if (!name) errors.name = "required";
    if (!replyTo || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo) || /^[+\d][\d\s\-().]{6,}$/.test(replyTo))) errors.replyTo = "required";
    if (message.length < 5) errors.message = "required";
    if (Object.keys(errors).length) throw new ValidationError(errors);
    if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000)) throw new ValidationError({ form: "rate_limited" });
    await db.query("insert into contact_messages (name, reply_to, message, locale) values ($1,$2,$3,$4)", [name, replyTo, message, input.locale === "ar" ? "ar" : "en"]);
    return { received: true };
  });
}
