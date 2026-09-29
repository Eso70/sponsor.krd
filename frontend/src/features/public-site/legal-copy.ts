import type { RootPublicLocale } from "./root-public-locale";

type LegalCopy = { title: string; sections: { title: string; paragraphs: string[] }[] };

export const termsCopy: Record<RootPublicLocale, LegalCopy> = {
  en: {
    title: "Terms of use",
    sections: [
      { title: "1. Acceptance", paragraphs: ["By creating or using a Sponsor.krd account, you accept these terms and confirm that you have the legal authority to represent your business."] },
      { title: "2. Account and security", paragraphs: ["Identity is verified through Google. You are responsible for securing your Google account and for the accuracy of the information you provide. Unauthorized access, misuse, and disruption of the service are prohibited."] },
      { title: "3. Content and use", paragraphs: ["You retain ownership of your content and are responsible for its legality, required permissions, accuracy, and related rights. Illegal, fraudulent, harmful content or content that infringes others' rights is not permitted."] },
      { title: "4. Plans and limits", paragraphs: ["An administrator assigns your plan. Features and limits depend on the active plan. Payments are not currently part of the service, and no paid plan is activated without legitimate verification."] },
      { title: "5. Suspension and termination", paragraphs: ["Sponsor.krd may suspend an account to protect security, comply with law, or preserve the service. On termination, rights necessary to retain legal and security records remain in effect."] },
      { title: "6. Limitation of liability", paragraphs: ["The service is provided as available. To the extent permitted by law, Sponsor.krd is not liable for indirect damages or lost profits."] },
      { title: "7. Changes", paragraphs: ["Material changes are recorded with a new version and notice. Renewed acceptance is required for fundamental changes."] },
    ],
  },
  ckb: {
    title: "مەرجەکانی بەکارهێنان",
    sections: [
      { title: "1. پەسەندکردن", paragraphs: ["بە دروستکردن یان بەکارهێنانی هەژماری Sponsor.krd، ئەم مەرجانە پەسەند دەکەیت و دڵنیایی دەدەیت کە دەسەڵاتی یاساییت بۆ نوێنەرایەتیکردنی بزنسەکەت هەیە."] },
      { title: "2. هەژمار و ئاسایش", paragraphs: ["ناسنامە بە Google پشتڕاست دەکرێتەوە. تۆ بەرپرسی پاراستنی هەژماری Google و ڕاستی زانیارییە پێشکەشکراوەکانیت. هەوڵی دەستگەیشتنی بێ‌مۆڵەت، خراپ بەکارهێنان، یان تێکدانی خزمەتگوزاری قەدەغەیە."] },
      { title: "3. ناوەڕۆک و بەکارهێنان", paragraphs: ["تۆ خاوەنی ناوەڕۆکی خۆتی و بەرپرسی یاساییبوون، مۆڵەت، ڕاستی و مافەکانی. ناوەڕۆکی نایاسایی، فریودەرانە، زیانبەخش، یان پێشێلکەری مافی کەسانی تر ڕێگەپێنەدراوە."] },
      { title: "4. پلان و سنوور", paragraphs: ["پلان لەلایەن بەڕێوەبەرەوە دیاری دەکرێت. تایبەتمەندی و سنوورەکان بە پلانی چالاکەوە بەستراون. پارەدان هێشتا بەشێک لە خزمەتگوزاری نییە و هیچ پلانی پارەدراو بەبێ پشتڕاستکردنەوەی ڕەوا چالاک ناکرێت."] },
      { title: "5. ڕاگرتن و کۆتایی", paragraphs: ["Sponsor.krd دەتوانێت بۆ پاراستنی ئاسایش، یاسا، یان خزمەتگوزاری هەژمارێک ڕابگرێت. لە کاتی کۆتایی، مافە پێویستەکان بۆ پاراستنی تۆمارە یاسایی و ئاسایشییەکان بەردەوام دەبن."] },
      { title: "6. سنووری بەرپرسیارێتی", paragraphs: ["خزمەتگوزاری بە شێوەی بەردەست پێشکەش دەکرێت. تا سنووری ڕێگەپێدراوی یاسا، Sponsor.krd بەرپرسی زیانی ناڕاستەوخۆ یان لەدەستدانی قازانج نییە."] },
      { title: "7. گۆڕانکاری", paragraphs: ["گۆڕانکارییە گرنگەکان بە وەشانی نوێ و ئاگادارکردنەوە تۆمار دەکرێن. پەسەندکردنی نوێ بۆ گۆڕانکارییە بنەڕەتییەکان داوا دەکرێت."] },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    sections: [
      { title: "1. القبول", paragraphs: ["بإنشاء حساب في Sponsor.krd أو استخدامه، فإنك توافق على هذه الشروط وتؤكد أن لديك الصلاحية القانونية لتمثيل نشاطك التجاري."] },
      { title: "2. الحساب والأمان", paragraphs: ["يُتحقق من الهوية عبر Google. أنت مسؤول عن حماية حسابك لدى Google وصحة المعلومات التي تقدمها. يُحظر الوصول غير المصرح به، أو إساءة الاستخدام، أو تعطيل الخدمة."] },
      { title: "3. المحتوى والاستخدام", paragraphs: ["تحتفظ بملكية محتواك، وتتحمل مسؤولية قانونيته والتراخيص اللازمة له ودقته والحقوق المتعلقة به. لا يُسمح بالمحتوى غير القانوني أو الاحتيالي أو الضار أو الذي ينتهك حقوق الآخرين."] },
      { title: "4. الخطط والحدود", paragraphs: ["يحدد المسؤول الخطة. ترتبط الميزات والحدود بالخطة النشطة. لا تشكل المدفوعات حاليًا جزءًا من الخدمة، ولا تُفعّل أي خطة مدفوعة دون تحقق مشروع."] },
      { title: "5. التعليق والإنهاء", paragraphs: ["يجوز لـ Sponsor.krd تعليق الحساب لحماية الأمان أو الامتثال للقانون أو صون الخدمة. عند الإنهاء، تبقى الحقوق اللازمة للاحتفاظ بالسجلات القانونية والأمنية سارية."] },
      { title: "6. حدود المسؤولية", paragraphs: ["تُقدّم الخدمة كما هي متاحة. إلى الحد الذي يسمح به القانون، لا تتحمل Sponsor.krd مسؤولية الأضرار غير المباشرة أو خسارة الأرباح."] },
      { title: "7. التغييرات", paragraphs: ["تُسجّل التغييرات المهمة بإصدار جديد وإشعار. وتُطلب موافقة جديدة على التغييرات الجوهرية."] },
    ],
  },
};

export const privacyCopy: Record<RootPublicLocale, LegalCopy> = {
  en: {
    title: "Privacy policy",
    sections: [
      { title: "1. Information we collect", paragraphs: ["We collect Google identity, verified email, name, account image, business information, mobile number, brand images, subdomain, social profiles, legal consents, sessions, and security logs."] },
      { title: "2. How we use information", paragraphs: ["We use information to verify identity, review applications, create and manage accounts, protect security, provide support, comply with law, and improve the service."] },
      { title: "3. Sharing", paragraphs: ["We share information as needed with Google, TikTok, and necessary infrastructure, storage, and security providers. On allowlisted public pages, TikTok Pixel and Events API may operate automatically and collect visit and action data, IP address, browser and device type, cookies, advertising identifiers, and ad attribution data. We do not sell personal information. We may disclose information in response to a valid legal request."] },
      { title: "4. Protection and retention", paragraphs: ["We use access controls, tenant isolation, short-lived and one-time tokens, secure cookies, hashing, and audit logs. Rejected or abandoned applications are deleted or anonymized after the required legal and administrative retention period."] },
      { title: "5. Your rights", paragraphs: ["Subject to applicable law, you may request access to, correction of, restriction of, or deletion of your information. Some security and legal records may be retained for the required period."] },
      { title: "6. Transfers and children", paragraphs: ["The service is not intended for people below the legal age. If information is stored outside the country, appropriate legal safeguards apply."] },
      { title: "7. Contact and changes", paragraphs: ["Official platform contact information must be added before publication. Changes are recorded with a version number and date."] },
    ],
  },
  ckb: {
    title: "سیاسەتی تایبەتمەندی",
    sections: [
      { title: "1. زانیارییە کۆکراوەکان", paragraphs: ["ناسنامەی Google، ئیمەیڵی پشتڕاستکراو، ناو، وێنەی هەژمار، زانیاری بزنس، ژمارەی مۆبایل، وێنەکانی براند، ساب‌دۆمەین، پڕۆفایلی کۆمەڵایەتی، پەسەندکردنی یاسایی، دانیشتن و تۆماری ئاسایش کۆدەکرێنەوە."] },
      { title: "2. مەبەستی بەکارهێنان", paragraphs: ["زانیاری بۆ پشتڕاستکردنەوەی ناسنامە، پێداچوونەوەی داواکاری، دروستکردن و بەڕێوەبردنی هەژمار، پاراستنی ئاسایش، پشتیوانی، پابەندبوون بە یاسا و باشترکردنی خزمەتگوزاری بەکاردێت."] },
      { title: "3. هاوبەشکردن", paragraphs: ["زانیاری بە Google، TikTok و دابینکەرانی پێویستی ژێرخان، هەڵگرتن و ئاسایش بە قەدەر پێویست هاوبەش دەکرێت. لە پەڕە گشتییە ڕێگەپێدراوەکاندا TikTok Pixel و Events API بە شێوەی خۆکار کار دەکەن و دەتوانن زانیاریی سەردان و کردار، IP، جۆری وێبگەڕ و ئامێر، کوکی و ناسێنەرەکانی ڕیکلام و زانیاریی بەستنەوەی ڕیکلام وەربگرن. زانیاری کەسی نافرۆشرێت. لە داواکاری یاسایی ڕەوادا زانیاری دەکرێت بدرێت."] },
      { title: "4. پاراستن و ماوە", paragraphs: ["کۆنترۆڵی دەستگەیشتن، جیاکردنەوەی tenant، توکنی کورتخایەن و یەکجارە، کوکی پارێزراو، هاشکردن و تۆماری پشکنین بەکاردێن. داواکارییە ڕەتکراو یان جێهێڵراوەکان دەبێت دوای ماوەی یاسایی و کارگێڕی پێویست بسڕدرێنەوە یان بێ‌ناسنامە بکرێن."] },
      { title: "5. مافەکانت", paragraphs: ["بەپێی یاسای جێبەجێبوو، دەتوانیت داوای بینین، ڕاستکردنەوە، سنووردارکردن یان سڕینەوەی زانیارییەکەت بکەیت. هەندێک تۆماری ئاسایشی و یاسایی بۆ ماوەی پێویست دەپارێزرێن."] },
      { title: "6. گواستنەوە و منداڵان", paragraphs: ["خزمەتگوزاری بۆ کەسانی خوار تەمەنی یاسایی نییە. ئەگەر زانیاری لە دەرەوەی وڵات هەڵگیرێت، پاراستنی گونجاوی یاسایی دەبێت جێبەجێ بکرێت."] },
      { title: "7. پەیوەندی و گۆڕانکاری", paragraphs: ["زانیاری پەیوەندیی فەرمی پلاتفۆرم دەبێت پێش بڵاوکردنەوە زیاد بکرێت. گۆڕانکارییەکان بە ژمارەی وەشان و بەروار تۆمار دەکرێن."] },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    sections: [
      { title: "1. المعلومات التي نجمعها", paragraphs: ["نجمع هوية Google، والبريد الإلكتروني المتحقق منه، والاسم، وصورة الحساب، ومعلومات النشاط التجاري، ورقم الهاتف، وصور العلامة التجارية، والنطاق الفرعي، والملفات الاجتماعية، والموافقات القانونية، والجلسات، وسجلات الأمان."] },
      { title: "2. أغراض الاستخدام", paragraphs: ["نستخدم المعلومات للتحقق من الهوية، ومراجعة الطلبات، وإنشاء الحسابات وإدارتها، وحماية الأمان، وتقديم الدعم، والامتثال للقانون، وتحسين الخدمة."] },
      { title: "3. المشاركة", paragraphs: ["نشارك المعلومات بالقدر اللازم مع Google وTikTok ومزودي البنية التحتية والتخزين والأمان الضروريين. في الصفحات العامة المسموح بها، قد يعمل TikTok Pixel وEvents API تلقائيًا ويجمعان بيانات الزيارات والإجراءات وعنوان IP ونوع المتصفح والجهاز وملفات تعريف الارتباط ومعرّفات الإعلانات وبيانات ربط الإعلانات. لا نبيع المعلومات الشخصية. وقد نكشف المعلومات استجابةً لطلب قانوني مشروع."] },
      { title: "4. الحماية والاحتفاظ", paragraphs: ["نستخدم ضوابط الوصول، وعزل المستأجرين، والرموز القصيرة الأجل وذات الاستخدام الواحد، وملفات تعريف الارتباط المحمية، والتجزئة، وسجلات التدقيق. تُحذف الطلبات المرفوضة أو المتروكة أو تُزال هويتها بعد المدة القانونية والإدارية اللازمة."] },
      { title: "5. حقوقك", paragraphs: ["وفقًا للقانون المعمول به، يمكنك طلب الاطلاع على معلوماتك أو تصحيحها أو تقييد استخدامها أو حذفها. وقد نحتفظ ببعض السجلات الأمنية والقانونية للمدة اللازمة."] },
      { title: "6. النقل والأطفال", paragraphs: ["الخدمة ليست مخصصة لمن هم دون السن القانونية. إذا خُزنت المعلومات خارج البلد، تُطبّق وسائل الحماية القانونية المناسبة."] },
      { title: "7. الاتصال والتغييرات", paragraphs: ["يجب إضافة معلومات الاتصال الرسمية للمنصة قبل النشر. تُسجّل التغييرات برقم إصدار وتاريخ."] },
    ],
  },
};
