import { createForm, createQuestion } from "@/features/forms/forms-model";
import { formEditorCopy } from "@/features/forms/form-editor-copy";
import { formsCopy } from "@/features/forms/forms-copy";
import type { FormContentBlock, FormDraft, FormLanguage, FormQuestion } from "@/features/forms/types";

const media = ["/images/form-preview/landscape.png", "/images/form-preview/gallery.png"];
const demoCopy = {
  en: { headline: "Let’s plan something together", description: "Explore the form, choose your preferences and try the different fields below.", slogan: "Your ideas start here", first: "Personal", second: "Business", region: "Region", city: "City", north: "North", south: "South", unit: "item", faq: "Can I customize this form?", answer: "Yes. Add your own questions, images, colors and content.", step: "Tell us what you need", detail: "Choose an option and share a few details.", review: "Clear, simple and easy to use.", product: "Starter package", upgrade: "Premium package" },
  ckb: { headline: "با پێکەوە پلانی شتێک دابنێین", description: "فۆرمەکە ببینە، هەڵبژاردنەکانت دیاری بکە و خانە جیاوازەکان تاقی بکەرەوە.", slogan: "بیرۆکەکانت لێرەوە دەست پێ دەکەن", first: "کەسی", second: "بازرگانی", region: "هەرێم", city: "شار", north: "باکوور", south: "باشوور", unit: "دانە", faq: "دەتوانم ئەم فۆرمە بگۆڕم؟", answer: "بەڵێ. پرسیار، وێنە، ڕەنگ و ناوەڕۆکی خۆت زیاد بکە.", step: "پێمان بڵێ پێویستت بە چییە", detail: "هەڵبژاردنێک دیاری بکە و چەند وردەکارییەک بنووسە.", review: "ڕوون و سادە و ئاسانە بۆ بەکارهێنان.", product: "پاکێجی سەرەتایی", upgrade: "پاکێجی پێشکەوتوو" },
  ar: { headline: "لنخطط لشيء معًا", description: "استكشف النموذج وحدد تفضيلاتك وجرّب الحقول المختلفة أدناه.", slogan: "أفكارك تبدأ هنا", first: "شخصي", second: "تجاري", region: "المنطقة", city: "المدينة", north: "الشمال", south: "الجنوب", unit: "قطعة", faq: "هل يمكنني تخصيص هذا النموذج؟", answer: "نعم. أضف أسئلتك وصورك وألوانك ومحتواك الخاص.", step: "أخبرنا بما تحتاجه", detail: "اختر خيارًا وشارك بعض التفاصيل.", review: "واضح وبسيط وسهل الاستخدام.", product: "الباقة الأساسية", upgrade: "الباقة المميزة" },
};

/** Catalogue-only demonstration. Never used to initialize or persist authored forms. */
export function createFormTemplateFixture(language: FormLanguage): FormDraft {
  const form = createForm(language), labels = formEditorCopy(language), copy = formsCopy(language), demo = demoCopy[language];
  const cities = language === "en" ? ["Erbil", "Duhok", "Baghdad"] : language === "ar" ? ["أربيل", "دهوك", "بغداد"] : ["هەولێر", "دهۆک", "بەغدا"];
  const question = (type: FormQuestion["type"], label: string, extra: Partial<FormQuestion> = {}): FormQuestion => ({
    ...createQuestion(type), id: `demo-question-${type}`, label, required: false, ...extra,
  });
  const questions: FormQuestion[] = [
    question("short", labels.personName), question("phone", copy.phone), question("email", copy.email),
    question("choice", copy.choice, { options: [demo.first, demo.second], optionImages: media }),
    question("conditional", labels.conditional, { conditional: { columns: [demo.region, demo.city], rows: [[demo.north, cities[0]], [demo.north, cities[1]], [demo.south, cities[2]]] } }),
    question("date", labels.date), question("image", labels.imageQuestion, { image: media[0] }),
    question("product", labels.productSelection.title, { productSelection: { currency: "IQD", items: [
      { id: "demo-starter", name: demo.product, unit: demo.unit, unitPrice: 15000 },
      { id: "demo-premium", name: demo.upgrade, unit: demo.unit, unitPrice: 25000 },
    ] } }),
  ];
  const blocks: FormContentBlock[] = [
    { id: "demo-text", type: "text", title: labels.text, text: demo.description },
    { id: "demo-image", type: "image", title: labels.image, text: demo.slogan, images: [media[0]] },
    { id: "demo-carousel", type: "carousel", title: labels.carousel, text: "", images: media },
    { id: "demo-products", type: "products", title: labels.products, text: demo.description, products: media.map((image, index) => ({ id: `demo-product-${index}`, image, title: index ? demo.upgrade : demo.product, description: demo.detail })) },
    { id: "demo-testimonials", type: "testimonials", title: labels.testimonials, text: "", testimonials: [{ id: "demo-review", image: "/images/business-logo-placeholder.png", title: labels.customer, description: demo.review }] },
    { id: "demo-steps", type: "steps", title: labels.steps, text: "", items: [{ id: "demo-step", title: demo.step, text: demo.detail }] },
    { id: "demo-about", type: "about", title: labels.about, text: demo.description, images: [media[1]] },
    { id: "demo-faq", type: "faq", title: labels.faq, text: "", items: [{ id: "demo-faq-answer", title: demo.faq, text: demo.answer }] },
  ];
  return { ...form, id: "template-preview-form", name: demo.headline, headline: demo.headline, description: demo.description,
    slogan: demo.slogan, banner: media[0], bannerImages: media, bannerMode: "carousel", logo: "/images/business-logo-placeholder.png",
    questions, blocks, contentOrder: ["questions", ...blocks.map((block) => block.id)],
    finalTitle: copy.thankYou, finalDescription: demo.description, actionsEnabled: true,
    actions: [
      { id: "demo-website", type: "website", text: labels.website, url: "", textKey: "website" },
      { id: "demo-app", type: "app", text: labels.app, url: "", textKey: "app" },
      { id: "demo-content", type: "content", text: labels.viewContent, url: "", textKey: "viewContent", contentFormat: "pdf" },
    ],
  };
}
