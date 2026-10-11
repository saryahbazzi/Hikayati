import { makeT, p } from "./index";

/** Staff admin portal + check-in copy. Every string is an [English, Arabic] pair. */
export const adminCopy = makeT({
  title: p("Staff portal", "بوابة الفريق"),
  nav: {
    overview: p("Overview", "نظرة عامة"), events: p("All events", "كل المناسبات"), myEvents: p("Assigned events", "المناسبات المسندة"), customers: p("Customers", "العملاء"),
    guests: p("Guests & RSVPs", "الضيوف والردود"), templates: p("Templates", "القوالب"), packages: p("Packages & pricing", "الباقات والأسعار"),
    messaging: p("Messaging", "المراسلات"), checkin: p("Check-in", "تسجيل الدخول"), reports: p("Reports", "التقارير"), team: p("Team & permissions", "الفريق والصلاحيات"),
    settings: p("Platform settings", "إعدادات المنصة"), audit: p("Audit log", "سجل المراجعة"), menu: p("Menu", "القائمة"), sections: p("Admin sections", "أقسام الإدارة"),
    skip: p("Skip to content", "انتقل إلى المحتوى"), publicSite: p("Public site", "الموقع العام"), signedInAs: p("Signed in as", "مسجّل الدخول باسم"),
  },
  roles: {
    super_admin: p("Super admin", "مدير عام"), admin: p("Admin", "مسؤول"), event_manager: p("Event manager", "مدير مناسبات"),
    check_in_staff: p("Check-in staff", "موظف تسجيل الدخول"), customer: p("Customer", "عميل"),
  },
  common: {
    search: p("Search", "بحث"), apply: p("Apply filters", "تطبيق"), clear: p("Clear", "مسح"), all: p("All", "الكل"), none: p("None", "لا شيء"), save: p("Save", "حفظ"),
    saving: p("Saving…", "جارٍ الحفظ…"), saved: p("Saved", "تم الحفظ"), cancel: p("Cancel", "إلغاء"), add: p("Add", "إضافة"), remove: p("Remove", "إزالة"), delete: p("Delete", "حذف"),
    edit: p("Edit", "تعديل"), open: p("Open", "فتح"), back: p("Back", "رجوع"), yes: p("Yes", "نعم"), no: p("No", "لا"), enabled: p("Enabled", "مفعّل"), disabled: p("Disabled", "معطّل"),
    active: p("Active", "فعّال"), inactive: p("Inactive", "غير فعّال"), loading: p("Loading…", "جارٍ التحميل…"), noResults: p("Nothing matches these filters.", "لا توجد نتائج تطابق هذه التصفية."),
    page: p("Page", "صفحة"), of: p("of", "من"), prev: p("Previous", "السابق"), next: p("Next", "التالي"), total: p("total", "الإجمالي"), results: p("results", "نتيجة"),
    when: p("When", "الوقت"), status: p("Status", "الحالة"), event: p("Event", "المناسبة"), name: p("Name", "الاسم"), guest: p("Guest", "الضيف"), role: p("Role", "الدور"),
    kind: p("Type", "النوع"), provider: p("Provider", "المزوّد"), actions: p("Actions", "إجراءات"), details: p("Details", "التفاصيل"), occasion: p("Occasion", "نوع المناسبة"),
    date: p("Date", "التاريخ"), venue: p("Venue", "المكان"), guests_: p("Guests", "الضيوف"), unknown: p("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى."),
    forbidden: p("You don’t have permission to do that.", "ليست لديك صلاحية لتنفيذ ذلك."), invalid: p("Please check the highlighted fields.", "يرجى مراجعة الحقول المحددة."),
    notFound: p("Not found.", "غير موجود."), required: p("Required", "مطلوب"), demoTag: p("Demo", "تجريبي"), simulated: p("Simulated", "محاكاة"), never: p("Never", "أبدًا"),
    csv: p("Download CSV", "تنزيل CSV"), sar: p("SAR", "ر.س"), confirm: p("Are you sure?", "هل أنت متأكد؟"), you: p("you", "أنت"), unnamed: p("Unnamed", "بدون اسم"),
    personalMasked: p("Phone numbers are partly hidden for your role.", "أرقام الجوال مخفية جزئيًا بحسب دورك."), refresh: p("Refresh", "تحديث"),
  },
  status: {
    event: { draft: p("Draft", "مسودة"), confirmed: p("Confirmed", "مؤكدة"), live: p("Live", "جارية"), completed: p("Completed", "منتهية"), cancelled: p("Cancelled", "ملغاة") },
    rsvp: { pending: p("Awaiting reply", "بانتظار الرد"), accepted: p("Accepted", "قبل"), declined: p("Declined", "اعتذر") },
    msg: { queued: p("Queued", "في الانتظار"), demo_simulated: p("Simulated (demo)", "محاكاة (تجريبي)"), sent: p("Sent", "أُرسلت"), delivered: p("Delivered", "سُلّمت"), read: p("Read", "قُرئت"), failed: p("Failed", "فشلت") },
    kind: { invite: p("Invitation", "دعوة"), reminder: p("Reminder", "تذكير"), rsvp_confirmation: p("RSVP confirmation", "تأكيد الرد"), pass: p("Entry pass", "بطاقة الدخول") },
    provider: { demo: p("Demo (simulated)", "تجريبي (محاكاة)"), whatsapp: p("WhatsApp", "واتساب") },
  },

  // ---------- overview ----------
  overview: {
    title: p("Overview", "نظرة عامة"),
    subAll: p("Everything across all events on the platform.", "كل ما يخص مناسبات المنصة."),
    subAssigned: p("Showing only the events you are assigned to.", "تظهر هنا المناسبات المسندة إليك فقط."),
    events: p("Events", "المناسبات"), guests: p("Guest records", "سجلات الضيوف"), invited: p("Invitations sent", "الدعوات المرسلة"), accepted: p("Accepted", "قبلوا الدعوة"),
    declined: p("Declined", "اعتذروا"), awaiting: p("Awaiting reply", "بانتظار الرد"), checkedIn: p("Checked in", "تم دخولهم"),
    byStatus: p("Events by status", "المناسبات حسب الحالة"), upcoming: p("Upcoming events", "المناسبات القادمة"), noUpcoming: p("No upcoming events.", "لا توجد مناسبات قادمة."),
    noEventsAssigned: p("You are not assigned to any event yet. A manager can assign you from the event page.", "لم تُسنَد إليك أي مناسبة بعد. يمكن للمسؤول إسنادك من صفحة المناسبة."),
    openCheckin: p("Open check-in", "فتح تسجيل الدخول"), viewAll: p("View all events", "عرض كل المناسبات"), accRate: p("accepted", "قبول"),
  },

  // ---------- events ----------
  events: {
    title: p("All events", "كل المناسبات"), titleAssigned: p("Assigned events", "المناسبات المسندة"),
    sub: p("Filter and open any event on the platform.", "صفِّ وافتح أي مناسبة على المنصة."), subAssigned: p("Events you manage.", "المناسبات التي تديرها."),
    search: p("Title, venue or host", "العنوان أو المكان أو المضيف"), owner: p("Host account", "حساب المضيف"), guests: p("Guests", "الضيوف"), accepted: p("Accepted", "قبلوا"),
    checkedIn: p("Arrived", "حضروا"), empty: p("No events yet", "لا توجد مناسبات بعد"), untitled: p("Untitled event", "مناسبة بلا عنوان"),
    // detail
    back: p("All events", "كل المناسبات"), stats: p("Event statistics", "إحصاءات المناسبة"), details: p("Event details", "تفاصيل المناسبة"),
    s_recipients: p("Recipients", "المدعوون"), s_sent: p("Sent (demo)", "أُرسلت (تجريبي)"), s_accepted: p("Accepted", "قبلوا"), s_declined: p("Declined", "اعتذروا"),
    s_awaiting: p("Awaiting", "بانتظار الرد"), s_checkedIn: p("Checked in", "تم دخولهم"), s_notArrived: p("Not yet arrived", "لم يصلوا بعد"), s_seats: p("Expected seats", "المقاعد المتوقعة"),
    s_confirmedDelivered: p("Delivery confirmed by a provider", "تسليم مؤكد من مزوّد"),
    guestsTitle: p("Guests & RSVPs", "الضيوف والردود"), guestsNote: p("Full phone numbers are visible here because you manage this event. Exports are audited.", "أرقام الجوال ظاهرة كاملة لأنك تدير هذه المناسبة. عمليات التصدير تُسجَّل في سجل المراجعة."),
    assignments: p("Assigned team", "الفريق المسند"), assignHelp: p("Event managers can run this event; check-in staff can only operate the door scanner.", "مديرو المناسبات يديرون هذه المناسبة، وموظفو تسجيل الدخول يشغّلون الماسح الضوئي فقط."),
    manager: p("Manager", "مدير"), checkInRole: p("Check-in", "تسجيل دخول"), noAssigned: p("No one is assigned yet.", "لم يُسنَد أحد بعد."), pickStaff: p("Choose a team member", "اختر عضو الفريق"),
    assign: p("Assign", "إسناد"), unassign: p("Unassign", "إلغاء الإسناد"), assignedOk: p("Assignment saved", "تم حفظ الإسناد"), noCandidates: p("There are no active event managers or check-in staff to assign. Add them in Team & permissions.", "لا يوجد مديرو مناسبات أو موظفو تسجيل دخول فعّالون للإسناد. أضفهم من قسم الفريق والصلاحيات."),
    checkinHistory: p("Check-in history", "سجل تسجيل الدخول"), noHistory: p("No check-in attempts yet.", "لا توجد محاولات تسجيل دخول بعد."), by: p("By", "بواسطة"), method: p("Method", "الطريقة"), result: p("Result", "النتيجة"),
    notifications: p("Notification history", "سجل الإشعارات"), noNotifications: p("No messages have been recorded for this event.", "لم تُسجَّل أي رسائل لهذه المناسبة."),
    notifNote: p("Message bodies are hidden here because they can contain private invitation links.", "نصوص الرسائل مخفية هنا لأنها قد تحتوي على روابط دعوات خاصة."),
    audit: p("Audit entries", "سجل المراجعة"), noAudit: p("No audit entries for this event.", "لا توجد سجلات مراجعة لهذه المناسبة."),
    openScanner: p("Open check-in scanner", "فتح ماسح تسجيل الدخول"), exportCsv: p("Export guest list (CSV)", "تصدير قائمة الضيوف (CSV)"),
    methodLabel: { scanner: p("Camera scan", "مسح بالكاميرا"), manual: p("Manual entry", "إدخال يدوي"), demo_simulated: p("Simulated (demo)", "محاكاة (تجريبي)") },
    package: p("Package", "الباقة"), city: p("City", "المدينة"), starts: p("Starts", "يبدأ"), estimated: p("Estimated guests", "الضيوف المقدّرون"), host: p("Host", "المضيف"), tz: p("Time zone", "المنطقة الزمنية"),
  },

  // ---------- customers ----------
  customers: {
    title: p("Customers", "العملاء"), sub: p("Accounts that create events. Only a super admin can disable or enable an account.", "الحسابات التي تنشئ المناسبات. وحده المدير العام يستطيع تعطيل الحساب أو تفعيله."),
    search: p("Name or phone", "الاسم أو الجوال"), customer: p("Customer", "العميل"), phone: p("Mobile", "الجوال"), events: p("Events", "المناسبات"), lastActivity: p("Last activity", "آخر نشاط"),
    joined: p("Joined", "تاريخ الانضمام"), account: p("Account", "الحساب"), disable: p("Disable", "تعطيل"), enable: p("Enable", "تفعيل"), empty: p("No customers yet", "لا يوجد عملاء بعد"),
    confirmDisable: p("Disable this account? They will be signed out and can’t sign in until re-enabled.", "تعطيل هذا الحساب؟ سيتم إنهاء جلساته ولن يتمكن من الدخول حتى يُعاد تفعيله."),
    demoAccount: p("Demo account", "حساب تجريبي"),
  },

  // ---------- guests ----------
  guests: {
    title: p("Guests & RSVPs", "الضيوف والردود"), sub: p("Replies across events. Personal data is kept to the minimum your role needs.", "الردود عبر المناسبات. تُعرض البيانات الشخصية بالحد الأدنى الذي يحتاجه دورك."),
    search: p("Guest name", "اسم الضيف"), searchPhone: p("Guest name or phone", "اسم الضيف أو الجوال"), rsvp: p("Reply", "الرد"), arrival: p("Arrival", "الحضور"),
    arrived: p("Checked in", "تم الدخول"), notArrived: p("Not arrived", "لم يصل"), mobile: p("Mobile", "الجوال"), plus: p("Companions", "المرافقون"), invitation: p("Invitation", "الدعوة"),
    sentDemo: p("Sent (demo)", "أُرسلت (تجريبي)"), notSent: p("Not sent", "لم تُرسل"), empty: p("No guests to show", "لا يوجد ضيوف لعرضهم"), responded: p("Replied", "تاريخ الرد"),
  },

  // ---------- templates ----------
  templates: {
    title: p("Templates", "القوالب"), sub: p("Control which invitation designs customers can choose, and register uploaded designs.", "تحكّم في تصاميم الدعوات المتاحة للعملاء وسجّل التصاميم المرفوعة."),
    status: { published: p("Published", "منشور"), coming_soon: p("Coming soon", "قريبًا"), draft: p("Draft", "مسودة") },
    kind: { static: p("Static", "ثابت"), motion: p("Motion", "متحرك"), video: p("Video", "فيديو") },
    publish: p("Publish", "نشر"), unpublish: p("Move to draft", "نقل إلى المسودات"), comingSoon: p("Mark coming soon", "تعليم كـ قريبًا"), editTitle: p("Edit template", "تعديل القالب"),
    nameEn: p("Name (English)", "الاسم (إنجليزي)"), nameAr: p("Name (Arabic)", "الاسم (عربي)"), descEn: p("Description (English)", "الوصف (إنجليزي)"), descAr: p("Description (Arabic)", "الوصف (عربي)"),
    sort: p("Sort order", "ترتيب العرض"), layout: p("Layout", "التخطيط"), uploaded: p("Uploaded design", "تصميم مرفوع"), builtin: p("Built-in", "مدمج"), preview: p("Live preview", "معاينة مباشرة"),
    registerTitle: p("Register an uploaded design", "تسجيل تصميم مرفوع"),
    importantTitle: p("Embedded text in an image can’t be edited", "النص المدمج داخل الصورة لا يمكن تعديله"),
    important: p("An imported PNG, JPG or SVG is used as a flat backdrop. Any text already drawn inside the image stays exactly as designed. Personalised text (names, date, venue, guest name…) is overlaid at the positions you configure below, in percent of the image box. Leave blank areas in the artwork where the overlay text should sit.",
      "تُستخدم صورة PNG أو JPG أو SVG المستوردة كخلفية ثابتة. أي نص مرسوم داخل الصورة يبقى كما صُمّم تمامًا. أما النصوص المخصصة (الأسماء والتاريخ والمكان واسم الضيف…) فتُوضع فوق الصورة في المواضع التي تحددها أدناه بنسبة مئوية من مساحة الصورة. اترك مساحات فارغة في التصميم حيث سيظهر النص."),
    pdfVideo: p("PDF and video designs can’t be rendered yet. They are saved as “coming soon” and are not offered to customers.", "تصاميم PDF والفيديو غير مدعومة بعد. تُحفظ كـ «قريبًا» ولا تُعرض على العملاء."),
    slug: p("Slug", "المعرّف"), slugHint: p("Lowercase letters, numbers and hyphens.", "أحرف إنجليزية صغيرة وأرقام وشرطات."),
    assetKind: p("File type", "نوع الملف"), assetUrl: p("Asset URL", "رابط الملف"), assetHint: p("https:// address or a site path such as /templates/my-design.png. Upload the file to your storage first.", "عنوان https:// أو مسار داخل الموقع مثل /templates/my-design.png. ارفع الملف إلى مساحة التخزين أولًا."),
    groups: p("Occasion groups (comma separated)", "مجموعات المناسبات (مفصولة بفواصل)"), groupsHint: p("e.g. wedding, engagement, birthday", "مثال: wedding, engagement, birthday"),
    overlay: p("Overlay fields (JSON)", "حقول النص فوق الصورة (JSON)"),
    overlayHint: p("Keys: names, intro, blessing, date, time, venue, address, hosts, closing, guest. x, y, w are percent of the image box. size is in container-width percent (≈ 4 is body text).", "المفاتيح: names, intro, blessing, date, time, venue, address, hosts, closing, guest. القيم x و y و w نسبة مئوية من مساحة الصورة، وsize بنسبة من عرض البطاقة (حوالي 4 للنص العادي)."),
    overlayInvalid: p("The overlay JSON is not valid. It must be a list of fields like { key, x, y, w }.", "صيغة JSON غير صالحة. يجب أن تكون قائمة حقول مثل { key, x, y, w }."),
    register: p("Register template", "تسجيل القالب"), registered: p("Template registered as a draft. Publish it when the preview looks right.", "تم تسجيل القالب كمسودة. انشره عندما تبدو المعاينة صحيحة."),
    saveOverlay: p("Save overlay", "حفظ مواضع النص"), previewNote: p("Preview uses sample wedding content.", "تستخدم المعاينة بيانات زفاف تجريبية."), noPreview: p("No preview available for this file type.", "لا تتوفر معاينة لهذا النوع من الملفات."),
    cantPublish: p("PDF and video templates can’t be published yet.", "لا يمكن نشر قوالب PDF أو الفيديو بعد."), insert: p("Insert default fields", "إدراج الحقول الافتراضية"),
    close: p("Close", "إغلاق"), errUrl: p("Enter an https:// address or a /path.", "أدخل عنوان https:// أو مسارًا يبدأ بـ /."), errSlug: p("Slug is required.", "المعرّف مطلوب."), errName: p("Both names are required.", "الاسمان مطلوبان."),
  },

  // ---------- packages ----------
  packages: {
    title: p("Packages & pricing", "الباقات والأسعار"),
    stateTitle: p("Pricing is not public", "الأسعار غير معلنة"),
    state: p("The public site says “Pricing Coming Soon”. Payments are not enabled: checkout in the wizard is a demo and no money is taken. The prices below are internal examples used for quotes and testing only.",
      "يعرض الموقع العام عبارة «الأسعار قريبًا». المدفوعات غير مفعّلة: إتمام الطلب في المعالج تجريبي ولا يُحصَّل أي مبلغ. الأسعار أدناه أمثلة داخلية تُستخدم لعروض الأسعار والاختبار فقط."),
    packageTitle: p("Package", "الباقة"), nameEn: p("Name (English)", "الاسم (إنجليزي)"), nameAr: p("Name (Arabic)", "الاسم (عربي)"), tagEn: p("Tagline (English)", "الوصف المختصر (إنجليزي)"), tagAr: p("Tagline (Arabic)", "الوصف المختصر (عربي)"),
    featuresEn: p("Features (English, one per line)", "المزايا (إنجليزي، سطر لكل ميزة)"), featuresAr: p("Features (Arabic, one per line)", "المزايا (عربي، سطر لكل ميزة)"),
    featuresHint: p("Lines are paired by position: line 1 in English matches line 1 in Arabic.", "تُقرن الأسطر بالترتيب: السطر الأول بالإنجليزية يقابل السطر الأول بالعربية."),
    maxGuests: p("Max guests", "أقصى عدد ضيوف"), eventsLimit: p("Events included", "عدد المناسبات"), reminders: p("Reminders", "التذكيرات"), pricingStatus: p("Pricing status", "حالة التسعير"),
    st_coming_soon: p("Coming soon (hidden)", "قريبًا (مخفي)"), st_published: p("Published", "منشور"), visible: p("Visible on public site", "ظاهرة في الموقع العام"),
    prices: p("Price rows", "صفوف الأسعار"), model: p("Model", "النموذج"), amount: p("Amount (SAR)", "المبلغ (ر.س)"), range: p("Guest range", "نطاق الضيوف"), interval: p("Interval", "الدورة"), label: p("Label", "الوصف"),
    flat: p("Flat (one-time)", "ثابت (مرة واحدة)"), per_guest: p("Per guest (tier)", "لكل ضيف (شريحة)"), subscription: p("Subscription", "اشتراك"), month: p("Monthly", "شهري"), year: p("Yearly", "سنوي"),
    minGuests: p("From guests", "من ضيف"), maxGuestsTier: p("To guests (blank = no limit)", "إلى ضيف (فارغ = بلا حد)"), addPrice: p("Add price row", "إضافة صف سعر"), noPrices: p("No price rows.", "لا توجد صفوف أسعار."),
    unlimited: p("no limit", "بلا حد"), activate: p("Activate", "تفعيل"), deactivate: p("Deactivate", "إيقاف"),
    addons: p("Add-ons", "الإضافات"), addonSlug: p("Slug", "المعرّف"), addonPricing: p("Pricing", "التسعير"), addAddon: p("Save add-on", "حفظ الإضافة"), editAddon: p("Edit", "تعديل"),
    discounts: p("Discount codes", "رموز الخصم"), code: p("Code", "الرمز"), percent: p("Percent", "النسبة"), expires: p("Expires (optional)", "ينتهي (اختياري)"), addDiscount: p("Add discount", "إضافة خصم"), noDiscounts: p("No discount codes.", "لا توجد رموز خصم."),
    tax: p("Tax (VAT) rate", "نسبة الضريبة (ض.ق.م)"), taxHint: p("In percent, e.g. 15.", "بالنسبة المئوية، مثل 15."), saveTax: p("Save tax rate", "حفظ نسبة الضريبة"),
    sim: {
      title: p("Price simulator", "محاكي الأسعار"), sub: p("Try a quote with the saved prices. Internal example only — nothing is charged.", "جرّب عرض سعر بالأسعار المحفوظة. مثال داخلي فقط — لا يُحصَّل أي مبلغ."),
      guests: p("Guests", "عدد الضيوف"), package: p("Package", "الباقة"), addons: p("Add-ons", "الإضافات"), discount: p("Discount code", "رمز الخصم"), none: p("None", "بدون"),
      subtotal: p("Subtotal", "المجموع الفرعي"), discountLine: p("Discount", "الخصم"), taxLine: p("VAT", "ضريبة القيمة المضافة"), total: p("Total (example)", "الإجمالي (مثال)"), base: p("Base price", "السعر الأساسي"), guestsLine: p("Guests", "الضيوف"),
      invalidCode: p("Unknown or inactive code — no discount applied.", "رمز غير معروف أو غير فعّال — لم يُطبَّق خصم."), appliedCode: p("Code applied", "تم تطبيق الرمز"),
      subscriptionNote: p("Subscription prices are billed separately and are not part of an event quote.", "تُحاسَب الاشتراكات بشكل منفصل ولا تدخل في عرض سعر المناسبة."),
    },
  },

  // ---------- messaging ----------
  messaging: {
    title: p("Messaging", "المراسلات"),
    demoNote: p("Every message here is DEMO / simulated: the demo provider contacts nobody. WhatsApp is a future provider (see the messaging provider seam). “Delivered” or “read” is never shown unless a real provider confirms it.",
      "كل الرسائل هنا تجريبية / محاكاة: المزوّد التجريبي لا يتواصل مع أحد. واتساب مزوّد مستقبلي (انظر طبقة مزوّدي المراسلة). لا تظهر حالة «سُلّمت» أو «قُرئت» إلا إذا أكدها مزوّد حقيقي."),
    records: p("Message records", "سجلات الرسائل"), contact: p("Contact inquiries", "رسائل التواصل"), contactSub: p("Messages sent through the public contact form.", "رسائل أُرسلت من نموذج التواصل في الموقع العام."),
    empty: p("No message records", "لا توجد سجلات رسائل"), locale: p("Language", "اللغة"), simulated: p("Simulated", "محاكاة"),
    from: p("From", "من"), replyTo: p("Reply to", "للرد على"), message: p("Message", "الرسالة"), handled: p("Handled", "تمت المعالجة"), markHandled: p("Mark handled", "تعليم كمُعالَج"),
    open: p("Open", "مفتوحة"), handledFilter: p("Show", "عرض"), onlyOpen: p("Open only", "المفتوحة فقط"), onlyHandled: p("Handled only", "المعالَجة فقط"), noContact: p("No inquiries.", "لا توجد رسائل."),
    bodyHidden: p("Message bodies are not shown (they can contain private links).", "نصوص الرسائل غير معروضة (قد تحتوي على روابط خاصة)."),
  },

  // ---------- check-in ----------
  checkin: {
    title: p("Check-in", "تسجيل الدخول"), sub: p("Choose an event to open its door scanner.", "اختر مناسبة لفتح ماسح الدخول الخاص بها."),
    empty: p("No events available for check-in", "لا توجد مناسبات متاحة لتسجيل الدخول"), emptyBody: p("You can only operate check-in for events you are assigned to (or all events if you are an admin).", "يمكنك تشغيل تسجيل الدخول للمناسبات المسندة إليك فقط (أو لكل المناسبات إن كنت مسؤولًا)."),
    openScanner: p("Open scanner", "فتح الماسح"), attended: p("Arrived", "حضروا"), accepted: p("Accepted", "قبلوا"), of: p("of", "من"), back: p("All check-in events", "كل مناسبات تسجيل الدخول"),
    counter: p("Checked in", "تم الدخول"), counterOf: p("of accepted guests", "من المقبولين"), seats: p("Expected seats", "المقاعد المتوقعة"), live: p("Updates every few seconds", "يتحدّث كل بضع ثوانٍ"),
    scanTitle: p("Scan an entry pass", "امسح بطاقة الدخول"), startCamera: p("Start camera", "تشغيل الكاميرا"), stopCamera: p("Stop camera", "إيقاف الكاميرا"), cameraOff: p("Camera is off", "الكاميرا متوقفة"),
    cameraStarting: p("Starting camera…", "جارٍ تشغيل الكاميرا…"), scanning: p("Point the camera at the guest’s QR code", "وجّه الكاميرا نحو رمز QR الخاص بالضيف"),
    camDenied: p("Camera access was blocked. Allow the camera in your browser settings, or enter the code manually below.", "تم حظر الوصول إلى الكاميرا. اسمح بالكاميرا من إعدادات المتصفح أو أدخل الرمز يدويًا أدناه."),
    camMissing: p("No camera was found on this device. Enter the code manually below.", "لم يتم العثور على كاميرا في هذا الجهاز. أدخل الرمز يدويًا أدناه."),
    camUnsupported: p("This browser can’t access the camera here (a secure https:// page is required). Enter the code manually below.", "لا يستطيع هذا المتصفح استخدام الكاميرا هنا (يلزم اتصال آمن https://). أدخل الرمز يدويًا أدناه."),
    camError: p("The camera could not be started. Enter the code manually below.", "تعذر تشغيل الكاميرا. أدخل الرمز يدويًا أدناه."),
    manualTitle: p("Manual entry", "إدخال يدوي"), manualLabel: p("Entry pass code", "رمز بطاقة الدخول"), manualHint: p("Paste or type the code printed under the QR (starts with HK1.).", "الصق أو اكتب الرمز المطبوع أسفل QR (يبدأ بـ HK1.)."), verify: p("Check in", "تسجيل الدخول"), checking: p("Checking…", "جارٍ التحقق…"),
    result: {
      success: p("Checked in", "تم تسجيل الدخول"), already_checked_in: p("Already checked in", "سُجّل دخوله مسبقًا"), invalid: p("Invalid code", "رمز غير صالح"), wrong_event: p("Wrong event", "مناسبة أخرى"),
      not_accepted: p("Not accepted", "لم يقبل الدعوة"), revoked: p("Pass revoked", "بطاقة ملغاة"), forbidden: p("Not allowed", "غير مصرّح"),
    },
    resultBody: {
      success: p("Welcome. Entry recorded.", "أهلًا بك. تم تسجيل الدخول."), already_checked_in: p("This pass was already used. Do not admit again.", "استُخدمت هذه البطاقة من قبل. لا تسمح بالدخول مرة أخرى."),
      invalid: p("This code is not a valid Hikayati entry pass.", "هذا الرمز ليس بطاقة دخول صالحة من حكاية."), wrong_event: p("This pass belongs to a different event.", "هذه البطاقة تخص مناسبة أخرى."),
      not_accepted: p("This guest has not accepted the invitation.", "هذا الضيف لم يقبل الدعوة."), revoked: p("The host cancelled this pass.", "ألغى المضيف هذه البطاقة."),
      forbidden: p("You are not allowed to check guests in for this event.", "لا تملك صلاحية تسجيل دخول الضيوف لهذه المناسبة."),
    },
    companions: p("companions", "مرافقين"), at: p("at", "في"), idle: p("Ready to scan", "جاهز للمسح"), recent: p("Recent attempts", "آخر المحاولات"), noRecent: p("No attempts yet.", "لا توجد محاولات بعد."),
    simTitle: p("Simulate check-in", "محاكاة تسجيل الدخول"), simNote: p("DEMO ONLY. Checks in a guest who accepted, without a scanner. It is recorded as “simulated” and only exists while demo access is on.", "للتجربة فقط. يسجّل دخول ضيف قبل الدعوة دون ماسح. يُسجَّل كـ «محاكاة» ويتوفر فقط أثناء تفعيل الوضع التجريبي."),
    simPick: p("Choose an accepted guest", "اختر ضيفًا قبل الدعوة"), simRun: p("Simulate check-in", "محاكاة الدخول"), simNone: p("No accepted guests to simulate.", "لا يوجد ضيوف مقبولون للمحاكاة."), simArrived: p("arrived", "حضر"),
    time: p("Time", "الوقت"), guest: p("Guest", "الضيف"), by: p("By", "بواسطة"), method: p("Method", "الطريقة"), outcome: p("Result", "النتيجة"),
    camReady: p("Camera on", "الكاميرا تعمل"), scanned: p("Code read", "تمت قراءة الرمز"),
  },

  // ---------- reports ----------
  reports: {
    title: p("Reports", "التقارير"), sub: p("Aggregate numbers across the platform. No personal data.", "أرقام مجمّعة على مستوى المنصة. بلا بيانات شخصية."),
    export: p("Download aggregate CSV", "تنزيل ملف CSV مجمّع"), byStatus: p("Events by status", "المناسبات حسب الحالة"), byOccasion: p("Events by occasion", "المناسبات حسب النوع"),
    funnel: p("RSVP funnel", "مسار الردود"), f_guests: p("Guests added", "ضيوف مضافون"), f_sent: p("Invitations sent", "دعوات مرسلة"), f_opened: p("Opened", "فُتحت"), f_responded: p("Replied", "تم الرد"),
    f_accepted: p("Accepted", "قبلوا"), f_declined: p("Declined", "اعتذروا"), f_checkedIn: p("Checked in", "تم دخولهم"),
    attendance: p("Attendance rate per event", "نسبة الحضور لكل مناسبة"), accepted: p("Accepted", "قبلوا"), arrived: p("Arrived", "حضروا"), rate: p("Rate", "النسبة"),
    messages: p("Message volume", "حجم الرسائل"), byKind: p("By type", "حسب النوع"), msgByStatus: p("By status", "حسب الحالة"), messagesNote: p("All messages are simulated by the demo provider.", "كل الرسائل محاكاة عبر المزوّد التجريبي."),
    orders: p("Demo orders", "الطلبات التجريبية"), ordersCount: p("Demo orders", "عدد الطلبات التجريبية"), ordersTotal: p("Demo revenue (not real money)", "الإيراد التجريبي (ليس مبلغًا حقيقيًا)"),
    ordersNote: p("DEMO: no payment is taken on the platform yet, so this figure is not revenue.", "تجريبي: لا يوجد تحصيل مدفوعات على المنصة بعد، لذا هذا الرقم ليس إيرادًا."),
    empty: p("No data yet.", "لا توجد بيانات بعد."), count: p("Count", "العدد"),
  },

  // ---------- team ----------
  team: {
    title: p("Team & permissions", "الفريق والصلاحيات"), sub: p("Staff accounts and what each role can do. Roles are enforced on the server for every page and action.", "حسابات الفريق وما يستطيع كل دور فعله. تُفرض الأدوار على الخادم لكل صفحة وإجراء."),
    staff: p("Staff", "الفريق"), member: p("Member", "العضو"), phone: p("Mobile", "الجوال"), lastSeen: p("Added", "أُضيف"), actions: p("Actions", "إجراءات"),
    addTitle: p("Add a staff member", "إضافة عضو فريق"), addHelp: p("Enter their mobile number and a role. They sign in with a one-time code sent to that number. If the number already has a customer account it is upgraded.", "أدخل رقم جوالهم والدور. يسجّلون الدخول برمز لمرة واحدة يصل إلى الرقم. إن كان الرقم مسجّلًا كعميل فسيتم ترقية حسابه."),
    fullName: p("Full name (optional)", "الاسم الكامل (اختياري)"), country: p("Country code", "رمز الدولة"), mobile: p("Mobile number", "رقم الجوال"), addBtn: p("Add staff member", "إضافة العضو"), added: p("Staff member added", "تمت إضافة العضو"),
    changeRole: p("Change role", "تغيير الدور"), disable: p("Disable", "تعطيل"), enable: p("Enable", "تفعيل"), self: p("This is you — you can’t change your own role or status.", "هذا حسابك — لا يمكنك تغيير دورك أو حالتك."),
    lastSuper: p("You can’t demote or disable the last active super admin.", "لا يمكن تخفيض أو تعطيل آخر مدير عام فعّال."),
    errPhone: p("Enter a valid mobile number.", "أدخل رقم جوال صالحًا."), errExists: p("This number already belongs to a staff member.", "هذا الرقم يعود لعضو فريق بالفعل."), errRole: p("Choose a role.", "اختر دورًا."),
    errSelf: p("You can’t change your own account.", "لا يمكنك تغيير حسابك."), errLast: p("You can’t remove the last super admin.", "لا يمكن إزالة آخر مدير عام."),
    matrix: p("Permission matrix", "مصفوفة الصلاحيات"), matrixNote: p("Event managers and check-in staff have no global permissions: they act only on events they are assigned to.", "مديرو المناسبات وموظفو تسجيل الدخول بلا صلاحيات عامة: يعملون فقط على المناسبات المسندة إليهم."),
    permission: p("Permission", "الصلاحية"), assignedOnly: p("Assigned events only", "المناسبات المسندة فقط"), granted: p("Allowed", "مسموح"), notGranted: p("Not allowed", "غير مسموح"),
    perm: {
      "staff.portal": p("Open the staff portal", "فتح بوابة الفريق"), "events.read_all": p("See all events", "رؤية كل المناسبات"), "events.manage_all": p("Manage all events and assignments", "إدارة كل المناسبات والإسنادات"),
      "customers.read": p("View customers", "عرض العملاء"), "templates.manage": p("Manage templates", "إدارة القوالب"), "packages.manage": p("Manage packages & pricing", "إدارة الباقات والأسعار"),
      "team.manage": p("Manage team & accounts", "إدارة الفريق والحسابات"), "settings.manage": p("View platform settings", "عرض إعدادات المنصة"), "reports.read": p("View reports", "عرض التقارير"),
      "messaging.read": p("View messaging", "عرض المراسلات"), "audit.read": p("View audit log", "عرض سجل المراجعة"), "checkin.operate_all": p("Operate check-in for any event", "تشغيل تسجيل الدخول لأي مناسبة"),
    },
    roleSaved: p("Role updated", "تم تحديث الدور"), statusSaved: p("Account status updated", "تم تحديث حالة الحساب"),
  },

  // ---------- settings ----------
  settings: {
    title: p("Platform settings", "إعدادات المنصة"), sub: p("Read-only status of this environment. Secrets are never shown.", "حالة هذه البيئة للقراءة فقط. لا تُعرض الأسرار أبدًا."),
    demoAccess: p("Demo access", "الوصول التجريبي"), demoOn: p("On — seeded fictional accounts and a visible OTP code are available. Turn off for production.", "مفعّل — الحسابات التجريبية الوهمية ورمز التحقق الظاهر متاحان. أوقفه في الإنتاج."),
    demoOff: p("Off", "متوقف"), provider: p("Messaging provider", "مزوّد المراسلة"), providerDemo: p("Demo — simulates sends, contacts nobody", "تجريبي — يحاكي الإرسال ولا يتواصل مع أحد"), providerWa: p("WhatsApp (configured by environment)", "واتساب (مُعدّ عبر متغيرات البيئة)"),
    database: p("Database", "قاعدة البيانات"), driverPglite: p("PGlite (embedded Postgres)", "PGlite (قاعدة Postgres مدمجة)"), driverPg: p("PostgreSQL (DATABASE_URL)", "PostgreSQL (DATABASE_URL)"),
    ephemeral: p("Ephemeral: data is lost on restart", "مؤقتة: تُفقد البيانات عند إعادة التشغيل"), persistent: p("Persistent", "دائمة"),
    environment: p("Environment", "البيئة"), production: p("Production", "إنتاج"), development: p("Development / preview", "تطوير / معاينة"),
    otp: p("OTP provider", "مزوّد رمز التحقق"), otpYes: p("Configured", "مُعدّ"), otpNo: p("Not configured — sign-in works only in demo mode", "غير مُعدّ — تسجيل الدخول يعمل في الوضع التجريبي فقط"),
    tax: p("Tax rate (VAT)", "نسبة الضريبة (ض.ق.م)"), pricing: p("Public pricing", "التسعير العام"), pricingSoon: p("Coming soon", "قريبًا"), payments: p("Payments", "المدفوعات"), paymentsOff: p("Not enabled", "غير مفعّلة"),
    counts: p("Records", "السجلات"), users: p("Accounts", "الحسابات"), events: p("Events", "المناسبات"), guests: p("Guest records", "سجلات الضيوف"),
    placeholders: p("Site placeholders", "بيانات الموقع التجريبية"), placeholdersNote: p("Contact details, social links, legal pages and pricing on the public site are placeholders until the business confirms the real values.", "بيانات التواصل والروابط الاجتماعية والصفحات القانونية والأسعار في الموقع العام بيانات تجريبية إلى أن تؤكد الجهة المالكة القيم الحقيقية."),
  },

  // ---------- audit ----------
  audit: {
    title: p("Audit log", "سجل المراجعة"), sub: p("Append-only record of sensitive actions. Entries never contain phone numbers or guest names.", "سجل لا يُعدَّل للإجراءات الحساسة. لا تحتوي السجلات على أرقام جوال أو أسماء ضيوف."),
    action: p("Action starts with", "الإجراء يبدأ بـ"), actor: p("Actor", "المنفّذ"), actorRole: p("Actor role", "دور المنفّذ"), target: p("Target", "الهدف"), meta: p("Context", "السياق"), eventId: p("Event ID", "معرّف المناسبة"),
    system: p("System / guest", "النظام / ضيف"), empty: p("No audit entries", "لا توجد سجلات"), customerActor: p("Customer", "عميل"),
  },
});
