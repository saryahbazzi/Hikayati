export type MessageKind = "invite" | "reminder" | "rsvp_confirmation" | "pass";
export type DeliveryStatus = "demo_simulated" | "sent" | "delivered" | "read" | "failed";

export interface OutboundMessage {
  eventId: string;
  guestId: string;
  invitationId: string;
  kind: MessageKind;
  to: string;           // E.164
  locale: "ar" | "en";
  body: string;
}

export interface SendResult {
  status: DeliveryStatus;
  /** Provider's own id. Only real providers set this. */
  providerMessageId?: string;
}

/**
 * The one seam for WhatsApp. DemoProvider simulates; WhatsAppProvider (future) talks to the official
 * WhatsApp Business Platform with approved templates, consent checks and signed webhooks.
 * A status other than `demo_simulated` must only ever come from a provider confirmation.
 */
export interface MessageProvider {
  readonly name: "demo" | "whatsapp";
  readonly simulated: boolean;
  send(msg: OutboundMessage): Promise<SendResult>;
}
