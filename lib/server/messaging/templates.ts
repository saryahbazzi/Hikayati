/** Message copy. Real WhatsApp will map these to approved templates with the same variables. */
export interface TemplateVars { guestName: string; eventTitle: string; date: string; time: string; venue: string; link?: string; hostName?: string }

export function inviteBody(locale: "ar" | "en", v: TemplateVars): string {
  return locale === "ar"
    ? `السلام عليكم ${v.guestName}،\nيسعدنا دعوتكم إلى «${v.eventTitle}»\n${v.date} · ${v.time}\n${v.venue}\n\nللاطلاع على دعوتك وتأكيد الحضور:\n${v.link}`
    : `Dear ${v.guestName},\nYou are warmly invited to “${v.eventTitle}”\n${v.date} · ${v.time}\n${v.venue}\n\nView your invitation and reply here:\n${v.link}`;
}

export function reminderBody(locale: "ar" | "en", v: TemplateVars, custom?: string | null): string {
  const intro = custom?.trim();
  return locale === "ar"
    ? `${intro ?? `تذكير لطيف: «${v.eventTitle}» يوم ${v.date} الساعة ${v.time}.`}\n${v.link ? `رابط دعوتك: ${v.link}` : ""}`.trim()
    : `${intro ?? `A gentle reminder: “${v.eventTitle}” on ${v.date} at ${v.time}.`}\n${v.link ? `Your invitation: ${v.link}` : ""}`.trim();
}

export function confirmationBody(locale: "ar" | "en", accepted: boolean): string {
  if (accepted) {
    return locale === "ar"
      ? "يسعدنا تأكيد حضورك، ونتطلع إلى مشاركتك هذه المناسبة. يُرجى الاحتفاظ برمز الدخول وإبرازه عند الوصول."
      : "We’re delighted you’ll be joining us. Please keep your personal entry code and present it upon arrival.";
  }
  return locale === "ar"
    ? "شكرًا لردّك، يؤسفنا عدم تمكنك من الحضور، ونتطلع إلى مشاركتك مناسباتنا القادمة."
    : "Thank you for letting us know. We’re sorry you won’t be able to join us and hope to celebrate together another time.";
}
