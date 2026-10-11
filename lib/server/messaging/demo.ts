import type { MessageProvider, OutboundMessage, SendResult } from "./types";

/** Never contacts anyone. Marks every message `demo_simulated` so the UI can label it as a simulation. */
export class DemoProvider implements MessageProvider {
  readonly name = "demo" as const;
  readonly simulated = true;
  async send(_msg: OutboundMessage): Promise<SendResult> {
    void _msg;
    return { status: "demo_simulated" };
  }
}
