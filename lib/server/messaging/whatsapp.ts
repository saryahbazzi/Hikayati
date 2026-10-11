import { createHmac, timingSafeEqual } from "node:crypto";
import type { MessageProvider, OutboundMessage, SendResult } from "./types";

/**
 * FUTURE: official WhatsApp Business Platform (Cloud API).
 *
 * Not implemented on purpose — no unofficial automation. When wiring it up:
 *  - send only APPROVED template messages; map `kind` + `locale` to a template name + variables
 *  - require recorded recipient opt-in and honour `guests.opted_out_at`
 *  - credentials come from server env only (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_APP_SECRET)
 *  - persist the provider message id in message_records.meta.providerMessageId and update status ONLY from
 *    verified webhooks (see verifyWebhookSignature) — delivery is never assumed
 *  - process webhook events idempotently (dedupe on provider message id + status), retry with backoff,
 *    respect rate limits and surface failures to staff
 */
export class WhatsAppProvider implements MessageProvider {
  readonly name = "whatsapp" as const;
  readonly simulated = false;
  async send(_msg: OutboundMessage): Promise<SendResult> {
    void _msg;
    throw new Error("WhatsAppProvider is not implemented yet. Set MESSAGING_PROVIDER=demo.");
  }
}

/** Verifies Meta's `X-Hub-Signature-256` header over the RAW request body. */
export function verifyWebhookSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const given = header.slice(7);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
