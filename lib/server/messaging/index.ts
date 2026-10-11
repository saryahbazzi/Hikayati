import "server-only";
import { DemoProvider } from "./demo";
import type { MessageProvider } from "./types";
import { WhatsAppProvider } from "./whatsapp";

export function getProvider(): MessageProvider {
  return process.env.MESSAGING_PROVIDER === "whatsapp" ? new WhatsAppProvider() : new DemoProvider();
}
export * from "./types";
