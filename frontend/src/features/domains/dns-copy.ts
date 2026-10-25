export const domainDnsCopy = {
  en: {
    intro:
      "Complete both routing and ownership at the DNS provider that manages this domain's active nameservers.",
    provider: "1. Open the active DNS zone",
    providerHelp:
      "Use the DNS provider listed by the domain's nameservers. Editing a zone at a different provider has no effect. Keep existing MX, email TXT and unrelated records.",
    routing: "2. Point the hostname to this server",
    routingHelp:
      "Add each address below at this exact hostname. Replace only conflicting A/AAAA records for this hostname. Use DNS-only mode: CDN proxies, parking and URL forwarding are not supported.",
    name: "Record name (full hostname)",
    value: "Record value",
    ttl: "TTL: Auto or your provider's default.",
    names:
      "Some DNS panels append the zone name automatically. For a root domain, enter @ for its address record and _sponsor-verification for TXT. For www, enter www and _sponsor-verification.www. Otherwise use the corresponding relative name; do not append the domain twice.",
    noIpv4: "No IPv4 address is configured. Use the AAAA records below.",
    noIpv6:
      "No IPv6 address is configured. Remove any AAAA record for this hostname; an old IPv6 address can break verification and visitor access.",
    noAddresses:
      "Server addresses are not configured. Ask the platform administrator to configure them before changing DNS.",
    ownership: "3. Keep the ownership proof",
    ownershipHelp:
      "Add this TXT record exactly as shown, including sponsor-verification=. Keep it after verification; routing records alone do not prove ownership.",
    propagation: "4. Save, wait and verify",
    propagationHelp:
      "Save all records, then select Verify DNS. Changes often appear in minutes, but cached records can persist until their previous TTL expires, sometimes 24–48 hours. Repeated verification does not clear DNS caches. If routing fails, check both A and AAAA records at the active provider.",
    activate: "5. Activate the custom address",
    activateHelp:
      "When DNS is verified, select Make primary. HTTPS must be ready first; if it is still being issued, retry shortly. Until then the default Sponsor.krd address stays in use. Activation moves both the public website and dashboard; the old address returns 404 and a fresh sign-in is required.",
    verified: "DNS verified. Select Make primary to finish activation.",
    primary:
      "This domain is primary. Its public website and dashboard use this address.",
    pending:
      "DNS is not verified yet. Complete the records below, then verify.",
    disconnected:
      "This domain is disconnected. Restore the required records, verify DNS, then select Make primary again.",
    maintain: "6. Keep these records in place",
    maintainHelp:
      "Sponsor.krd rechecks DNS periodically. Deleting the ownership TXT or changing routing can disconnect the domain and restore the default address. After correcting DNS, verify and activate it again. The platform cannot prevent changes at your DNS provider.",
    scope:
      "Only the hostname shown here is connected. A root domain and its www hostname are separate; adding one does not connect the other.",
  },
  ar: {
    intro:
      "أكمل سجلات التوجيه والملكية لدى مزود DNS الذي يدير خوادم الأسماء الفعالة لهذا النطاق.",
    provider: "1. افتح منطقة DNS الفعالة",
    providerHelp:
      "استخدم مزود DNS المحدد في خوادم أسماء النطاق. التعديل لدى مزود آخر لن يؤثر. احتفظ بسجلات MX والبريد والسجلات غير المرتبطة.",
    routing: "2. وجّه اسم المضيف إلى هذا الخادم",
    routingHelp:
      "أضف كل عنوان أدناه لاسم المضيف المحدد. استبدل فقط سجلات A/AAAA المتعارضة لهذا الاسم. استخدم وضع DNS فقط؛ وكيل CDN وصفحات الحجز وإعادة توجيه الروابط غير مدعومة.",
    name: "اسم السجل (اسم المضيف الكامل)",
    value: "قيمة السجل",
    ttl: "TTL: تلقائي أو القيمة الافتراضية لدى المزود.",
    names:
      "تضيف بعض اللوحات اسم النطاق تلقائياً. للنطاق الرئيسي استخدم @ لسجل العنوان و_sponsor-verification لسجل TXT. ولـ www استخدم www و_sponsor-verification.www. لبقية الأسماء استخدم الاسم النسبي المناسب؛ لا تكرر اسم النطاق.",
    noIpv4: "لم يُضبط عنوان IPv4. استخدم سجلات AAAA أدناه.",
    noIpv6:
      "لم يُضبط عنوان IPv6. احذف أي سجل AAAA لهذا الاسم؛ قد يمنع عنوان قديم التحقق ووصول الزوار.",
    noAddresses:
      "عناوين الخادم غير مضبوطة. اطلب من مسؤول المنصة ضبطها قبل تعديل DNS.",
    ownership: "3. احتفظ بإثبات الملكية",
    ownershipHelp:
      "أضف سجل TXT كما يظهر تماماً، بما فيه sponsor-verification=. احتفظ به بعد التحقق؛ سجلات التوجيه وحدها لا تثبت الملكية.",
    propagation: "4. احفظ وانتظر ثم تحقق",
    propagationHelp:
      "احفظ جميع السجلات ثم اختر التحقق من DNS. تظهر التغييرات غالباً خلال دقائق، لكن التخزين المؤقت قد يستمر حتى انتهاء TTL السابق، وأحياناً 24–48 ساعة. تكرار التحقق لا يمسح الذاكرة المؤقتة. عند فشل التوجيه افحص A وAAAA لدى المزود الفعال.",
    activate: "5. فعّل العنوان المخصص",
    activateHelp:
      "بعد التحقق من DNS اختر جعله أساسياً. يجب أن يصبح HTTPS جاهزاً أولاً؛ إن كانت الشهادة قيد الإصدار فأعد المحاولة بعد قليل. حتى ذلك الوقت يبقى عنوان Sponsor.krd الافتراضي مستخدماً. ينتقل الموقع ولوحة الأعمال إلى العنوان الجديد، ويعيد القديم 404 ويتطلب تسجيل دخول جديداً.",
    verified: "تم التحقق من DNS. اختر جعله أساسياً لإكمال التفعيل.",
    primary: "هذا النطاق أساسي. يستخدم الموقع ولوحة الأعمال هذا العنوان.",
    pending: "لم يتم التحقق من DNS بعد. أكمل السجلات أدناه ثم تحقق.",
    disconnected:
      "النطاق غير متصل. أعد السجلات المطلوبة وتحقق من DNS ثم اجعله أساسياً من جديد.",
    maintain: "6. احتفظ بهذه السجلات",
    maintainHelp:
      "تعيد المنصة فحص DNS دورياً. حذف TXT الخاص بالملكية أو تغيير التوجيه قد يفصل النطاق ويعيد العنوان الافتراضي. بعد إصلاح DNS تحقق وفعّله مجدداً. لا تستطيع المنصة منع التغييرات لدى مزود DNS.",
    scope:
      "يرتبط اسم المضيف الظاهر هنا فقط. النطاق الرئيسي وwww اسمان منفصلان؛ إضافة أحدهما لا تربط الآخر.",
  },
  ckb: {
    intro:
      "تۆمارەکانی ئاراستەکردن و خاوەندارێتی لە دابینکەری DNS کە nameserver ـە چالاکەکانی ئەم دۆمەینە بەڕێوە دەبات تەواو بکە.",
    provider: "1. ناوچەی DNS ـی چالاک بکەرەوە",
    providerHelp:
      "ئەو دابینکەرە بەکاربهێنە کە لە nameserver ـەکانی دۆمەینەکە دیارە. گۆڕانکاری لای دابینکەرێکی تر کاریگەری نییە. تۆمارەکانی MX، ئیمەیڵ و تۆمارە ناپەیوەندیدارەکان بپارێزە.",
    routing: "2. ناوی هۆستەکە بەرەو ئەم سێرڤەرە ئاراستە بکە",
    routingHelp:
      "هەر ناونیشانێکی خوارەوە بۆ هەمان ناوی هۆست زیاد بکە. تەنها تۆمارە ناکۆکەکانی A/AAAA بۆ ئەم ناوە بگۆڕە. دۆخی DNS-only بەکاربهێنە؛ پرۆکسی CDN، پەڕەی پارککردن و URL forwarding پشتگیری ناکرێن.",
    name: "ناوی تۆمار (ناوی تەواوی هۆست)",
    value: "بەهای تۆمار",
    ttl: "TTL: Auto یان بەهای بنەڕەتی دابینکەرەکە.",
    names:
      "هەندێک پانێڵ ناوی دۆمەین خۆکار زیاد دەکات. بۆ دۆمەینی سەرەکی @ بۆ ناونیشان و _sponsor-verification بۆ TXT بنووسە. بۆ www، ناوەکانی www و _sponsor-verification.www بەکاربهێنە. بۆ ناوەکانی تر ناوی ڕێژەیی گونجاو بەکاربهێنە؛ ناوی دۆمەین دووبارە مەکەرەوە.",
    noIpv4:
      "ناونیشانی IPv4 ڕێک نەخراوە. تۆمارەکانی AAAA ـی خوارەوە بەکاربهێنە.",
    noIpv6:
      "ناونیشانی IPv6 ڕێک نەخراوە. هەر تۆمارێکی AAAA بۆ ئەم ناوە بسڕەوە؛ ناونیشانی کۆن دەتوانێت ڕێگری لە پشتڕاستکردنەوە و سەردان بکات.",
    noAddresses:
      "ناونیشانەکانی سێرڤەر ڕێک نەخراون. پێش گۆڕینی DNS داوا لە بەڕێوەبەری پلاتفۆرم بکە ڕێکیان بخات.",
    ownership: "3. بەڵگەی خاوەندارێتی بپارێزە",
    ownershipHelp:
      "ئەم تۆمارەی TXT وەک خۆی زیاد بکە، لەگەڵ sponsor-verification=. دوای پشتڕاستکردنەوەش بیپارێزە؛ تۆمارەکانی ئاراستەکردن بە تەنها خاوەندارێتی ناسەلمێنن.",
    propagation: "4. پاشەکەوت بکە، چاوەڕێ بکە و پشتڕاستی بکەرەوە",
    propagationHelp:
      "هەموو تۆمارەکان پاشەکەوت بکە، پاشان پشکنینی DNS هەڵبژێرە. زۆرجار گۆڕانکاری لە چەند خولەکێکدا دەردەکەوێت، بەڵام کاش تا کۆتایی TTL ـی پێشوو دەمێنێتەوە، هەندێک جار 24–48 کاتژمێر. دووبارە پشکنین کاش پاک ناکاتەوە. ئەگەر ئاراستەکردن سەرکەوتوو نەبوو A و AAAA لای دابینکەری چالاک بپشکنە.",
    activate: "5. ناونیشانی تایبەت چالاک بکە",
    activateHelp:
      "کاتێک DNS پشتڕاست کرایەوە، بیکە بە سەرەکی. سەرەتا HTTPS دەبێت ئامادە بێت؛ ئەگەر بڕوانامەکە هێشتا دروست دەکرێت دوای کەمێک هەوڵ بدەرەوە. تا ئەو کاتە ناونیشانی بنەڕەتی Sponsor.krd بەکاردێت. ماڵپەڕ و داشبۆرد دەگوازنەوە؛ ناونیشانی کۆن 404 پیشان دەدات و پێویستە دووبارە بچیتە ژوورەوە.",
    verified: "DNS پشتڕاست کرایەوە. بۆ تەواوکردنی چالاککردن بیکە بە سەرەکی.",
    primary:
      "ئەم دۆمەینە سەرەکییە. ماڵپەڕ و داشبۆرد ئەم ناونیشانە بەکاردەهێنن.",
    pending:
      "DNS هێشتا پشتڕاست نەکراوەتەوە. تۆمارەکانی خوارەوە تەواو بکە، پاشان بیپشکنە.",
    disconnected:
      "ئەم دۆمەینە پچڕاوە. تۆمارە پێویستەکان بگەڕێنەوە، DNS بپشکنە و دووبارە بیکە بە سەرەکی.",
    maintain: "6. ئەم تۆمارانە بپارێزە",
    maintainHelp:
      "Sponsor.krd بەردەوام DNS دەپشکنێتەوە. سڕینەوەی TXT ـی خاوەندارێتی یان گۆڕینی ئاراستەکردن دۆمەینەکە دەپچڕێنێت و ناونیشانی بنەڕەتی دەگەڕێنێتەوە. دوای چاککردنی DNS دووبارە بیپشکنە و چالاکی بکەرەوە. پلاتفۆرم ناتوانێت ڕێگری لە گۆڕانکاری لای دابینکەری DNS بکات.",
    scope:
      "تەنها ئەو ناوی هۆستەی لێرە دیارە پەیوەست دەکرێت. دۆمەینی سەرەکی و www جیاوازن؛ زیادکردنی یەکێکیان ئەوی تر پەیوەست ناکات.",
  },
} satisfies Record<"en" | "ar" | "ckb", Record<string, string>>;
