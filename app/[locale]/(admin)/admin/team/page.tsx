import { notFound } from "next/navigation";
import { AdminHeading, Panel, Td, TableWrap, Th } from "@/components/admin/ui";
import { TeamAdmin } from "@/components/admin/team-admin";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { listStaff } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { ROLES, ROLE_PERMISSIONS, type Permission } from "@/lib/server/permissions";
import { requirePermission } from "@/lib/server/session";

const PERMS = Array.from(new Set(Object.values(ROLE_PERMISSIONS).flat())) as Permission[];

export default async function AdminTeam({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "team.manage", `/${locale}/admin/team`);
  const t = adminCopy(locale);
  const staff = await listStaff(await getDb(), actor);
  const perm = t.team.perm as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.team.title} sub={t.team.sub} />
      <TeamAdmin staff={staff} locale={locale} t={t} />
      <div className="mt-6">
        <Panel title={t.team.matrix} id="matrix" note={t.team.matrixNote}>
          <TableWrap label={t.team.matrix}>
            <table className="w-full min-w-[44rem] border-collapse text-start text-sm">
              <caption className="sr-only">{t.team.matrix}</caption>
              <thead><tr><Th>{t.team.permission}</Th>{ROLES.map((r) => <Th key={r}>{t.roles[r]}</Th>)}</tr></thead>
              <tbody>
                {PERMS.map((p) => (
                  <tr key={p}>
                    <th scope="row" className="border-b border-line/70 px-4 py-2.5 text-start font-normal">{perm[p] ?? p}<code className="block text-[0.7rem] text-taupe" dir="ltr" style={{ textAlign: "start" }}>{p}</code></th>
                    {ROLES.map((r) => {
                      const yes = ROLE_PERMISSIONS[r].includes(p);
                      return <Td key={r}><span className={yes ? "text-olive" : "text-taupe"} aria-label={yes ? t.team.granted : t.team.notGranted}>{yes ? "✓" : "—"}</span></Td>;
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="border-b border-line/70 px-4 py-2.5 text-start font-normal">{t.team.assignedOnly}</th>
                  {ROLES.map((r) => <Td key={r}><span className={r === "event_manager" || r === "check_in_staff" ? "text-olive" : "text-taupe"} aria-label={r === "event_manager" || r === "check_in_staff" ? t.team.granted : t.team.notGranted}>{r === "event_manager" || r === "check_in_staff" ? "✓" : "—"}</span></Td>)}
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}
