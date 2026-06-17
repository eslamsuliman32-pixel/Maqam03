/*
  @file meter-definitions.ts
  @description تعريفات بحور الخليل الستة عشر مع الأنماط النبرية
  والأوزان العروضية الصحيحة للشعر العربي الفصيح والمعاصر
*/

export type MeterName =
  | "taweel"       // الطويل
  | "bassit"       // البسيط
  | "wafir"        // الوافر
  | "kamil"        // الكامل
  | "hazaj"        // الهزج
  | "rajaz"        // الرجز
  | "ramal"        // الرمل
  | "saria"        // السريع
  | "munsarih"     // المنسرح
  | "khafif"       // الخفيف
  | "mudaria"      // المضارع
  | "muqtadhab"    // المقتضب
  | "mujtath"      // المجتث
  | "mutaqarib"    // المتقارب
  | "mutadarak"    // المتدارك
  | "khabab"       // الخبب (معاصر)
  | "free";        // حر / تفعيلة

export interface MeterDefinition {
  name: MeterName;
  arabicName: string;
  tafa3il: string;       // التفاعيل الأصلية
  pattern: string;       // نمط (S/L) مبسّط للتحقق
  stressPattern: string; // نمط النبر (0/1) للراب
  description: string;
  rapCompatibility: "high" | "medium" | "low";
  beatsPerBar: number;   // عدد النبرات المتوقعة في البار
}

export const METERDEFINITIONS: Record<MeterName, MeterDefinition> = {
  taweel: {
    name: "taweel",
    arabicName: "الطويل",
    tafa3il: "فَعولُن مَفاعيلُن فَعولُن مَفاعلُن",
    pattern: "SLLS-SLLL-SLLS-SLLL",
    stressPattern: "1010011001001100",
    description: "أطول البحور وأكثرها شيوعاً في الشعر العربي الكلاسيكي",
    rapCompatibility: "medium",
    beatsPerBar: 8,
  },
  bassit: {
    name: "bassit",
    arabicName: "البسيط",
    tafa3il: "مُستَفعِلُن فَاعِلُن مُستَفعِلُن فَاعِلُن",
    pattern: "LSLS-LSS-LSLS-LSS",
    stressPattern: "1010100101010100",
    description: "بحر ثنائي التفعيلة، قوي وجزل، مناسب للهجاء والفخر",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  wafir: {
    name: "wafir",
    arabicName: "الوافر",
    tafa3il: "مُفاعَلَتُن مُفاعَلَتُن فَعولُن",
    pattern: "SLSLS-SLSLS-SLL",
    stressPattern: "101010101001",
    description: "يتميز بالتوالي السريع، مناسب للتسارع الإيقاعي",
    rapCompatibility: "high",
    beatsPerBar: 6,
  },
  kamil: {
    name: "kamil",
    arabicName: "الكامل",
    tafa3il: "مُتَفاعِلُن مُتَفاعِلُن مُتَفاعِلُن",
    pattern: "SSLSL-SSLSL-SSLSL",
    stressPattern: "001010010100101",
    description: "الأكثر استخداماً في الراب العربي لتوافقه مع البيت الموسيقي",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  hazaj: {
    name: "hazaj",
    arabicName: "الهزج",
    tafa3il: "مَفاعيلُن مَفاعيلُن",
    pattern: "SLLL-SLLL",
    stressPattern: "10011001",
    description: "خفيف طروب، يُستخدم في الموشحات والأغاني",
    rapCompatibility: "medium",
    beatsPerBar: 4,
  },
  rajaz: {
    name: "rajaz",
    arabicName: "الرجز",
    tafa3il: "مُستَفعِلُن مُستَفعِلُن مُستَفعِلُن",
    pattern: "LSLS-LSLS-LSLS",
    stressPattern: "101010101010",
    description: "بحر الارتجال والحداء، الأقرب للكلام المنظوم — مثالي للراب",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  ramal: {
    name: "ramal",
    arabicName: "الرمل",
    tafa3il: "فاعِلاتُن فاعِلاتُن فاعِلاتُن",
    pattern: "LSS-LSS-LSS",
    stressPattern: "100100100",
    description: "إيقاع ثلاثي منتظم، مناسب للمقاطع الهادئة",
    rapCompatibility: "medium",
    beatsPerBar: 6,
  },
  saria: {
    name: "saria",
    arabicName: "السريع",
    tafa3il: "مُستَفعِلُن مُستَفعِلُن مَفعولاتُ",
    pattern: "LSLS-LSLS-LLSS",
    stressPattern: "101010101100",
    description: "نهايته المختلفة تعطي حس الصدمة الإيقاعية",
    rapCompatibility: "medium",
    beatsPerBar: 6,
  },
  munsarih: {
    name: "munsarih",
    arabicName: "المنسرح",
    tafa3il: "مُستَفعِلُن مَفعولاتُ مُستَفعِلُن",
    pattern: "LSLS-LLSS-LSLS",
    stressPattern: "101011001010",
    description: "إيقاع منساب مع لمسة غير متوقعة في المنتصف",
    rapCompatibility: "medium",
    beatsPerBar: 6,
  },
  khafif: {
    name: "khafif",
    arabicName: "الخفيف",
    tafa3il: "فاعِلاتُن مُستَفعِلُن فاعِلاتُن",
    pattern: "LSS-LSLS-LSS",
    stressPattern: "100101010100",
    description: "توليفة بين الثقيل والخفيف، مرن جداً",
    rapCompatibility: "high",
    beatsPerBar: 6,
  },
  mudaria: {
    name: "mudaria",
    arabicName: "المضارع",
    tafa3il: "مَفاعيلُن فاعِلاتُن",
    pattern: "SLLL-LSS",
    stressPattern: "10011000",
    description: "قصير ومكثف، للمقاطع السريعة",
    rapCompatibility: "medium",
    beatsPerBar: 4,
  },
  muqtadhab: {
    name: "muqtadhab",
    arabicName: "المقتضب",
    tafa3il: "مَفعولاتُ مُستَفعِلُن",
    pattern: "LLSS-LSLS",
    stressPattern: "11001010",
    description: "نادر الاستخدام، مناسب للتجريب الإيقاعي",
    rapCompatibility: "low",
    beatsPerBar: 4,
  },
  mujtath: {
    name: "mujtath",
    arabicName: "المجتث",
    tafa3il: "مُستَفعِلُن فاعِلاتُن",
    pattern: "LSLS-LSS",
    stressPattern: "10101000",
    description: "مختصر الخفيف، سريع التلقي",
    rapCompatibility: "medium",
    beatsPerBar: 4,
  },
  mutaqarib: {
    name: "mutaqarib",
    arabicName: "المتقارب",
    tafa3il: "فَعولُن فَعولُن فَعولُن فَعولُن",
    pattern: "SLL-SLL-SLL-SLL",
    stressPattern: "011011011011",
    description: "إيقاع ثلاثي متقارب، مشابه لإيقاع البوب والراب التجاري",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  mutadarak: {
    name: "mutadarak",
    arabicName: "المتدارك",
    tafa3il: "فاعِلُن فاعِلُن فاعِلُن فاعِلُن",
    pattern: "LSS-LSS-LSS-LSS",
    stressPattern: "100100100100",
    description: "إيقاع راقص منتظم، الأقرب لبيت 4/4 الموسيقي",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  khabab: {
    name: "khabab",
    arabicName: "الخبب",
    tafa3il: "فَعِلُن فَعِلُن فَعِلُن فَعِلُن",
    pattern: "SS-SS-SS-SS",
    stressPattern: "101010101010",
    description: "بحر معاصر سريع، الأكثر توافقاً مع الراب الحديث",
    rapCompatibility: "high",
    beatsPerBar: 8,
  },
  free: {
    name: "free",
    arabicName: "حر / تفعيلة",
    tafa3il: "متحرر",
    pattern: "",
    stressPattern: "",
    description: "شعر التفعيلة الحر، لا يلتزم بتكرار تفعيلة ثابتة",
    rapCompatibility: "high",
    beatsPerBar: 0,
  },
};

/**
  أنواع القوافي ومصطلحاتها العروضية الكاملة
 */
export type RhymeType =
  | "perfectRhyme"       // القافية التامة
  | "slantRhyme"         // القافية المائلة / الناقصة
  | "richRhyme"          // القافية الغنية (تطابق ما قبل الحرف الروي)
  | "internalRhyme"      // القافية الداخلية
  | "multisyllabicRhyme" // القافية متعددة المقاطع
  | "assonance"          // الجناس الصوتي (توافق الصوائت)
  | "consonance"         // التوافق الصامتي
  | "eyeRhyme"           // القافية البصرية (تتشابه كتابةً لا نطقاً)
  | "compound"           // القافية المركبة
  | "mosaicRhyme";       // القافية الفسيفسائية (كلمتان تُقافيان كلمةً)

export const RHYMETYPEDEFINITIONS: Record<RhymeType, {
  arabicName: string;
  description: string;
  example: string;
  scoreWeight: number; // وزن درجة الجودة
}> = {
  perfectRhyme: {
    arabicName: "القافية التامة",
    description: "تطابق كامل من آخر حرف متحرك حتى نهاية الكلمة",
    example: "قلوب / غروب / دروب",
    scoreWeight: 1.0,
  },
  slantRhyme: {
    arabicName: "القافية المائلة",
    description: "تشابه جزئي في الصوت دون تطابق كامل",
    example: "نار / نهار / أسرار",
    scoreWeight: 0.65,
  },
  richRhyme: {
    arabicName: "القافية الغنية",
    description: "تطابق يمتد لما قبل الحرف الروي بمقطع أو أكثر",
    example: "الليل / الخيل / السبيل",
    scoreWeight: 0.95,
  },
  internalRhyme: {
    arabicName: "القافية الداخلية",
    description: "القافية تقع في منتصف السطر وليس فقط في نهايته",
    example: "في الليل / أسمع صوت / الخيل",
    scoreWeight: 0.85,
  },
  multisyllabicRhyme: {
    arabicName: "القافية متعددة المقاطع",
    description: "تطابق مقطعين أو أكثر في نهاية الكلمة",
    example: "مستحيل / إسرائيل (مقطعان)",
    scoreWeight: 1.1, // مكافأة للصعوبة
  },
  assonance: {
    arabicName: "الجناس الصوتي",
    description: "توافق الحركات الطويلة (الصوائت) دون الصوامت",
    example: "نور / صوب / لون",
    scoreWeight: 0.5,
  },
  consonance: {
    arabicName: "التوافق الصامتي",
    description: "تكرار الحروف الصامتة مع اختلاف الصوائت",
    example: "قلب / كتب / حرب",
    scoreWeight: 0.55,
  },
  eyeRhyme: {
    arabicName: "القافية البصرية",
    description: "تتشابه الكلمتان خطياً لكنهما تختلفان نطقاً",
    example: "الله / علامة",
    scoreWeight: 0.3,
  },
  compound: {
    arabicName: "القافية المركبة",
    description: "كلمة واحدة تُقافي تركيباً من كلمتين",
    example: "أنا / أن + ما",
    scoreWeight: 0.9,
  },
  mosaicRhyme: {
    arabicName: "القافية الفسيفسائية",
    description: "كلمتان في النهاية تُقافيان معاً كلمةً واحدة",
    example: "في الذهب / الحب",
    scoreWeight: 0.85,
  },
};

/**
  مصطلحات العروض الأساسية
 */
export const PROSODYGLOSSARY = {
  // أجزاء القصيدة
  bayt: "البيت — وحدة الشعر، شطران: صدر وعجز",
  sadr: "الصدر — الشطر الأول من البيت",
  ajuz: "العجز — الشطر الثاني من البيت",
  qafia: "القافية — آخر ما يتكرر من الأصوات في نهاية كل بيت",
  rawiy: "الروي — الحرف الأخير الثابت في القافية",
  wasl: "الوصل — حرف اللين الذي يلي الروي",
  khuruuj: "الخروج — حركة الوصل",
  ridif: "الرديف — حرف اللين الذي يسبق الروي مباشرةً",
  tasis: "التأسيس — الألف الساكنة قبل الروي بحرف واحد متحرك",

  // التفاعيل
  taf3ila: "التفعيلة — وحدة الوزن العروضية القياسية",
  watad: "الوتد — مجموعة من حرفين متحركين + ساكن",
  sabab: "السبب — مجموعة حرف متحرك + ساكن",
  fasila: "الفاصلة — ثلاثة متحركات + ساكن",

  // الزحافات والعلل
  zihaf: "الزحاف — تغيير جائز في حشو التفعيلة",
  illa: "العلة — تغيير لازم في عروض أو ضرب التفعيلة",
  khabn: "الخبن — حذف الثاني الساكن",
  tafl: "الطفل — حذف الرابع الساكن في مستفعلن",
  qabdh: "القبض — حذف الخامس الساكن",
  iqaa: "الإيقاع — النبض الإيقاعي المنتظم في البار",
};
