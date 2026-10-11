import { makeT, p } from "./index";

export const guestsCopy = makeT({
  title: p("Guests", "الضيوف"), add: p("Add guest", "إضافة ضيف"), edit: p("Edit guest", "تعديل الضيف"), import: p("Import CSV", "استيراد CSV"), template: p("Download CSV template", "تنزيل نموذج CSV"), export: p("Export CSV", "تصدير CSV"),
  search: p("Search name or number", "ابحث بالاسم أو الرقم"), filterRsvp: p("Reply", "الرد"), filterArrival: p("Arrival", "الحضور"), filterSent: p("Invitation", "الدعوة"),
  empty: p("No guests yet", "لا يوجد ضيوف بعد"), emptyBody: p("Add guests one by one or import a CSV file.", "أضف الضيوف واحدًا واحدًا أو استورد ملف CSV."), noMatch: p("No guests match these filters.", "لا يوجد ضيوف يطابقون هذه التصفية."),
  firstName: p("First name", "الاسم الأول"), lastName: p("Last name", "اسم العائلة"), country: p("Country code", "رمز الدولة"), phone: p("Mobile number", "رقم الجوال"),
  language: p("Preferred language", "اللغة المفضلة"), langAny: p("Not specified", "غير محدد"), companions: p("Accompanying guests allowed", "عدد المرافقين المسموح"), notes: p("Notes", "ملاحظات"),
  save: p("Save guest", "حفظ الضيف"), saving: p("Saving…", "جارٍ الحفظ…"), cancel: p("Cancel", "إلغاء"), del: p("Delete", "حذف"), confirmDel: p("Delete this guest?", "حذف هذا الضيف؟"), yesDel: p("Yes, delete", "نعم، احذف"),
  cols: { name: p("Guest", "الضيف"), phone: p("Mobile", "الجوال"), companions: p("Plus", "مرافقون"), invitation: p("Invitation", "الدعوة"), reply: p("Reply", "الرد"), arrival: p("Arrival", "الحضور") },
  rsvp: { pending: p("Awaiting reply", "بانتظار الرد"), accepted: p("Accepted", "قبل"), declined: p("Declined", "اعتذر") },
  sent: { yes: p("Sent (demo)", "أُرسلت (تجريبي)"), no: p("Not sent", "لم تُرسل") }, arrived: { yes: p("Checked in", "تم الدخول"), no: p("Not arrived", "لم يصل") },
  summary: p("guests", "ضيف"),
  import_: {
    title: p("Import guests from CSV", "استيراد ضيوف من ملف CSV"), help: p("Columns: first_name, last_name, country_code, phone, language, companions, notes. Numbers are checked and duplicates flagged before anything is saved.", "الأعمدة: first_name, last_name, country_code, phone, language, companions, notes. يتم فحص الأرقام وتنبيهك للتكرار قبل الحفظ."),
    file: p("Choose a CSV file", "اختر ملف CSV"), paste: p("…or paste CSV text", "…أو الصق نص CSV"), preview: p("Preview", "معاينة"), line: p("Line", "السطر"), status: p("Status", "الحالة"), ok: p("Ready", "جاهز"),
    commit: p("Import valid rows", "استيراد الصفوف الصحيحة"), valid: p("valid", "صحيح"), invalid: p("with problems (skipped)", "بها مشاكل (ستُتجاهل)"), done: p("Imported", "تم استيراد"),
    headers: p("The file needs at least first_name and phone columns.", "يجب أن يحتوي الملف على العمودين first_name و phone على الأقل."), empty: p("The file is empty.", "الملف فارغ."), tooLarge: p("Too many rows (limit 2,000).", "عدد الصفوف كبير (الحد 2000)."),
  },
  err: {
    required: p("Required", "مطلوب"), invalid: p("Invalid number", "رقم غير صالح"), duplicate: p("Already in this list", "موجود مسبقًا في القائمة"), range: p("Between 0 and 20", "بين 0 و 20"),
    checkedIn: p("This guest has already checked in and can’t be deleted.", "هذا الضيف سجّل دخوله ولا يمكن حذفه."), forbidden: p("You don’t have permission.", "ليست لديك صلاحية."), unknown: p("Something went wrong.", "حدث خطأ ما."),
  },
});
