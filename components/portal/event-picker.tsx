"use client";

import { useRouter } from "next/navigation";
import { controlCls } from "@/components/ui/form";

/** Choose which event a page shows; navigates with ?event=ID so the page stays a server component. */
export function EventPicker({ label, value, options, base }: { label: string; value: string; options: { id: string; label: string }[]; base: string }) {
  const router = useRouter();
  return (
    <div className="max-w-md">
      <label htmlFor="event-picker" className="mb-2 block text-sm text-ink">{label}</label>
      <select id="event-picker" className={controlCls} value={value} onChange={(e) => router.push(`${base}?event=${e.target.value}`)} data-testid="event-picker">
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}
