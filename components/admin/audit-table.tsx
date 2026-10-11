import { adminCopy } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n";
import type { AuditRow } from "@/lib/server/admin";
import { fmtDateTime } from "./format";
import { Td, TableWrap, Th, tableCls } from "./ui";

/** Audit entries. Metadata is already scrubbed of personal fields on the server. */
export function AuditTable({ rows, locale }: { rows: AuditRow[]; locale: Locale }) {
  const t = adminCopy(locale);
  const roles = t.roles as Record<string, string>;
  return (
    <TableWrap label={t.audit.title}>
      <table className={tableCls}>
        <caption className="sr-only">{t.audit.title}</caption>
        <thead><tr><Th>{t.common.when}</Th><Th>{t.audit.action}</Th><Th>{t.audit.actor}</Th><Th>{t.audit.target}</Th><Th>{t.audit.meta}</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="whitespace-nowrap">{fmtDateTime(r.at, locale)}</Td>
              <Td><code className="text-xs" dir="ltr">{r.action}</code></Td>
              <Td>{r.actorName ?? (r.actorRole === "customer" ? t.audit.customerActor : t.audit.system)}<span className="block text-xs text-taupe">{r.actorRole ? roles[r.actorRole] ?? r.actorRole : ""}{r.actorShort ? ` · ${r.actorShort}` : ""}</span></Td>
              <Td className="text-xs" dir="ltr">{r.entity ?? "—"}{r.entityId ? ` · ${r.entityId}` : ""}</Td>
              <Td className="text-xs text-ink-soft" dir="ltr">{Object.entries(r.meta).map(([k, v]) => `${k}=${String(v)}`).join(" ") || "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
