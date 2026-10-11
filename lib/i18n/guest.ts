import { makeT, p } from "./index";

export const guestCopy = makeT({
  invalidTitle: p("This invitation link isn’t valid.", "رابط الدعوة غير صالح."), invalidBody: p("It may have been replaced or withdrawn. Please ask your host to send it again.", "ربما تم استبداله أو إلغاؤه. يرجى طلب إعادة إرسال الدعوة من المضيف."),
  dear: p("Dear", "عزيزنا/عزيزتنا"), invited: p("You are invited", "أنتم مدعوون"),
  details: p("Event details", "تفاصيل المناسبة"), when: p("When", "الموعد"), where: p("Venue", "المكان"), map: p("Open in maps", "افتح في الخرائط"), dress: p("Dress code", "الزي"), notes: p("Good to know", "للعلم"), replyBy: p("Please reply by", "يُرجى الرد قبل"),
  companionsQ: p("How many companions will join you?", "كم عدد المرافقين الذين سيحضرون معك؟"), companionsOf: p("You may bring up to", "يمكنك اصطحاب حتى"),
  accept: p("Accept Invitation", "تأكيد الحضور"), decline: p("Decline Invitation", "الاعتذار عن الحضور"), working: p("One moment…", "لحظة من فضلك…"),
  acceptedTitle: p("Your place is confirmed.", "تم تأكيد حضورك."),
  acceptedBody: p("We’re delighted you’ll be joining us. Please keep your personal entry code and present it upon arrival.", "يسعدنا تأكيد حضورك، ونتطلع إلى مشاركتك هذه المناسبة. يُرجى الاحتفاظ برمز الدخول وإبرازه عند الوصول."),
  declinedTitle: p("Thank you for letting us know.", "شكرًا لردّك."),
  declinedBody: p("We’re sorry you won’t be able to join us and hope to celebrate together another time.", "يؤسفنا عدم تمكنك من الحضور، ونتطلع إلى مشاركتك مناسباتنا القادمة."),
  change: p("Change my reply", "تغيير ردّي"), changeClosed: p("The reply deadline has passed, so your answer can no longer be changed here.", "انتهت مهلة الرد، ولا يمكن تغيير إجابتك هنا."), locked: p("The host has turned off changing replies. Please contact them directly.", "أوقف المضيف تغيير الردود. يرجى التواصل معه مباشرة."),
  closed: p("The reply deadline has passed.", "انتهت مهلة الرد."), cancelled: p("This event is no longer taking place.", "لم تعد هذه المناسبة قائمة."),
  passTitle: p("Your entry pass", "رمز الدخول الخاص بك"), passNote: p("Please present this QR upon arrival. It is personal to you — don’t share it.", "يُرجى إبراز هذا الرمز عند الوصول. وهو خاص بك — لا تشاركه مع أحد."),
  save: p("Save pass as image", "حفظ الرمز كصورة"), checkedIn: p("You’ve been checked in. Welcome!", "تم تسجيل دخولك. أهلًا بك!"), passUsed: p("Used", "مستخدم"),
  accessMessage: p("Event access", "الدخول إلى المناسبة"),
  demoTag: p("Demo invitation — fictional event", "دعوة تجريبية — مناسبة وهمية"),
  errors: { rate_limited: p("Too many attempts. Please try again shortly.", "محاولات كثيرة. يرجى المحاولة بعد قليل."), closed: p("The reply deadline has passed.", "انتهت مهلة الرد."), locked: p("Replies can’t be changed for this event.", "لا يمكن تغيير الردود لهذه المناسبة."), checked_in: p("You’ve already checked in.", "لقد سجّلت دخولك بالفعل."), cancelled: p("This event is no longer taking place.", "لم تعد هذه المناسبة قائمة."), unknown: p("Something went wrong. Please try again.", "حدث خطأ ما. يرجى المحاولة مرة أخرى.") },
  poweredBy: p("Made with Hikayati", "صُنعت عبر حكايتي"),
});
