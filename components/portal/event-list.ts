import "server-only";
import { utcToZoned } from "@/lib/domain/time";
import { todayIso } from "@/lib/domain/wizard";
import type { EventSummary } from "@/lib/server/events";

/** Non-draft events ordered for pickers: upcoming first (soonest first), then past events (most recent first). */
export function orderedEvents(events: EventSummary[]): EventSummary[] {
  const today = todayIso();
  const real = events.filter((e) => e.status !== "draft");
  const past = (e: EventSummary) => e.status === "cancelled" || e.status === "completed" || (!!e.startsAt && utcToZoned(e.startsAt).date < today);
  const up = real.filter((e) => !past(e)).sort((a, b) => (a.startsAt ?? "9").localeCompare(b.startsAt ?? "9"));
  const pr = real.filter(past).sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
  return [...up, ...pr];
}
