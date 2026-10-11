import { makeT, p } from "./index";

export const pages = makeT({
  about: {
    meta: p("About Hikayati", "عن حكايتي"),
    eyebrow: p("About Hikayati", "عن حكايتي"),
    title: p("My story, shared with the people who matter.", "حكايتي، تُروى مع من يهمّنا أمرهم."),
    lead: p("Hikayati means “my story”. It began with a simple belief: a gathering is not an event to be managed, it is a story to be told — and the invitation is its first line.", "حكايتي تعني «قصتي». بدأت بقناعة بسيطة: اللقاء ليس حدثًا يُدار، بل حكاية تُروى — والدعوة هي سطرها الأول."),
    blocks: [
      { h: p("Hospitality, designed.", "الضيافة، بتصميم."), b: p("Saudi hospitality is generous and exacting. We bring that same care to every detail a guest meets: the invitation they open, the way they reply, the pass they carry, and the welcome at the door.", "الضيافة السعودية كريمة ودقيقة. ونحمل العناية نفسها إلى كل تفصيل يلقاه الضيف: الدعوة التي يفتحها، وطريقة ردّه، والرمز الذي يحمله، والاستقبال عند الباب.") },
      { h: p("Tradition, written for today.", "التقاليد، بلغة اليوم."), b: p("Arabic first, always right-to-left, with wording that feels like it was written by someone who belongs at your table — and the option of English or both languages, set with equal care.", "العربية أولًا، وبكتابة من اليمين إلى اليسار، بصياغة تشبه من يجلس على مائدتك — مع خيار الإنجليزية أو اللغتين معًا، بالعناية نفسها.") },
      { h: p("Private by design.", "خصوصية بالتصميم."), b: p("Every guest receives a link that is theirs alone. Phone numbers are never shown to other guests, entry codes carry no personal details, and hosts decide what appears on an invitation.", "يتلقى كل ضيف رابطًا خاصًا به وحده. لا تظهر أرقام الجوالات لبقية الضيوف، ولا تحمل رموز الدخول أي بيانات شخصية، والمضيف هو من يقرر ما يظهر في الدعوة.") },
    ],
    cta: p("Begin Your Story", "ابدأ حكايتك"),
  },
  occasions: {
    meta: p("Occasions", "المناسبات"),
    eyebrow: p("Occasions", "المناسبات"), title: p("A story for every occasion.", "لكل مناسبة حكاية"),
    lead: p("From a wedding of five hundred to a quiet family dinner — choose the occasion and Hikayati shapes the details around it.", "من حفل زفاف لخمسمائة ضيف إلى عشاء عائلي هادئ — اختر المناسبة وستُشكّل حكايتي التفاصيل من حولها."),
    groups: {
      weddings: p("Weddings & engagements", "الزفاف والخطوبة"), celebrations: p("Celebrations", "الاحتفالات"), gatherings: p("Gatherings", "اللقاءات"), corporate: p("Corporate", "الفعاليات الرسمية"),
    },
    start: p("Begin with this occasion", "ابدأ بهذه المناسبة"), designs: p("See invitation designs", "شاهد تصاميم الدعوات"),
  },
  packages: {
    meta: p("Packages", "الباقات"),
    eyebrow: p("Packages", "الباقات"), title: p("Choose how your story is told.", "اختر كيف تُروى حكايتك."),
    lead: p("Four ways to work with Hikayati, from a single refined invitation to a full planner’s studio.", "أربع طرق للعمل مع حكايتي، من دعوة أنيقة واحدة إلى استوديو متكامل للمنسّقين."),
    soon: p("Pricing Coming Soon", "الأسعار قريبًا"), included: p("What’s included", "ما تتضمنه"), upTo: p("Up to", "حتى"), guests: p("guests", "ضيف"),
    begin: p("Begin Your Story", "ابدأ حكايتك"), note: p("Packages and features are configurable and may change before launch. No payment is taken in this version.", "الباقات والميزات قابلة للتعديل وقد تتغير قبل الإطلاق. لا تُحصَّل أي مدفوعات في هذه النسخة."),
    from: p("From", "ابتداءً من"), perGuest: p("per guest", "للضيف"), perMonth: p("per month", "شهريًا"),
  },
  contact: {
    meta: p("Contact", "تواصل معنا"),
    eyebrow: p("Contact", "تواصل"), title: p("Tell us about your gathering.", "حدّثنا عن لقائك."),
    lead: p("Questions, special requests or a bespoke design — write to us and we’ll reply personally.", "أسئلة أو طلبات خاصة أو تصميم مخصص — راسلنا وسنرد عليك شخصيًا."),
    name: p("Your name", "اسمك"), replyTo: p("Email or mobile number", "البريد الإلكتروني أو رقم الجوال"), message: p("Your message", "رسالتك"), send: p("Send message", "إرسال الرسالة"), sending: p("Sending…", "جارٍ الإرسال…"),
    thanks: p("Thank you — your message has been received.", "شكرًا لك — وصلتنا رسالتك."), required: p("Required", "مطلوب"), tooMany: p("Too many messages. Please try again later.", "رسائل كثيرة. يرجى المحاولة لاحقًا."), error: p("Something went wrong. Please try again.", "حدث خطأ ما. يرجى المحاولة مرة أخرى."),
    details: p("Our details", "بياناتنا"),
  },
  legal: {
    draft: p("Draft for legal review — not yet in force.", "مسودة للمراجعة القانونية — غير سارية بعد."),
    updated: p("Last updated", "آخر تحديث"),
    privacy: {
      title: p("Privacy Policy", "سياسة الخصوصية"),
      sections: [
        { h: p("What we collect", "ما الذي نجمعه"), b: p("Account details (mobile number, name), the event details you enter, and your guests’ names and mobile numbers that you add. We do not collect payment card details in this version.", "بيانات الحساب (رقم الجوال والاسم)، وتفاصيل المناسبة التي تُدخلها، وأسماء ضيوفك وأرقام جوالاتهم التي تضيفها. لا نجمع بيانات بطاقات الدفع في هذه النسخة.") },
        { h: p("Why we use it", "لماذا نستخدمها"), b: p("To create and deliver invitations, record replies, issue entry passes, run check-in and send reminders on your behalf. We do not sell personal data or use guest contact details for marketing.", "لإنشاء الدعوات وتسليمها وتسجيل الردود وإصدار رموز الدخول وإدارة الدخول وإرسال التذكيرات نيابةً عنك. لا نبيع البيانات الشخصية ولا نستخدم بيانات تواصل الضيوف للتسويق.") },
        { h: p("Hosts and guests", "المضيفون والضيوف"), b: p("Hosts confirm they have permission to contact the guests they add. Guests can opt out at any time and ask for their details to be corrected or removed through the host or by contacting us.", "يؤكد المضيفون أن لديهم إذنًا بالتواصل مع الضيوف الذين يضيفونهم. يمكن للضيوف إلغاء الاشتراك في أي وقت وطلب تصحيح بياناتهم أو حذفها عبر المضيف أو بالتواصل معنا.") },
        { h: p("Retention", "مدة الاحتفاظ"), b: p("Guest contact details are kept only as long as needed for the event and a short period afterwards, then deleted or anonymised. Exact periods will be confirmed before launch.", "نحتفظ ببيانات تواصل الضيوف فقط للمدة اللازمة للمناسبة وفترة قصيرة بعدها، ثم تُحذف أو تُجهَّل هويتها. سيتم تأكيد المدد بدقة قبل الإطلاق.") },
        { h: p("Your rights", "حقوقك"), b: p("Under the Saudi Personal Data Protection Law you may ask to access, correct, export or delete your personal data, and to withdraw consent. Contact us using the details on the Contact page.", "بموجب نظام حماية البيانات الشخصية في المملكة يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو تصديرها أو حذفها، وسحب موافقتك. تواصل معنا عبر البيانات في صفحة التواصل.") },
        { h: p("Security", "الأمان"), b: p("Guest links and entry passes are signed and carry no personal details; access to every event is checked on our servers; sensitive actions are logged.", "روابط الضيوف ورموز الدخول موقّعة ولا تحمل أي بيانات شخصية؛ ويُتحقق من صلاحية الوصول لكل مناسبة على خوادمنا؛ وتُسجَّل الإجراءات الحساسة.") },
      ],
    },
    terms: {
      title: p("Terms & Conditions", "الشروط والأحكام"),
      sections: [
        { h: p("Using Hikayati", "استخدام حكايتي"), b: p("Hikayati helps you create invitations and manage guests for your occasions. You are responsible for the accuracy of the details you enter and for having permission to contact your guests.", "تساعدك حكايتي على إنشاء الدعوات وإدارة الضيوف لمناسباتك. أنت مسؤول عن دقة البيانات التي تُدخلها وعن حصولك على إذن بالتواصل مع ضيوفك.") },
        { h: p("Messaging", "الرسائل"), b: p("In this version, sending is simulated and no messages are delivered. When real messaging is enabled it will use approved channels and templates and respect guests’ opt-out.", "في هذه النسخة تكون عملية الإرسال محاكاة ولا تُسلَّم أي رسائل. وعند تفعيل الإرسال الفعلي ستُستخدم قنوات وقوالب معتمدة مع احترام رغبة الضيوف في إيقاف الرسائل.") },
        { h: p("Payments", "المدفوعات"), b: p("Pricing is not published yet and no payment is taken. Any checkout shown is a demonstration.", "الأسعار غير منشورة بعد ولا تُحصَّل أي مدفوعات. أي عملية دفع معروضة هي للتوضيح فقط.") },
        { h: p("Acceptable use", "الاستخدام المقبول"), b: p("Do not use Hikayati to send unsolicited or unlawful messages, or to collect other people’s data without permission.", "لا تستخدم حكايتي لإرسال رسائل غير مرغوبة أو مخالفة للنظام، أو لجمع بيانات الآخرين دون إذنهم.") },
        { h: p("Changes", "التغييرات"), b: p("These terms will be updated before launch and we will tell you when they change.", "ستُحدَّث هذه الشروط قبل الإطلاق وسنُعلمك عند تغييرها.") },
      ],
    },
  },
});
