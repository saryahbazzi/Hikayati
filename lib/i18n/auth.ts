import { makeT, p } from "./index";

export const authCopy = makeT({
  title: p("Sign in", "تسجيل الدخول"),
  sub: p("Use your mobile number. We’ll send a one-time code.", "استخدم رقم جوالك. سنرسل لك رمزًا لمرة واحدة."),
  country: p("Country code", "رمز الدولة"), phone: p("Mobile number", "رقم الجوال"), phoneHint: p("Saudi numbers can start with 05 or 5.", "يمكن أن يبدأ الرقم السعودي بـ 05 أو 5."),
  sendCode: p("Send code", "إرسال الرمز"), code: p("One-time code", "رمز التحقق"), verify: p("Verify and continue", "تحقق ومتابعة"), change: p("Use a different number", "استخدم رقمًا آخر"),
  devTitle: p("Development mode", "وضع التطوير"), devCode: p("No SMS provider is connected. Your code is:", "لا يوجد مزود رسائل متصل. رمزك هو:"),
  demoTitle: p("Demo accounts", "حسابات تجريبية"), demoSub: p("Fictional accounts for testing. Available only while demo access is enabled — never in production.", "حسابات وهمية للاختبار. متاحة فقط عند تفعيل الوضع التجريبي — وليس في الإنتاج."),
  continueAs: p("Continue as", "المتابعة كـ"),
  errors: {
    invalid_phone: p("That doesn’t look like a valid phone number.", "رقم الجوال غير صالح."), rate_limited: p("Too many attempts. Please wait a few minutes.", "محاولات كثيرة. يرجى الانتظار بضع دقائق."),
    invalid_code: p("That code isn’t right.", "الرمز غير صحيح."), expired: p("That code has expired. Request a new one.", "انتهت صلاحية الرمز. اطلب رمزًا جديدًا."),
    disabled: p("This account is disabled.", "هذا الحساب معطل."), not_configured: p("Sign-in is not available yet in this environment.", "تسجيل الدخول غير متاح بعد في هذه البيئة."),
    demo_disabled: p("Demo access is turned off.", "الوصول التجريبي متوقف."), unknown: p("Something went wrong. Please try again.", "حدث خطأ ما. حاول مرة أخرى."),
  },
});
