// Persisted IDs and validation shared by Nest's Node runtime and Next's bundler.
const CATEGORIES = [
 ['food','Food & restaurants','خواردن و چێشتخانە','الطعام والمطاعم',['restaurant','cafe','bakery','catering']],
 ['retail','Shopping & retail','کڕین و فرۆشتن','التسوق والتجزئة',['store']],
 ['beauty','Beauty & personal care','جوانکاری','الجمال والعناية الشخصية',['salon','barber']],
 ['health','Health & wellness','تەندروستی','الصحة والعافية',['clinic','pharmacy','fitness']],
 ['education','Education','پەروەردە','التعليم',['school','tutor']],
 ['technology','Technology','تەکنەلۆژیا','التكنولوجيا',['software','it-services']],
 ['professional','Professional services','خزمەتگوزاریی پیشەیی','الخدمات المهنية',['agency','consulting','legal-services']],
 ['automotive','Automotive','ئۆتۆمبێل','السيارات',['car-dealer','auto-repair']],
 ['real-estate','Real estate','خانووبەرە','العقارات',['real-estate-agency']],
 ['travel','Travel & hospitality','گەشت و میوانداری','السفر والضيافة',['hotel','travel-agency']],
 ['media','Entertainment & media','میدیا و هونەر','الترفيه والإعلام',['creator','photographer','studio']],
 ['home','Home & construction','ماڵ و بیناسازی','المنزل والبناء',['furniture','construction']],
 ['design','Printing & design','چاپ و دیزاین','الطباعة والتصميم',['printing','graphic-design']],
 ['personal','Personal profile','پرۆفایلی کەسی','ملف شخصي',['individual']],
 ['community','Nonprofit & community','کۆمەڵگا و ڕێکخراو','المجتمع والمنظمات غير الربحية',['nonprofit']],
 ['other','Other','هی تر','أخرى',[]],
].map(([id,en,ckb,ar,types])=>({id,labels:{en,ckb,ar},types}));
const TYPES = [
 ['restaurant','Restaurant','چێشتخانە','مطعم','Restaurant'], ['cafe','Cafe','کافێ','مقهى','CafeOrCoffeeShop'],
 ['bakery','Bakery','نانەواخانە','مخبز','Bakery'], ['catering','Catering','ئامادەکردنی خواردن','تموين الطعام','Organization'],
 ['store','Store','فرۆشگا','متجر','Store'], ['salon','Beauty salon','سالۆنی جوانکاری','صالون تجميل','BeautySalon'],
 ['barber','Barber','سەرتاشخانە','حلاق','HairSalon'], ['clinic','Clinic','کلینیک','عيادة','MedicalClinic'],
 ['pharmacy','Pharmacy','دەرمانخانە','صيدلية','Pharmacy'], ['fitness','Fitness center','ناوەندی وەرزش','مركز لياقة','ExerciseGym'],
 ['school','School','قوتابخانە','مدرسة','School'], ['tutor','Tutor','مامۆستای تایبەت','مدرس خصوصي','Organization'],
 ['software','Software','نەرمەکاڵا','برمجيات','Organization'], ['it-services','IT services','خزمەتگوزاریی تەکنەلۆژیا','خدمات تقنية','Organization'],
 ['agency','Agency','ئاژانس','وكالة','Organization'], ['consulting','Consulting','ڕاوێژکاری','استشارات','Organization'],
 ['legal-services','Legal services','خزمەتگوزاریی یاسایی','خدمات قانونية','LegalService'],
 ['car-dealer','Car dealership','فرۆشتنی ئۆتۆمبێل','معرض سيارات','AutoDealer'], ['auto-repair','Auto repair','چاککردنەوەی ئۆتۆمبێل','إصلاح سيارات','AutoRepair'],
 ['real-estate-agency','Real estate agency','ئاژانسی خانووبەرە','وكالة عقارات','RealEstateAgent'],
 ['hotel','Hotel','هۆتێل','فندق','Hotel'], ['travel-agency','Travel agency','ئاژانسی گەشت','وكالة سفر','TravelAgency'],
 ['creator','Creator','بەرهەمهێنەری ناوەڕۆک','صانع محتوى','Person'], ['photographer','Photographer','وێنەگر','مصور','Person'],
 ['studio','Studio','ستودیۆ','استوديو','Organization'], ['furniture','Furniture store','فرۆشگای کەلوپەلی ماڵ','متجر أثاث','FurnitureStore'],
 ['construction','Construction','بیناسازی','بناء','Organization'], ['printing','Printing shop','چاپخانە','مطبعة','Organization'],
 ['graphic-design','Graphic design','دیزاینی گرافیک','تصميم جرافيك','Organization'], ['individual','Individual','تاک','فرد','Person'],
 ['nonprofit','Nonprofit organization','ڕێکخراوی قازانج نەویست','منظمة غير ربحية','Organization'],
].map(([id,en,ckb,ar,schema])=>({id,labels:{en,ckb,ar},schema}));
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
const isUploadedImage = value => typeof value==='string' && /^\/images\/upload\/[A-Za-z0-9._\-/]+$/.test(value) && !/(^|\/)\.\.(\/|$)/.test(value);
function inspectLinktreeSeo(raw, allowDraftImages = false) {
 const errors = {}, value = {version:1};
 // Legacy unversioned overrides were retired. Do not resurrect them on deployment.
 if (!isObject(raw) || raw.version !== 1) return {value:undefined,errors};
 const text = (object,key,max,path=key) => {
   if (object[key]===undefined || object[key]===null || object[key]==='') return undefined;
   if (typeof object[key]!=='string' || Array.from(object[key]).length>max) {errors[path]='invalid'; return undefined;}
   return object[key].replace(/[\p{Cc}\s]+/gu,' ').trim() || undefined;
 };
 for (const [key,max] of [['title',150],['description',300],['customCategory',80]]) {
   const field=text(raw,key,max); if(field) value[key]=field;
 }
 const category=CATEGORIES.find(item=>item.id===raw.category);
 if(raw.category!==undefined && raw.category!==null && raw.category!=='' && !category) errors.category='invalid';
 if(category) value.category=category.id;
 if(raw.businessType!==undefined && raw.businessType!==null && raw.businessType!=='') {
   if(!category || !category.types.includes(raw.businessType)) errors.businessType='invalid';
   else value.businessType=raw.businessType;
 }
 if(value.category!=='other') delete value.customCategory;
 for (const [key,allowed] of [['language',['auto','en','ckb','ar']],['indexing',['auto','noindex']]]) {
   if(raw[key]!==undefined && !allowed.includes(raw[key])) errors[key]='invalid';
   else if(raw[key]!==undefined) value[key]=raw[key];
 }
 if(raw.socialImage!==undefined && raw.socialImage!==null && raw.socialImage!=='') {
   if(isUploadedImage(raw.socialImage) || (allowDraftImages && typeof raw.socialImage==='string' && raw.socialImage.length<=14000000 && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(raw.socialImage))) value.socialImage=raw.socialImage;
   else errors.socialImage='invalid';
 }
 if(raw.business!==undefined) {
   if(!isObject(raw.business)) errors.business='invalid';
   else {
     const business={};
     for(const [key,max] of [['street',200],['city',100],['country',100],['serviceArea',200],['cuisine',120],['services',300]]) {
       const field=text(raw.business,key,max,`business.${key}`); if(field) business[key]=field;
     }
     if(raw.business.hours!==undefined) {
       const hours=raw.business.hours;
       if(!isObject(hours) || !Array.isArray(hours.days) || !hours.days.length || hours.days.some(day=>!DAYS.includes(day)) || typeof hours.opens!=='string' || typeof hours.closes!=='string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.closes)) errors['business.hours']='invalid';
       else business.hours={days:[...new Set(hours.days)], opens:hours.opens,closes:hours.closes};
     }
     if(Object.keys(business).length) value.business=business;
   }
 }
 return {value,errors};
}
function readLinktreeSeo(raw, allowDraftImages=false) { return inspectLinktreeSeo(raw,allowDraftImages).value; }
function categoryLabel(seo,language) {
 const type=TYPES.find(item=>item.id===seo?.businessType), category=CATEGORIES.find(item=>item.id===seo?.category);
 return type?.labels[language] || (category?.id==='other' ? seo.customCategory : category?.labels[language]) || '';
}
exports.LINKTREE_CATEGORIES=CATEGORIES;
exports.LINKTREE_BUSINESS_TYPES=TYPES;
exports.LINKTREE_WEEKDAYS=DAYS;
exports.inspectLinktreeSeo=inspectLinktreeSeo;
exports.readLinktreeSeo=readLinktreeSeo;
exports.linktreeCategoryLabel=categoryLabel;

// A downgrade keeps an explicit search exclusion but disables paid customizations.
function readPlanLinktreeSeo(raw, advancedAllowed, allowDraftImages=false) {
 const seo=readLinktreeSeo(raw,allowDraftImages);
 return advancedAllowed ? seo : seo?.indexing==='noindex' ? {version:1,indexing:'noindex'} : undefined;
}
exports.readPlanLinktreeSeo=readPlanLinktreeSeo;
