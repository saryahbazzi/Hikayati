"use client";

import { useCallback, useState } from "react";
import { GuestManager } from "@/components/guests/guest-manager";
import type { Locale } from "@/lib/i18n";
import { guestsCopy } from "@/lib/i18n/guests";
import type { GuestRow } from "@/lib/server/guests";
import { InvitationActions } from "./invitation-actions";

/** Guest list (GuestManager) plus the invitation-actions panel, kept in sync: actions remount the list so it re-reads from the server. */
export function GuestsWorkspace({ eventId, locale, eventStatus, defaultLang, canEdit, canExport, canManage, canGuests }: {
  eventId: string; locale: Locale; eventStatus: string; defaultLang: "ar" | "en"; canEdit: boolean; canExport: boolean; canManage: boolean; canGuests: boolean;
}) {
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [v, setV] = useState(0);
  const onChange = useCallback((g: GuestRow[]) => setGuests(g), []);
  return (
    <div className="space-y-14">
      <GuestManager key={v} eventId={eventId} locale={locale} t={guestsCopy(locale)} canEdit={canEdit} canExport={canExport} onChange={onChange} />
      <InvitationActions eventId={eventId} locale={locale} eventStatus={eventStatus} defaultLang={defaultLang} guests={guests} canManage={canManage} canGuests={canGuests} onMutated={() => setV((n) => n + 1)} />
    </div>
  );
}
