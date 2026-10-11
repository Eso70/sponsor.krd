import type { RootPublicLocale } from "./root-public-locale";

type LegalCopy = {
  title: string;
  sections: {
    title: string;
    paragraphs: string[];
    links?: { label: string; href: string }[];
  }[];
};

export const termsCopy: Record<RootPublicLocale, LegalCopy> = {
  en: {
    title: "Terms of use",
    sections: [
      {
        title: "1. Acceptance",
        paragraphs: [
          "By creating or using a Sponsor.krd account, you accept these terms and confirm that you have the legal authority to represent your business.",
        ],
      },
      {
        title: "2. Account and security",
        paragraphs: [
          "Identity is verified through Google. You are responsible for securing your Google account and for the accuracy of the information you provide. Unauthorized access, misuse, and disruption of the service are prohibited.",
        ],
      },
      {
        title: "3. Content and use",
        paragraphs: [
          "You retain ownership of your content and are responsible for its legality, required permissions, accuracy, and related rights. Illegal, fraudulent, harmful content or content that infringes others' rights is not permitted.",
        ],
      },
      {
        title: "4. Plans and limits",
        paragraphs: [
          "An administrator assigns your plan. Features and limits depend on the active plan. Payments are not currently part of the service, and no paid plan is activated without legitimate verification.",
        ],
      },
      {
        title: "5. Suspension and termination",
        paragraphs: [
          "Sponsor.krd may suspend an account to protect security, comply with law, or preserve the service. On termination, rights necessary to retain legal and security records remain in effect.",
        ],
      },
      {
        title: "6. Limitation of liability",
        paragraphs: [
          "The service is provided as available. To the extent permitted by law, Sponsor.krd is not liable for indirect damages or lost profits.",
        ],
      },
      {
        title: "7. Changes",
        paragraphs: [
          "Material changes are recorded with a new version and notice. Renewed acceptance is required for fundamental changes.",
        ],
      },
      {
        title: "8. Forms and lead collection",
        paragraphs: [
          "The Forms service saves forms, images and conditional answer sets for the account that creates them. Published forms collect responses at their public address. Paused forms do not accept responses. Archive only organizes the dashboard and preserves whether a form is active or paused. Answers entered in the dashboard preview are not submitted or saved as responses.",
          "Before collecting real responses or using a form in advertising, the business must provide accurate privacy disclosures, collect only necessary information, secure access to responses, set appropriate retention, and obtain any consent required by applicable law. Platform policy links alone do not satisfy every advertiser obligation.",
        ],
      },
      {
        title: "9. Third-party advertising",
        paragraphs: [
          "TikTok advertising and native Instant Forms are subject to TikTok’s own policies and Lead Generation Terms. Businesses are responsible for their ad content, disclosures, permissions, and compliance. Sponsor.krd does not guarantee TikTok approval or claim that these previews are an official TikTok integration.",
        ],
      },
    ],
  },
  ckb: {
    title: "مەرجەکانی بەکارهێنان",
    sections: [
      {
        title: "1. پەسەندکردن",
        paragraphs: [
          "بە دروستکردن یان بەکارهێنانی هەژماری Sponsor.krd، ئەم مەرجانە پەسەند دەکەیت و دڵنیایی دەدەیت کە دەسەڵاتی یاساییت بۆ نوێنەرایەتیکردنی بزنسەکەت هەیە.",
        ],
      },
      {
        title: "2. هەژمار و ئاسایش",
        paragraphs: [
          "ناسنامە بە Google پشتڕاست دەکرێتەوە. تۆ بەرپرسی پاراستنی هەژماری Google و ڕاستی زانیارییە پێشکەشکراوەکانیت. هەوڵی دەستگەیشتنی بێ‌مۆڵەت، خراپ بەکارهێنان، یان تێکدانی خزمەتگوزاری قەدەغەیە.",
        ],
      },
      {
        title: "3. ناوەڕۆک و بەکارهێنان",
        paragraphs: [
          "تۆ خاوەنی ناوەڕۆکی خۆتی و بەرپرسی یاساییبوون، مۆڵەت، ڕاستی و مافەکانی. ناوەڕۆکی نایاسایی، فریودەرانە، زیانبەخش، یان پێشێلکەری مافی کەسانی تر ڕێگەپێنەدراوە.",
        ],
      },
      {
        title: "4. پلان و سنوور",
        paragraphs: [
          "پلان لەلایەن بەڕێوەبەرەوە دیاری دەکرێت. تایبەتمەندی و سنوورەکان بە پلانی چالاکەوە بەستراون. پارەدان هێشتا بەشێک لە خزمەتگوزاری نییە و هیچ پلانی پارەدراو بەبێ پشتڕاستکردنەوەی ڕەوا چالاک ناکرێت.",
        ],
      },
      {
        title: "5. ڕاگرتن و کۆتایی",
        paragraphs: [
          "Sponsor.krd دەتوانێت بۆ پاراستنی ئاسایش، یاسا، یان خزمەتگوزاری هەژمارێک ڕابگرێت. لە کاتی کۆتایی، مافە پێویستەکان بۆ پاراستنی تۆمارە یاسایی و ئاسایشییەکان بەردەوام دەبن.",
        ],
      },
      {
        title: "6. سنووری بەرپرسیارێتی",
        paragraphs: [
          "خزمەتگوزاری بە شێوەی بەردەست پێشکەش دەکرێت. تا سنووری ڕێگەپێدراوی یاسا، Sponsor.krd بەرپرسی زیانی ناڕاستەوخۆ یان لەدەستدانی قازانج نییە.",
        ],
      },
      {
        title: "7. گۆڕانکاری",
        paragraphs: [
          "گۆڕانکارییە گرنگەکان بە وەشانی نوێ و ئاگادارکردنەوە تۆمار دەکرێن. پەسەندکردنی نوێ بۆ گۆڕانکارییە بنەڕەتییەکان داوا دەکرێت.",
        ],
      },
      {
        title: "8. فۆڕم و کۆکردنەوەی زانیاری",
        paragraphs: [
          "خزمەتگوزاریی فۆڕم، فۆڕم و وێنە و هەڵبژاردەکانی وەڵام بۆ هەژماری دروستکەر پاشەکەوت دەکات. فۆڕمی بڵاوکراوە لە ناونیشانی گشتیی خۆی وەڵام کۆدەکاتەوە. فۆڕمی ڕاگیراو وەڵام وەرناگرێت. ئەرشیف تەنها ڕێکخستنی داشبۆردە و چالاک یان ڕاگیراو بوونی فۆڕمەکە دەپارێزێت. وەڵامەکانی پێشبینینی داشبۆرد نانێردرێن و وەک وەڵام پاشەکەوت ناکرێن.",
          "پێش کۆکردنەوەی وەڵامی ڕاستەقینە یان بەکارهێنانی فۆڕم لە ڕیکلامدا، بزنس دەبێت تایبەتمەندی بە ڕاستی ڕوون بکاتەوە، تەنها زانیاری پێویست کۆبکاتەوە، دەستگەیشتن بپارێزێت، ماوەی پاراستن دیاری بکات و ڕەزامەندیی یاسایی پێویست وەربگرێت. تەنها بەستەری سیاسەتی پلاتفۆرم هەموو ئەرکەکانی ڕیکلامکەر جێبەجێ ناکات.",
        ],
      },
      {
        title: "9. ڕیکلامی لایەنی سێیەم",
        paragraphs: [
          "ڕیکلام و فۆڕمە ڕاستەوخۆکانی TikTok بە سیاسەت و مەرجەکانی خۆی بەڕێوە دەچن. بزنس بەرپرسی ناوەڕۆک، ڕوونکردنەوە، مۆڵەت و پابەندبوونە. Sponsor.krd پەسەندکردنی TikTok مسۆگەر ناکات و ئەم پێشبینینانە بە پەیوەندیی فەرمیی TikTok ناناسێنێت.",
        ],
      },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    sections: [
      {
        title: "1. القبول",
        paragraphs: [
          "بإنشاء حساب في Sponsor.krd أو استخدامه، فإنك توافق على هذه الشروط وتؤكد أن لديك الصلاحية القانونية لتمثيل نشاطك التجاري.",
        ],
      },
      {
        title: "2. الحساب والأمان",
        paragraphs: [
          "يُتحقق من الهوية عبر Google. أنت مسؤول عن حماية حسابك لدى Google وصحة المعلومات التي تقدمها. يُحظر الوصول غير المصرح به، أو إساءة الاستخدام، أو تعطيل الخدمة.",
        ],
      },
      {
        title: "3. المحتوى والاستخدام",
        paragraphs: [
          "تحتفظ بملكية محتواك، وتتحمل مسؤولية قانونيته والتراخيص اللازمة له ودقته والحقوق المتعلقة به. لا يُسمح بالمحتوى غير القانوني أو الاحتيالي أو الضار أو الذي ينتهك حقوق الآخرين.",
        ],
      },
      {
        title: "4. الخطط والحدود",
        paragraphs: [
          "يحدد المسؤول الخطة. ترتبط الميزات والحدود بالخطة النشطة. لا تشكل المدفوعات حاليًا جزءًا من الخدمة، ولا تُفعّل أي خطة مدفوعة دون تحقق مشروع.",
        ],
      },
      {
        title: "5. التعليق والإنهاء",
        paragraphs: [
          "يجوز لـ Sponsor.krd تعليق الحساب لحماية الأمان أو الامتثال للقانون أو صون الخدمة. عند الإنهاء، تبقى الحقوق اللازمة للاحتفاظ بالسجلات القانونية والأمنية سارية.",
        ],
      },
      {
        title: "6. حدود المسؤولية",
        paragraphs: [
          "تُقدّم الخدمة كما هي متاحة. إلى الحد الذي يسمح به القانون، لا تتحمل Sponsor.krd مسؤولية الأضرار غير المباشرة أو خسارة الأرباح.",
        ],
      },
      {
        title: "7. التغييرات",
        paragraphs: [
          "تُسجّل التغييرات المهمة بإصدار جديد وإشعار. وتُطلب موافقة جديدة على التغييرات الجوهرية.",
        ],
      },
      {
        title: "8. النماذج وجمع البيانات",
        paragraphs: [
          "تحفظ خدمة النماذج النماذج والصور وخيارات الإجابات للحساب الذي ينشئها. تجمع النماذج المنشورة الردود عبر عنوانها العام. لا تقبل النماذج المتوقفة الردود. الأرشفة تنظّم لوحة التحكم فقط وتحافظ على حالة النموذج نشطًا أو متوقفًا. لا تُرسل إجابات معاينة لوحة التحكم ولا تُحفظ كردود.",
          "قبل جمع ردود حقيقية أو استخدام نموذج في الإعلانات، يجب على النشاط تقديم إفصاحات دقيقة وجمع المعلومات الضرورية فقط وحماية الوصول إلى الردود وتحديد مدة مناسبة للاحتفاظ والحصول على أي موافقة يفرضها القانون. روابط سياسة المنصة وحدها لا تفي بكل التزامات المعلن.",
        ],
      },
      {
        title: "9. إعلانات الأطراف الثالثة",
        paragraphs: [
          "تخضع إعلانات TikTok ونماذجه الفورية لسياسات TikTok وشروط جمع بيانات العملاء الخاصة به. يتحمل النشاط مسؤولية محتوى إعلاناته وإفصاحاته وأذوناته والتزامه. لا تضمن Sponsor.krd موافقة TikTok ولا تدعي أن هذه المعاينات تكامل رسمي معه.",
        ],
      },
    ],
  },
};

export const privacyCopy: Record<RootPublicLocale, LegalCopy> = {
  en: {
    title: "Privacy policy",
    sections: [
      {
        title: "1. Information we collect",
        paragraphs: [
          "We collect Google identity, verified email, name, account image, business information, mobile number, brand images, subdomain, social profiles, legal consents, sessions, and security logs.",
        ],
      },
      {
        title: "2. How we use information",
        paragraphs: [
          "We use information to verify identity, review applications, create and manage accounts, protect security, provide support, comply with law, and improve the service.",
        ],
      },
      {
        title: "3. Sharing",
        paragraphs: [
          "We share information as needed with Google, TikTok, and necessary infrastructure, storage, and security providers. On eligible published public Linktree pages only, TikTok Pixel and Events API may operate automatically and collect visit and action data, IP address, browser and device type, cookies, advertising identifiers, and ad attribution data. We do not sell personal information. We may disclose information in response to a valid legal request.",
        ],
      },
      {
        title: "4. Protection and retention",
        paragraphs: [
          "We use access controls, tenant isolation, secure cookies, and audit records to protect information. Account and business information is retained while needed to provide the service; operational records follow the configured retention policy. Security, dispute, and legal records may need longer retention. Contact us for retention or deletion details for your account. Unsaved editor changes and preview answers are cleared when the page is left or reloaded. Saved forms and submitted responses remain until deleted; archiving does not delete them.",
        ],
      },
      {
        title: "5. Your rights",
        paragraphs: [
          "Subject to applicable law, you may request access to, correction of, restriction of, or deletion of your information. Some security and legal records may be retained for the required period.",
        ],
      },
      {
        title: "6. Transfers and children",
        paragraphs: [
          "The business service is not intended for people below the applicable legal age. Infrastructure providers may process information outside your country. Contact us for details of the providers, processing locations, and safeguards relevant to your account.",
        ],
      },
      {
        title: "7. Contact and changes",
        paragraphs: [
          "For privacy questions or requests to access, correct, or delete platform information, email esma3ildilshad04x@gmail.com. Identify the relevant account or business without sending passwords or sensitive documents. For information collected by a business, contact that business directly. This policy’s revision date appears above; material changes will be explained through the service.",
        ],
        links: [
          {
            label: "esma3ildilshad04x@gmail.com",
            href: "mailto:esma3ildilshad04x@gmail.com",
          },
        ],
      },
      {
        title: "8. Forms, responses and business responsibility",
        paragraphs: [
          "Sponsor.krd stores saved form definitions, uploaded images and conditional answer sets. Submitting a published form stores the supplied answers, submission time, form revision and privacy acknowledgement for its owner. First-party analytics records visits, starts, successful submissions and final-page actions, with visitor/session identifiers, IP-derived security signals, browser/device, country, referrer, campaign attribution and completion time. Answer values are kept separately from analytics and are not sent to TikTok. Dashboard preview answers remain temporary.",
          "Sponsor.krd is responsible for its platform account and service data. A business that collects leads is responsible for identifying itself and explaining the information it collects, its purpose, recipients, retention, and a contact for privacy requests. These platform documents do not replace that business’s own disclosures.",
        ],
      },
      {
        title: "9. TikTok and lead advertising",
        paragraphs: [
          "Native TikTok Instant Forms operate under TikTok’s privacy policy and Lead Generation Terms, together with the advertiser’s own privacy notice. A Sponsor.krd form is not a TikTok Instant Form and does not automatically import TikTok profile data or send answers to TikTok.",
          "TikTok marketing tracking is limited to eligible published public Linktree pages. It is not placed on the root website, legal pages, dashboards, sign-in pages, business landing pages, or the advertising page. Opening a policy link or editing a form does not enable TikTok marketing tracking.",
          "A privacy acknowledgement is not permission for unrelated marketing. If a business needs marketing consent, it must obtain a separate, freely chosen opt-in and explain how to withdraw it.",
        ],
        links: [
          {
            label: "TikTok privacy policy",
            href: "https://www.tiktok.com/legal/partner-privacy-policy",
          },
          {
            label: "TikTok Lead Generation Terms",
            href: "https://ads.tiktok.com/i18n/official/policy/lead-gen-terms",
          },
          {
            label: "TikTok privacy guidance for advertisers",
            href: "https://ads.tiktok.com/resources/help/article/explaining-privacy-practices-to-lead-generation-ads-users",
          },
        ],
      },
    ],
  },
  ckb: {
    title: "سیاسەتی تایبەتمەندی",
    sections: [
      {
        title: "1. زانیارییە کۆکراوەکان",
        paragraphs: [
          "ناسنامەی Google، ئیمەیڵی پشتڕاستکراو، ناو، وێنەی هەژمار، زانیاری بزنس، ژمارەی مۆبایل، وێنەکانی براند، ساب‌دۆمەین، پڕۆفایلی کۆمەڵایەتی، پەسەندکردنی یاسایی، دانیشتن و تۆماری ئاسایش کۆدەکرێنەوە.",
        ],
      },
      {
        title: "2. مەبەستی بەکارهێنان",
        paragraphs: [
          "زانیاری بۆ پشتڕاستکردنەوەی ناسنامە، پێداچوونەوەی داواکاری، دروستکردن و بەڕێوەبردنی هەژمار، پاراستنی ئاسایش، پشتیوانی، پابەندبوون بە یاسا و باشترکردنی خزمەتگوزاری بەکاردێت.",
        ],
      },
      {
        title: "3. هاوبەشکردن",
        paragraphs: [
          "زانیاری بە Google، TikTok و دابینکەرانی پێویستی ژێرخان، هەڵگرتن و ئاسایش بە قەدەر پێویست هاوبەش دەکرێت. تەنها لە پەڕە گشتییە بڵاوکراوە ڕێگەپێدراوەکانی Linktreeدا TikTok Pixel و Events API بە شێوەی خۆکار کار دەکەن و دەتوانن زانیاریی سەردان و کردار، IP، جۆری وێبگەڕ و ئامێر، کوکی و ناسێنەرەکانی ڕیکلام و زانیاریی بەستنەوەی ڕیکلام وەربگرن. زانیاری کەسی نافرۆشرێت. لە داواکاری یاسایی ڕەوادا زانیاری دەکرێت بدرێت.",
        ],
      },
      {
        title: "4. پاراستن و ماوە",
        paragraphs: [
          "کۆنترۆڵی دەستگەیشتن، جیاکردنەوەی بزنس، کوکی پارێزراو و تۆمار بۆ پاراستنی زانیاری بەکاردێن. زانیاری هەژمار و بزنس تا کاتی پێویست بۆ خزمەتگوزاری دەپارێزرێت؛ تۆمارە کارگێڕییەکان بە سیاسەتی ماوەی دیاریکراو بەڕێوە دەچن. تۆمارە ئاسایشی و یاساییەکان و ناکۆکییەکان لەوانەیە ماوەی زیاتر پێویست بێت. بۆ وردەکاریی ماوە یان سڕینەوەی هەژمارەکەت پەیوەندیمان پێوە بکە. گۆڕانکاریی پاشەکەوتنەکراو و وەڵامی پێشبینین بە جێهێشتن یان نوێکردنەوەی پەڕە دەسڕدرێتەوە. فۆڕمی پاشەکەوتکراو و وەڵامی نێردراو تا سڕینەوە دەمێننەوە؛ ئەرشیفکردن نایانسڕێتەوە.",
        ],
      },
      {
        title: "5. مافەکانت",
        paragraphs: [
          "بەپێی یاسای جێبەجێبوو، دەتوانیت داوای بینین، ڕاستکردنەوە، سنووردارکردن یان سڕینەوەی زانیارییەکەت بکەیت. هەندێک تۆماری ئاسایشی و یاسایی بۆ ماوەی پێویست دەپارێزرێن.",
        ],
      },
      {
        title: "6. گواستنەوە و منداڵان",
        paragraphs: [
          "خزمەتگوزاریی بزنس بۆ کەسانی خوار تەمەنی یاسایی نییە. دابینکەرانی ژێرخان لەوانەیە زانیاری لە دەرەوەی وڵاتەکەت بەڕێوە ببەن. بۆ وردەکاریی دابینکەر، شوێنی بەڕێوەبردن و پاراستنی پەیوەندیدار بە هەژمارەکەت پەیوەندیمان پێوە بکە.",
        ],
      },
      {
        title: "7. پەیوەندی و گۆڕانکاری",
        paragraphs: [
          "بۆ پرسیاری تایبەتمەندی یان داوای بینین، ڕاستکردنەوە و سڕینەوەی زانیاریی پلاتفۆرم، ئیمەیڵ بۆ esma3ildilshad04x@gmail.com بنێرە. هەژمار یان بزنسە پەیوەندیدارەکە بناسێنە بەبێ ناردنی وشەی نهێنی یان بەڵگەی هەستیار. بۆ زانیاریی کۆکراوەی بزنس، ڕاستەوخۆ پەیوەندی بەو بزنسە بکە. بەرواری وەشان لە سەرەوەیە؛ گۆڕانکارییە گرنگەکان لە خزمەتگوزاری ڕوون دەکرێنەوە.",
        ],
        links: [
          {
            label: "esma3ildilshad04x@gmail.com",
            href: "mailto:esma3ildilshad04x@gmail.com",
          },
        ],
      },
      {
        title: "8. فۆڕم و وەڵام و بەرپرسیارێتی بزنس",
        paragraphs: [
          "Sponsor.krd فۆڕم و وێنە و هەڵبژاردەکانی وەڵام پاشەکەوت دەکات. ناردنی فۆڕمی بڵاوکراوە، وەڵام و کاتی ناردن و وەشانی فۆڕم و پەسەندکردنی تایبەتمەندی بۆ خاوەنەکەی تۆمار دەکات. ئاماری ناوخۆیی سەردان، دەستپێکردن، ناردنی سەرکەوتوو و کردارەکانی پەڕەی کۆتایی، لەگەڵ ناسێنەری سەردانکەر و دانیشتن، نیشانە ئاسایشییەکانی IP، وێبگەڕ و ئامێر، وڵات، سەرچاوەی سەردان، ڕیکلام و ماوەی پڕکردنەوە تۆمار دەکات. وەڵامەکان لە ئامار جیا پاشەکەوت دەکرێن و بۆ TikTok نانێردرێن. وەڵامی پێشبینینی داشبۆرد کاتییە.",
          "Sponsor.krd بەرپرسی زانیاری هەژمار و خزمەتگوزاریی پلاتفۆرمە. بزنسێک کە زانیاری خەڵک کۆدەکاتەوە بەرپرسی ناساندنی خۆی و ڕوونکردنەوەی جۆری زانیاری، مەبەست، وەرگر، ماوەی پاراستن و ڕێگای پەیوەندی بۆ داواکاریی تایبەتمەندییە. ئەم بەڵگەنامانەی پلاتفۆرم جێگای ڕوونکردنەوەکانی بزنس ناگرنەوە.",
        ],
      },
      {
        title: "9. TikTok و ڕیکلامی کۆکردنەوەی زانیاری",
        paragraphs: [
          "فۆڕمە ڕاستەوخۆکانی TikTok بە سیاسەتی تایبەتمەندی و مەرجەکانی کۆکردنەوەی زانیاریی TikTok، لەگەڵ ڕوونکردنەوەی ڕیکلامکەر، بەڕێوە دەچن. فۆڕمی Sponsor.krd فۆڕمی TikTok نییە؛ زانیاری پڕۆفایلی TikTok بە خۆکار وەرناگرێت و وەڵام بۆ TikTok نانێرێت.",
          "بەدواداچوونی بانگەشەی TikTok تەنها بۆ پەڕە گشتییە بڵاوکراوە ڕێگەپێدراوەکانی Linktreeە. لە وێبسایتی ڕەگ، پەڕە یاساییەکان، داشبۆرد، چوونەژوورەوە، پەڕەی سەرەکیی بزنس و پەڕەی ڕیکلام نییە. کردنەوەی بەستەری سیاسەت یان دەستکاریی فۆڕم ئەم بەدواداچوونە چالاک ناکات.",
          "پەسەندکردنی تایبەتمەندی مۆڵەتی بانگەشەی ناپەیوەندیدار نییە. ئەگەر بزنس ڕەزامەندی بانگەشەی پێویستە، دەبێت بە جیا و بە هەڵبژاردنی ئازاد وەری بگرێت و ڕێگای کشانەوەی ڕوون بکاتەوە.",
        ],
        links: [
          {
            label: "سیاسەتی تایبەتمەندیی TikTok",
            href: "https://www.tiktok.com/legal/partner-privacy-policy",
          },
          {
            label: "مەرجەکانی کۆکردنەوەی زانیاریی TikTok",
            href: "https://ads.tiktok.com/i18n/official/policy/lead-gen-terms",
          },
          {
            label: "ڕێنمایی تایبەتمەندیی TikTok بۆ ڕیکلامکەران",
            href: "https://ads.tiktok.com/resources/help/article/explaining-privacy-practices-to-lead-generation-ads-users",
          },
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    sections: [
      {
        title: "1. المعلومات التي نجمعها",
        paragraphs: [
          "نجمع هوية Google، والبريد الإلكتروني المتحقق منه، والاسم، وصورة الحساب، ومعلومات النشاط التجاري، ورقم الهاتف، وصور العلامة التجارية، والنطاق الفرعي، والملفات الاجتماعية، والموافقات القانونية، والجلسات، وسجلات الأمان.",
        ],
      },
      {
        title: "2. أغراض الاستخدام",
        paragraphs: [
          "نستخدم المعلومات للتحقق من الهوية، ومراجعة الطلبات، وإنشاء الحسابات وإدارتها، وحماية الأمان، وتقديم الدعم، والامتثال للقانون، وتحسين الخدمة.",
        ],
      },
      {
        title: "3. المشاركة",
        paragraphs: [
          "نشارك المعلومات بالقدر اللازم مع Google وTikTok ومزودي البنية التحتية والتخزين والأمان الضروريين. في صفحات Linktree العامة المنشورة والمؤهلة فقط، قد يعمل TikTok Pixel وEvents API تلقائيًا ويجمعان بيانات الزيارات والإجراءات وعنوان IP ونوع المتصفح والجهاز وملفات تعريف الارتباط ومعرّفات الإعلانات وبيانات ربط الإعلانات. لا نبيع المعلومات الشخصية. وقد نكشف المعلومات استجابةً لطلب قانوني مشروع.",
        ],
      },
      {
        title: "4. الحماية والاحتفاظ",
        paragraphs: [
          "نستخدم ضوابط الوصول وعزل الأنشطة وملفات تعريف الارتباط الآمنة وسجلات التدقيق لحماية المعلومات. نحتفظ ببيانات الحساب والنشاط ما دامت لازمة لتقديم الخدمة؛ تخضع السجلات التشغيلية لسياسة الاحتفاظ المُعدّة. قد تتطلب سجلات الأمان والنزاعات والسجلات القانونية مدة أطول. اتصل بنا لمعرفة تفاصيل الاحتفاظ أو حذف بيانات حسابك. تُمسح التغييرات غير المحفوظة وإجابات المعاينة عند مغادرة الصفحة أو إعادة تحميلها. تبقى النماذج المحفوظة والردود المرسلة حتى حذفها؛ الأرشفة لا تحذفها.",
        ],
      },
      {
        title: "5. حقوقك",
        paragraphs: [
          "وفقًا للقانون المعمول به، يمكنك طلب الاطلاع على معلوماتك أو تصحيحها أو تقييد استخدامها أو حذفها. وقد نحتفظ ببعض السجلات الأمنية والقانونية للمدة اللازمة.",
        ],
      },
      {
        title: "6. النقل والأطفال",
        paragraphs: [
          "خدمة الأنشطة التجارية ليست مخصصة لمن هم دون السن القانونية المعمول بها. قد يعالج مزودو البنية التحتية المعلومات خارج بلدك. اتصل بنا لمعرفة المزودين ومواقع المعالجة ووسائل الحماية المتعلقة بحسابك.",
        ],
      },
      {
        title: "7. الاتصال والتغييرات",
        paragraphs: [
          "لأسئلة الخصوصية أو طلب الوصول إلى معلومات المنصة أو تصحيحها أو حذفها، راسل esma3ildilshad04x@gmail.com. حدد الحساب أو النشاط المعني دون إرسال كلمات مرور أو وثائق حساسة. بالنسبة للمعلومات التي يجمعها نشاط تجاري، اتصل به مباشرة. يظهر تاريخ إصدار السياسة أعلاه؛ وتُوضح التغييرات المهمة عبر الخدمة.",
        ],
        links: [
          {
            label: "esma3ildilshad04x@gmail.com",
            href: "mailto:esma3ildilshad04x@gmail.com",
          },
        ],
      },
      {
        title: "8. النماذج والردود ومسؤولية النشاط التجاري",
        paragraphs: [
          "يحفظ Sponsor.krd تعريفات النماذج والصور وخيارات الإجابات. يحفظ إرسال نموذج منشور الإجابات ووقت الإرسال وإصدار النموذج وإقرار الخصوصية لمالكه. تسجل تحليلات المنصة الزيارات والبدء والإرسال الناجح وإجراءات الصفحة النهائية مع معرّفات الزائر والجلسة وإشارات الأمان المستمدة من IP والمتصفح والجهاز والبلد والمصدر وبيانات الحملة ومدة الإكمال. تُحفظ الإجابات منفصلة عن التحليلات ولا تُرسل إلى TikTok. تبقى إجابات معاينة لوحة التحكم مؤقتة.",
          "Sponsor.krd مسؤول عن بيانات حسابات المنصة وخدمتها. النشاط التجاري الذي يجمع بيانات العملاء مسؤول عن تعريف نفسه وشرح المعلومات التي يجمعها والغرض والمستلمين ومدة الاحتفاظ ووسيلة الاتصال لطلبات الخصوصية. لا تحل وثائق المنصة محل إفصاحات النشاط التجاري.",
        ],
      },
      {
        title: "9. TikTok وإعلانات جمع بيانات العملاء",
        paragraphs: [
          "تخضع نماذج TikTok الفورية الأصلية لسياسة خصوصية TikTok وشروط جمع بيانات العملاء، إلى جانب إشعار خصوصية المعلن. نماذج Sponsor.krd ليست نماذج فورية من TikTok ولا تستورد بيانات الملف الشخصي تلقائيًا ولا ترسل الإجابات إلى TikTok.",
          "يقتصر تتبع TikTok التسويقي على صفحات Linktree العامة المنشورة والمؤهلة. لا يوضع على الموقع الرئيسي أو الصفحات القانونية أو لوحات التحكم أو تسجيل الدخول أو صفحات الأنشطة الرئيسية أو صفحة الإعلانات. فتح رابط السياسة أو تحرير نموذج لا يفعّل هذا التتبع.",
          "إقرار الخصوصية ليس إذنًا لتسويق غير مرتبط. إذا احتاج النشاط إلى موافقة تسويقية، فعليه الحصول على اختيار منفصل وحر وشرح طريقة سحب الموافقة.",
        ],
        links: [
          {
            label: "سياسة خصوصية TikTok",
            href: "https://www.tiktok.com/legal/partner-privacy-policy",
          },
          {
            label: "شروط TikTok لجمع بيانات العملاء",
            href: "https://ads.tiktok.com/i18n/official/policy/lead-gen-terms",
          },
          {
            label: "إرشادات خصوصية TikTok للمعلنين",
            href: "https://ads.tiktok.com/resources/help/article/explaining-privacy-practices-to-lead-generation-ads-users",
          },
        ],
      },
    ],
  },
};
