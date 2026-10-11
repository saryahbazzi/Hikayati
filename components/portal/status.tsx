import { Badge } from "@/components/ui/misc";
import { common } from "@/lib/i18n/common";
import type { Locale } from "@/lib/i18n";
import { statusTone } from "./util";

/** Event lifecycle badge (draft / confirmed / live / completed / cancelled). */
export function EventStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const t = common(locale).status as Record<string, string>;
  return <Badge tone={statusTone(status)}>{t[status] ?? status}</Badge>;
}
