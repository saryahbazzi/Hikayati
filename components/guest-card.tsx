import { sampleWedding as w } from "@/lib/content";
import { Lozenge } from "./floral";
import { QrMock } from "./qr-mock";

/**
 * Mock of what one guest receives: a WhatsApp-style message that opens into her personal pass —
 * name, event summary, RSVP status and a unique entry QR. Arabic first, with a quiet English note.
 */
export function GuestCard() {
  return (
    <div className="mx-auto w-full max-w-[24rem]">
      {/* message header, WhatsApp-inspired but in the brand palette */}
      <div dir="rtl" lang="ar" className="mb-3 flex items-center gap-3 px-1 font-arabic">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive text-lg text-paper">ح</span>
        <div className="leading-tight">
          <p className="text-[0.95rem] text-ink">حكايتي</p>
          <p className="font-sans text-[0.7rem] text-ink-soft">دعوة جديدة · الآن</p>
        </div>
      </div>

      <article
        dir="rtl"
        lang="ar"
        className="relative overflow-hidden rounded-[1.4rem] rounded-ss-md bg-paper px-7 pb-7 pt-8 text-center font-arabic text-ink shadow-[0_36px_60px_-28px_rgba(70,58,28,0.42),0_2px_6px_rgba(70,58,28,0.1)] ring-1 ring-champagne/40"
      >
        <p className="text-[0.8rem] tracking-wide text-olive">الدعوة باسم</p>
        <h3 className="mt-1 text-[2.1rem] leading-tight">عزيزتنا نورة</h3>
        <Lozenge className="mx-auto mt-3 w-20" />

        <p className="mt-4 text-[0.88rem] leading-7 text-ink-soft">
          حفل زفاف {w.groom.split(" ")[0]} ونوف
          <br />
          {w.date} · {w.time}
        </p>
        <p className="text-[0.8rem] leading-6 text-ink-soft/80">نايراه هول، الرياض</p>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sage/20 px-4 py-1.5 text-[0.85rem] text-olive">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          تم تأكيد الحضور
        </p>

        <div className="mx-auto mt-6 w-[62%] bg-[#fffdf8] p-3 shadow-[inset_0_0_0_1px_rgba(201,182,139,0.55)]">
          <QrMock className="block w-full" />
        </div>
        <p className="mt-4 text-[0.8rem] leading-6 text-ink-soft">رمز الدخول الخاص بك إلى المناسبة</p>
        <p dir="ltr" lang="en" className="font-sans text-[0.68rem] uppercase tracking-[0.18em] text-ink-soft/70">
          Please present this QR upon arrival
        </p>
      </article>
    </div>
  );
}
