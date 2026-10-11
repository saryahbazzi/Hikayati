import { makeT, p } from "./index";

/** Navigation, buttons, statuses and footer — shared by every page. */
export const common = makeT({
  brand: { en: p("HIKAYATI", "HIKAYATI"), ar: p("حكايتي", "حكايتي"), mean: p("My Story", "حكايتي") },
  nav: {
    home: p("Home", "الرئيسية"), about: p("About", "عن حكايتي"), begin: p("Begin Your Story", "ابدأ حكايتك"), occasions: p("Occasions", "المناسبات"),
    packages: p("Packages", "الباقات"), contact: p("Contact", "تواصل معنا"), signIn: p("Sign In", "تسجيل الدخول"), signOut: p("Sign out", "تسجيل الخروج"),
    menu: p("Menu", "القائمة"), close: p("Close", "إغلاق"), language: p("Language", "اللغة"), skip: p("Skip to content", "انتقل إلى المحتوى"),
    account: p("Account", "الحساب"), staffPortal: p("Staff portal", "بوابة الفريق"), primary: p("Primary", "الرئيسية"),
  },
  portal: {
    myEvents: p("My Events", "مناسباتي"), createEvent: p("Create Event", "إنشاء مناسبة"), guests: p("Guest Management", "إدارة الضيوف"), invitations: p("Invitations", "الدعوات"),
    reminders: p("Reminders", "التذكيرات"), settings: p("Account Settings", "إعدادات الحساب"),
  },
  actions: {
    back: p("Back", "رجوع"), continue: p("Continue", "متابعة"), save: p("Save", "حفظ"), cancel: p("Cancel", "إلغاء"), edit: p("Edit", "تعديل"), delete: p("Delete", "حذف"),
    add: p("Add", "إضافة"), search: p("Search", "بحث"), confirm: p("Confirm", "تأكيد"), copy: p("Copy link", "نسخ الرابط"), copied: p("Copied", "تم النسخ"),
    open: p("Open", "فتح"), download: p("Download", "تنزيل"), close: p("Close", "إغلاق"), loading: p("Loading…", "جارٍ التحميل…"), yes: p("Yes", "نعم"), no: p("No", "لا"),
    view: p("View", "عرض"), send: p("Send", "إرسال"), reset: p("Reset", "إعادة ضبط"), filter: p("Filter", "تصفية"), all: p("All", "الكل"), saving: p("Saving…", "جارٍ الحفظ…"), saved: p("Saved", "تم الحفظ"),
  },
  demo: {
    badge: p("Demo", "تجريبي"),
    banner: p("Demo mode — fictional data. No real messages are sent and no payments are taken.", "وضع تجريبي — بيانات وهمية. لا تُرسل رسائل حقيقية ولا تُحصَّل مدفوعات."),
    simulated: p("Simulated", "محاكاة"),
  },
  status: {
    draft: p("Draft", "مسودة"), confirmed: p("Confirmed", "مؤكدة"), live: p("Live", "جارية"), completed: p("Completed", "منتهية"), cancelled: p("Cancelled", "ملغاة"),
    pending: p("Awaiting reply", "بانتظار الرد"), accepted: p("Accepted", "قبل الدعوة"), declined: p("Declined", "اعتذر"), notSent: p("Not sent", "لم تُرسل"), sent: p("Sent", "أُرسلت"),
    opened: p("Opened", "تم فتحها"), responded: p("Responded", "تم الرد"), revoked: p("Revoked", "ملغاة"), checkedIn: p("Checked in", "تم الدخول"), notArrived: p("Not arrived", "لم يصل"),
    active: p("Active", "فعّال"), cancelledRule: p("Cancelled", "ملغى"), completedRule: p("Completed", "اكتمل"),
  },
  footer: {
    line: p("Digital invitations and guest experiences for meaningful occasions.", "دعوات رقمية وتجارب ضيافة مصممة للمناسبات التي تستحق أن تُروى"),
    contact: p("Contact", "تواصل"), email: p("Email", "البريد الإلكتروني"), phone: p("Phone", "الهاتف"), location: p("Location", "الموقع"), instagram: p("Instagram", "انستغرام"),
    locationValue: p("Riyadh, Saudi Arabia", "الرياض، المملكة العربية السعودية"), placeholder: p("placeholder", "بيانات تجريبية"),
    placeholderNote: p("Contact details shown are placeholders and not yet verified business contacts.", "بيانات التواصل المعروضة تجريبية وليست بيانات تواصل معتمدة بعد."),
    privacy: p("Privacy Policy", "سياسة الخصوصية"), terms: p("Terms", "الشروط والأحكام"), rights: p("All rights reserved.", "جميع الحقوق محفوظة."),
    phoneValue: p("+966 5X XXX XXXX", "+966 5X XXX XXXX"), instagramValue: p("@hikayati", "@hikayati"),
  },
  notAuthorized: {
    title: p("This area is for the Hikayati team.", "هذه المنطقة مخصصة لفريق حكايتي."), body: p("Your account doesn’t have access to this page.", "حسابك لا يملك صلاحية الوصول إلى هذه الصفحة."), home: p("Back to home", "العودة إلى الرئيسية"),
  },
  notFound: { title: p("This page isn’t part of the story.", "هذه الصفحة ليست من الحكاية."), body: p("It may have moved, or the link may be incomplete.", "ربما نُقلت الصفحة أو أن الرابط غير مكتمل.") },
});
