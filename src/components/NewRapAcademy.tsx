import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { geminiService } from "../services/geminiService";
import {
  Search,
  Sparkles,
  BookOpen,
  Cpu,
  Star,
  Trash2,
  Loader2,
  ChevronDown,
  Lightbulb,
  Activity,
  Edit3,
  Send,
  CheckCircle2,
  RefreshCw,
  Zap,
  X,
  Copy,
  Download,
  PlusSquare,
  Layout,
  FileText,
  MoreVertical,
  ClipboardList,
  Target,
  Flame,
  Info,
  List,
  AudioWaveform,
  Database,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRepositoryStore, Bar } from "../store/repositoryStore";

import MaqamEngine from "../MaqamEngine";

const CHS = [
  {
    id: "grammar",
    n: "١",
    title: "القواعد",
    sub: "Grammar",
    c: "#818cf8",
    d: "rgba(99,102,241,.12)",
    b: "rgba(99,102,241,.25)",
    icon: "⚙",
    techs: [
      {
        id: "g01",
        name: "مجموعات الساكنات",
        en: "Consonant Clusters",
        diff: "متوسط",
        desc: "تجميع الحروف الساكنة لخلق كثافة صوتية وإيقاع مضغوط.",
        ex: "قلبي / شعبي / صبري / حكمي",
        tip: "استخدمها في ذروة الكوبليه",
        tags: ["صوتيات", "إيقاع"],
      },
      {
        id: "g02",
        name: "الحركات المرخية والمشددة",
        en: "Lax & Tense Vowels",
        diff: "متوسط",
        desc: "الحركات القصيرة تسرّع التدفق — الطويلة تُبطئه وتمنحه ثقلاً.",
        ex: "كَتَب (سريع) ← كَاتِب ← كِتَاب (أعمق)",
        tip: "الحركات الطويلة في النهاية تعطي الحسم",
        tags: ["صوتيات", "وتيرة"],
      },
      {
        id: "g03",
        name: "أصوات الحروف الساكنة",
        en: "Consonant Sounds",
        diff: "مبتدئ",
        desc: "الحروف المجهورة تعطي قوة — المهموسة تعطي رهبة.",
        ex: "مجهورة: ب ج د ز م ن ل\nمهموسة: ت ك س ص ح ف",
        tip: "امزج الفئتين للتحكم في طاقة البار",
        tags: ["صوتيات", "جهر"],
      },
      {
        id: "g04",
        name: "اللواحق والسوابق",
        en: "Prefixes & Suffixes",
        diff: "مبتدئ",
        desc: "مقاطع تُضاف لتعديل المعنى وتنظيم الإيقاع.",
        ex: "يَكتُب / كَتَبَها / كَتَبُوا",
        tags: ["قواعد", "جذر"],
      },
      {
        id: "g05",
        name: "الضمائر",
        en: "Pronouns",
        diff: "مبتدئ",
        desc: "اختيار الضمير يحدد المسافة العاطفية.",
        ex: "أنا (داخلي) / أنت (مواجهة) / هو (سرد)",
        tip: "تحويل الضمير في المنتصف — صدمة شعرية",
        tags: ["ضمير", "سرد"],
      },
      {
        id: "g06",
        name: "الأفعال",
        en: "Verbs",
        diff: "مبتدئ",
        desc: "الأفعال محرك الطاقة — زمنها يتحكم في الدراما.",
        ex: "مشيت (ماضي/حسم) / أمشي (حاضر) / سأمشي (توتر)",
        tags: ["فعل", "زمن"],
      },
      {
        id: "g07",
        name: "الصفات والظروف",
        en: "Adjectives & Adverbs",
        diff: "مبتدئ",
        desc: "طبقات اللون التي تُعمّق الصورة الشعرية.",
        ex: "قلب بارد (صفة) / يمشي ببطء (ظرف)",
        tags: ["وصف", "تعديل"],
      },
      {
        id: "g08",
        name: "كلمات الوظيفة",
        en: "Function Words",
        diff: "مبتدئ",
        desc: "أدوات الربط التي تُنظّم التدفق دون استهلاك النبر.",
        ex: "في / على / مع / لكن / حتى / رغم",
        tags: ["ربط", "حروف"],
      },
      {
        id: "g09",
        name: "مجموعات الأسماء",
        en: "Noun Groups",
        diff: "متوسط",
        desc: "تجميع الأسماء لبناء صور شعرية كثيفة.",
        ex: "الليل والصمت والوحدة / الجوع والخوف والأمل",
        tip: "الثلاثيات أقوى من الثنائيات",
        tags: ["اسم", "تجميع"],
      },
      {
        id: "g10",
        name: "الحركات المتأثرة بـ L و R",
        en: "L & R Influenced Vowels",
        diff: "متقدم",
        desc: "حروف اللام والراء تغيّر جودة الحركة المجاورة صوتياً.",
        ex: "وَاللَّه / أَرْض / الرَّجُل",
        tags: ["صوتيات", "لام"],
      },
    ],
  },
  {
    id: "sounds",
    n: "٢",
    title: "روابط الكلمات",
    sub: "Word Connections",
    c: "#f472b6",
    d: "rgba(236,72,153,.12)",
    b: "rgba(236,72,153,.25)",
    icon: "◈",
    techs: [
      {
        id: "s01",
        name: "روابط الساكن + الحركة",
        en: "Consonant + Vowel Links",
        diff: "متوسط",
        desc: "ربط نهاية كلمة ببداية التالية لتدفق سائل.",
        ex: "أنا-الملك / فوق-السحاب / جاء-الليل",
        tip: "أساس الـ flow السلس",
        tags: ["تدفق", "ربط"],
      },
      {
        id: "s02",
        name: "شخصيات الحروف الساكنة",
        en: "Consonant Personalities",
        diff: "متقدم",
        desc: "لكل حرف شخصية صوتية — توظيفها يمنح البار طابعه.",
        ex: "غنائي: م ن ل و\nعدواني: ق ك ط ض\nهسهسة: س ش ص",
        tip: "صنّف حروف بارك وانظر أي شخصية تغلب",
        tags: ["شخصية", "مزاج"],
      },
      {
        id: "s03",
        name: "أماكن النطق في الفم",
        en: "Mouth Positions",
        diff: "متقدم",
        desc: "حروف من نفس الموضع تخلق إيقاعاً ملموساً.",
        ex: "شفوية: ب م و\nأسنانية: ت د ن\nحلقية: ح خ ع غ",
        tip: "استخدم نفس الموضع في نهايات أشطر متتالية",
        tags: ["نطق", "موضع"],
      },
    ],
  },
  {
    id: "poetry",
    n: "٣",
    title: "الشعر",
    sub: "Poetry Devices",
    c: "#fbbf24",
    d: "rgba(245,158,11,.12)",
    b: "rgba(245,158,11,.25)",
    icon: "✦",
    techs: [
      {
        id: "p01",
        name: "التكرار",
        en: "Repetition",
        diff: "مبتدئ",
        desc: "تكرار كلمة أو عبارة لتعزيز التأثير العاطفي.",
        ex: "ما في أحد / ما في أحد / ما في أحد",
        tip: "الثلاثي أقوى من المزدوج",
        tags: ["تكرار", "عاطفة"],
      },
      {
        id: "p02",
        name: "الجناس",
        en: "Alliteration",
        diff: "مبتدئ",
        desc: "تكرار نفس الحرف في بداية كلمات متتالية.",
        ex: "سكت الصمت السميك\nمن مكاني مشيت ملثماً",
        tip: "٣ كلمات يكفي — أكثر يُثقّل",
        tags: ["جناس", "موسيقى"],
      },
      {
        id: "p03",
        name: "التناقض",
        en: "Antithesis",
        diff: "مبتدئ",
        desc: "مقابلة فكرتين متضادتين لتعميق المعنى.",
        ex: "أنا الفرح والألم / أنا الليل والنهار",
        tags: ["تضاد", "فلسفة"],
      },
      {
        id: "p04",
        name: "التكرار البدائي",
        en: "Anaphora",
        diff: "مبتدئ",
        desc: "بداية عدة أشطر بنفس الكلمة — يبني زخماً تصاعدياً.",
        ex: "لأجلك صبرت\nلأجلك تعبت\nلأجلك تغيرت",
        tip: "في الكورس = لازمة تُحفظ",
        tags: ["تصاعد", "زخم"],
      },
      {
        id: "p05",
        name: "التكرار النهائي",
        en: "Anadiplosis",
        diff: "متوسط",
        desc: "بداية الجملة بنفس الكلمة التي انتهت بها السابقة.",
        ex: "الليل طويل / طويل هو الحنين / الحنين قاتل",
        tags: ["تسلسل", "سلسلة"],
      },
      {
        id: "p06",
        name: "الاستمرار",
        en: "Enjambment",
        diff: "متوسط",
        desc: "امتداد الجملة من شطر إلى آخر — يخلق توتراً.",
        ex: "شفت الدنيا وأنا صغير\nوعرفت أن ما فيها خير",
        tip: "الوقف المتأخر يُفاجئ المستمع",
        tags: ["استمرار", "توتر"],
      },
      {
        id: "p07",
        name: "التناقض اللفظي",
        en: "Oxymoron",
        diff: "متوسط",
        desc: "تجميع كلمتين متضادتين للتعبير عن تناقض داخلي.",
        ex: "صمت صاخب / وحدة مزدحمة / موت حي",
        tip: "يُعبّر عن الحالات النفسية المركّبة",
        tags: ["تناقض", "نفس"],
      },
      {
        id: "p08",
        name: "العكس المزدوج",
        en: "Antimetabole",
        diff: "متقدم",
        desc: "عكس ترتيب الكلمات في جملتين — يصنع مقولة تُحفظ.",
        ex: "أعيش للحلم / الحلم يعيش فيّ",
        tip: "يصنع مقولات تُشارَك",
        tags: ["عكس", "توازن"],
      },
      {
        id: "p09",
        name: "الانقلاب",
        en: "Anastrophe",
        diff: "متوسط",
        desc: "عكس الترتيب الطبيعي للكلمات — تأكيد شعري.",
        ex: "ذهب الليل → الليل، ذهب",
        tags: ["عكس", "ترتيب"],
      },
      {
        id: "p10",
        name: "التكرار الوصلي",
        en: "Polysyndeton",
        diff: "مبتدئ",
        desc: "تكرار (و) لخلق إحساس بالتراكم اللانهائي.",
        ex: "والليل والبرد والوحدة والخوف...",
        tip: "للتعبير عن الإرهاق والامتلاء",
        tags: ["عطف", "تراكم"],
      },
      {
        id: "p11",
        name: "تقليد الأصوات",
        en: "Onomatopoeia",
        diff: "مبتدئ",
        desc: "كلمات يُعبّر شكلها الصوتي عن المعنى مباشرة.",
        ex: "طرطرة / هدير / أزيز / طقطقة",
        tip: "أقوى تأثيراً عند الأداء الحي",
        tags: ["صوت", "مشهد"],
      },
      {
        id: "p12",
        name: "الكلمات المتجانسة",
        en: "Homophones",
        diff: "متقدم",
        desc: "كلمات تبدو متشابهة لكن معانٍ مختلفة.",
        ex: "عين: بصر / ماء / جاسوس",
        tip: "المستمع يسمع المعنيين معاً",
        tags: ["ازدواج", "معنى"],
      },
      {
        id: "p13",
        name: "الاستبدال النحوي",
        en: "Anthimeria",
        diff: "متقدم",
        desc: "استخدام كلمة من فئة نحوية في موضع فئة أخرى.",
        ex: "سأحلم هذا الليل (حلم: اسم → فعل)",
        tags: ["نحو", "إبداع"],
      },
      {
        id: "p14",
        name: "التكرار الجذري",
        en: "Polyptoton",
        diff: "متقدم",
        desc: "تكرار نفس الجذر بأشكال نحوية مختلفة.",
        ex: "كتبت كتابي لكاتب آخر",
        tags: ["جذر", "ثراء"],
      },
      {
        id: "p15",
        name: "اللعب على الكلمات",
        en: "Pun",
        diff: "متقدم",
        desc: "توظيف الكلمة بمعنيين في آنٍ واحد.",
        ex: "قلبي نار — النار تهدم ولا تبني",
        tags: ["ذكاء", "معنى"],
      },
      {
        id: "p16",
        name: "الأقدام الإيقاعية",
        en: "Poetic Feet",
        diff: "متقدم",
        desc: "وحدات الإيقاع الأساسية — نمط النبر على مستوى الكلمة.",
        ex: "da-DUM (iamb)\nda-da-DUM (anapest)",
        tip: "معظم الراب العربي على الـ anapest",
        tags: ["وزن", "قدم"],
      },
      {
        id: "p17",
        name: "الاستعارة الممتدة",
        en: "Extended Metaphor",
        diff: "متوسط",
        desc: "استعارة واحدة تمتد عبر كامل المقطع.",
        ex: "الشارع أمي → تعلّمني، أطعمتني، أوجعتني",
        tip: "يُميّز الـ storytellers",
        tags: ["استعارة", "قصة"],
      },
      {
        id: "p18",
        name: "التصاعد الدرامي",
        en: "Climax",
        diff: "متوسط",
        desc: "تصاعد الفكرة من الأضعف إلى الأقوى.",
        ex: "تعبت — يأست — انكسرت — مُت",
        tags: ["تصاعد", "دراما"],
      },
      {
        id: "p19",
        name: "المفارقة",
        en: "Paradox",
        diff: "متوسط",
        desc: "جملة تبدو متناقضة لكن تحمل حقيقة عميقة.",
        ex: "أنا أقوى حين أضعف",
        tags: ["فلسفة", "عمق"],
      },
      {
        id: "p20",
        name: "قصيدة الصدى",
        en: "Echo Verse",
        diff: "متقدم",
        desc: "تردد صدى المعنى في نهاية كل شطر.",
        ex: "صرخت في الفراغ — اغ\nبكيت وحيد — يد",
        tags: ["صدى", "نهاية"],
      },
      {
        id: "p21",
        name: "القصيدة الأبجدية",
        en: "Acrostic",
        diff: "متقدم",
        desc: "كل شطر يبدأ بحرف متتالٍ من الأبجدية.",
        ex: "أ: أنا من الأعماق\nب: بعيد عن الرفاق",
        tags: ["أبجدية", "تحدي"],
      },
      {
        id: "p22",
        name: "الرياضي",
        en: "Rhopalic",
        diff: "متقدم",
        desc: "كل كلمة أطول من التي قبلها — تصاعد حسابي.",
        ex: "أنا رأيت الحياة صعوبتها",
        tags: ["بناء", "رياضيات"],
      },
      {
        id: "p23",
        name: "التكرار الوصفي",
        en: "Epistrophe",
        diff: "متوسط",
        desc: "انتهاء عدة أشطر بنفس الكلمة.",
        ex: "كل هذا الألم\nكل هذا الأمل\nكل هذا الجمال",
        tags: ["تكرار", "نهاية"],
      },
      {
        id: "p24",
        name: "الشعر الكلي القافي",
        en: "Holorhyming",
        diff: "متقدم",
        desc: "كل كلمة تقافي مقابلتها في الشطر الآخر.",
        ex: "أ-ب-ج ↔ أ'-ب'-ج'",
        tags: ["قافية", "تطابق"],
      },
      {
        id: "p25",
        name: "الجناس الناقص",
        en: "Paronomasia",
        diff: "متقدم",
        desc: "تشابه صوتي بين كلمتين مع اختلاف المعنى.",
        ex: "ساد / سار / سار — أصوات متقاربة",
        tags: ["جناس", "صوت"],
      },
    ],
  },
  {
    id: "lyrics",
    n: "٤",
    title: "كتابة الكلمات",
    sub: "Lyric Writing",
    c: "#34d399",
    d: "rgba(16,185,129,.12)",
    b: "rgba(16,185,129,.25)",
    icon: "◎",
    techs: [
      {
        id: "l01",
        name: "كتابة الأجسام",
        en: "Object Writing",
        diff: "مبتدئ",
        desc: "وصف الأجسام عبر الحواس السبع لخلق صور حية.",
        ex: "بصر / سمع / شم / تذوق / لمس / حركة / إحساس عضوي",
        tip: "دوّن ١٠ دقائق يومياً على جسم عشوائي",
        tags: ["حواس", "وصف"],
      },
      {
        id: "l02",
        name: "الاستعارات",
        en: "Metaphors",
        diff: "مبتدئ",
        desc: "مشابهة شيء بآخر دون أداة — تحويل المجرد إلى محسوس.",
        ex: "الشارع غابة / الليل سجن / كلامي سكاكين",
        tip: "الأقوى تُشعل حاسّتين معاً",
        tags: ["صورة", "مجاز"],
      },
      {
        id: "l03",
        name: "أسئلة الاستعارة",
        en: "Questions for Metaphors",
        diff: "مبتدئ",
        desc: "اسأل: ما لونه / ما طعمه / ما صوته.",
        ex: "ما لون الخوف؟\nما طعم الأمل؟\nما صوت الوحدة؟",
        tags: ["سؤال", "تعمق"],
      },
      {
        id: "l04",
        name: "صفات + أسماء",
        en: "Adjectives + Nouns",
        diff: "مبتدئ",
        desc: "جمع كلمات من فئتين لصور مركّبة.",
        ex: "ليل ثقيل / صمت أبيض / حلم مكسور",
        tags: ["تركيب", "صورة"],
      },
      {
        id: "l05",
        name: "أسماء + أفعال مفاجئة",
        en: "Unexpected Verbs",
        diff: "متوسط",
        desc: "فعل غير متوقع لاسم — حركة في الصورة الجامدة.",
        ex: "الليل ينهار / الصمت يصرخ / الأمل ينزف",
        tip: "كلما كان الفعل أقل توقعاً — الصورة أقوى",
        tags: ["فعل", "مفاجأة"],
      },
      {
        id: "l06",
        name: "الأجسام التعبيرية",
        en: "Objective Correlatives",
        diff: "متقدم",
        desc: "ربط المشاعر بأجسام ملموسة — نقل العاطفة دون تصريح.",
        ex: "الكأس الفارغة = الوحدة\nالمطر = الحزن\nالغبار = النسيان",
        tip: "أسلوب T.S. Eliot — أثبت أداءه في الراب",
        tags: ["عاطفة", "ضمني"],
      },
      {
        id: "l07",
        name: "مواقع القوة",
        en: "Power Positions",
        diff: "متوسط",
        desc: "أول الشطر وآخره — ضع الأهم هناك.",
        ex: "[كلمة قوية] ............... [كلمة قوية]",
        tip: "الدماغ يحفظ البداية والنهاية",
        tags: ["موقع", "حفظ"],
      },
      {
        id: "l08",
        name: "عائلات القافية",
        en: "Rhyme Families",
        diff: "متوسط",
        desc: "مجموعات صوتية متشابهة — مخزون يُبنى منه شبكة قوافٍ.",
        ex: "قلب/حلب/صعب\nنار/دار/أثار",
        tip: "ابنِ قاموسك الشخصي قبل الكتابة",
        tags: ["قافية", "مخزون"],
      },
      {
        id: "l09",
        name: "قاعدة الكتابة",
        en: "Songwriting Rule",
        diff: "مبتدئ",
        desc: "كل بار يحتاج: فكرة + صورة + عاطفة صادقة.",
        ex: "[الفكرة] + [الصورة] + [العاطفة] = بار يُحفظ",
        tip: "افقد عنصراً واحداً وسيبدو البار ناقصاً",
        tags: ["قاعدة", "اكتمال"],
      },
      {
        id: "l10",
        name: "الأجسام تحدد الصورة",
        en: "Verbs Determine Verses",
        diff: "متوسط",
        desc: "اختر فعلك أولاً — الفعل روح الصورة.",
        ex: "ينزف → يصرخ → يسقط → يقوم",
        tip: "اكتب قائمة أفعال قبل الكتابة",
        tags: ["فعل", "بناء"],
      },
      {
        id: "l11",
        name: "الضمائر تحدد المنظور",
        en: "Pronouns Determine View",
        diff: "متوسط",
        desc: "الضمير يحدد مسافة السرد وعلاقة المستمع.",
        ex: "أنا (شخصي) / أنت (مواجهة) / هو-هم (مسرحي)",
        tags: ["ضمير", "منظور"],
      },
      {
        id: "l12",
        name: "الإجهاد التأكيدي",
        en: "Emphatic Stress",
        diff: "متوسط",
        desc: "تضخيم نبر كلمة لتأكيد معناها فوق السياق.",
        ex: "أنا — أنا اللي قلت الحق\nلَيش — لَيش سكت؟",
        tags: ["نبر", "تأكيد"],
      },
      {
        id: "l13",
        name: "الإجهاد التناقضي",
        en: "Contrastive Stress",
        diff: "متقدم",
        desc: "تغيير موضع النبر — نفس الكلمات، معاني مختلفة.",
        ex: "هو جاء (مش ذهب)\nأنا ما جيت (مش هو)",
        tags: ["نبر", "تناقض"],
      },
      {
        id: "l14",
        name: "المقطع النووي",
        en: "Nuclear Syllable",
        diff: "متقدم",
        desc: "المقطع الأكثر أهمية في الكلمة.",
        ex: "كَ-TA-ب / مَ-دِي-NE-ة",
        tags: ["مقطع", "توافق"],
      },
      {
        id: "l15",
        name: "ثلاث وجهات نظر",
        en: "3 Perspectives",
        diff: "متوسط",
        desc: "اكتب نفس المشهد من ٣ وجهات لاكتشاف الأقوى.",
        ex: "أنا (بطل) / أنت (مُخاطَب) / هم (موضوعي)",
        tip: "الزاوية غير المتوقعة هي الأقوى",
        tags: ["منظور", "اكتشاف"],
      },
      {
        id: "l16",
        name: "تحفيز الحواس",
        en: "Stimulating Senses",
        diff: "متوسط",
        desc: "استثارة حواس متعددة في نفس الشطر.",
        ex: "رأيت الصمت الأبيض\nشممت رائحة الخوف الحار",
        tags: ["حواس", "كثافة"],
      },
      {
        id: "l17",
        name: "الآيات المترابطة",
        en: "Related Verses",
        diff: "متوسط",
        desc: "روابط معنوية وصوتية بين الأشطر.",
        ex: "شطر١ يزرع / شطر٢ يروي / شطر٣ يحصد",
        tags: ["ربط", "نسيج"],
      },
      {
        id: "l18",
        name: "العلاقات الدرامية",
        en: "Dramatic Relationships",
        diff: "متوسط",
        desc: "بناء توتر حقيقي بين شخصيات — طاقة تمسك المستمع.",
        ex: "الضحية ⟷ المنقذ ⟷ الجاني",
        tags: ["دراما", "توتر"],
      },
      {
        id: "l19",
        name: "كلمات المحتوى vs الوظيفة",
        en: "Content vs Function",
        diff: "متقدم",
        desc: "كلمات المحتوى تحمل المعنى — كلمات الوظيفة تنظمه.",
        ex: "محتوى: قلب، يحترق\nوظيفة: في، على، لكن",
        tags: ["محتوى", "توزيع"],
      },
      {
        id: "l20",
        name: "مرونة البروسودي",
        en: "Prosody Flexibility",
        diff: "متقدم",
        desc: "مرونة النبر لتوافق الموسيقى مع الحفاظ على المعنى.",
        ex: "تعديل نبر الكلمة لتناسب البيت دون خسارة المعنى",
        tags: ["prosody", "مرونة"],
      },
    ],
  },
  {
    id: "tone",
    n: "٥",
    title: "النبر والعلة",
    sub: "Tone & Pitch",
    c: "#c084fc",
    d: "rgba(192,132,252,.12)",
    b: "rgba(192,132,252,.25)",
    icon: "♫",
    techs: [
      {
        id: "t01",
        name: "النبر الساقط ↘",
        en: "Falling Tone",
        diff: "مبتدئ",
        desc: "انخفاض الصوت — إحساس الحسم والنهاية القاطعة.",
        ex: "↘ هذا هو الواقع.\n↘ خلاص انتهى.",
        tip: "للإعلان عن حقيقة أو قرار نهائي",
        tags: ["نبر", "حسم"],
      },
      {
        id: "t02",
        name: "النبر الصاعد ↗",
        en: "Rising Tone",
        diff: "مبتدئ",
        desc: "ارتفاع الصوت — التساؤل والتوقع والانفتاح.",
        ex: "↗ هل هذا حقيقي؟\n↗ وبعدين؟",
        tip: "قوي جداً قبل الكورس",
        tags: ["نبر", "تساؤل"],
      },
      {
        id: "t03",
        name: "الصاعد-الساقط ↗↘",
        en: "Rise-Fall",
        diff: "متوسط",
        desc: "ارتفاع ثم انخفاض — التعجب والإنكار والسخرية.",
        ex: "↗↘ ما قلتلك!\n↗↘ هو فعل كذا؟",
        tags: ["نبر", "تعجب"],
      },
      {
        id: "t04",
        name: "الساقط-الصاعد ↘↗",
        en: "Fall-Rise",
        diff: "متوسط",
        desc: "انخفاض ثم ارتفاع — التحفظ والتلميح الضمني.",
        ex: "↘↗ ممكن...\n↘↗ إذا أنت تقول",
        tip: "الأكثر تعبيراً عن الشك",
        tags: ["نبر", "تحفظ"],
      },
      {
        id: "t05",
        name: "المفتاح العالي ⬆",
        en: "High Key",
        diff: "مبتدئ",
        desc: "بدء بصوت عالٍ — التأكيد القوي والمفاجأة.",
        ex: "⬆ يا ناس!\n⬆ كفاية!",
        tags: ["علة", "عالٍ"],
      },
      {
        id: "t06",
        name: "المفتاح المنخفض ⬇",
        en: "Low Key",
        diff: "مبتدئ",
        desc: "بدء بصوت منخفض — الهدوء والانسحاب.",
        ex: "⬇ خلاص...\n⬇ ما عاد مهم.",
        tags: ["علة", "منخفض"],
      },
      {
        id: "t07",
        name: "الوقف المقصود",
        en: "Intentional Pausing",
        diff: "متوسط",
        desc: "الصمت كأداة — الوقف قبل الكلمة القوية يضاعف تأثيرها.",
        ex: "أنا... [توقف] × الحقيقة",
        tip: "أقوى المؤدين يتحكمون في الصمت",
        tags: ["صمت", "توقف"],
      },
      {
        id: "t08",
        name: "الإيقاع الأساسي",
        en: "Rhythm",
        diff: "مبتدئ",
        desc: "النمط المتكرر من النبر — الهوية الإيقاعية.",
        ex: "DUM-da-da / DUM-da / DUM ×٤",
        tip: "إيقاعك هو ما يجعل صوتك لا يُنسى",
        tags: ["إيقاع", "هوية"],
      },
      {
        id: "t09",
        name: "الانتونيشن",
        en: "Intonation",
        diff: "متوسط",
        desc: "التموج الصوتي الكلي — يحمل المعنى الضمني.",
        ex: "↘ تصريح | ↗ سؤال | ↗↘ تعجب",
        tip: "الانتونيشن الخاطئ يقلب معنى الكلمة",
        tags: ["انتونيشن", "معنى"],
      },
      {
        id: "t10",
        name: "مجموعات النبر",
        en: "Tone Groups",
        diff: "متقدم",
        desc: "تقطيع الجملة إلى وحدات نغمية مستقلة.",
        ex: "[أنا هنا] | [ما تخافش] | [معاك]",
        tags: ["تقطيع", "وحدة"],
      },
      {
        id: "t11",
        name: "الإلحاق",
        en: "Elision",
        diff: "متوسط",
        desc: "حذف صوت أو مقطع لتسريع التدفق.",
        ex: "ما قلتُه → ما قلته\nوأنا → وانا",
        tip: "وظّفه مقصوداً للتسريع",
        tags: ["حذف", "سرعة"],
      },
      {
        id: "t12",
        name: "الكلمات الصوتية",
        en: "Phoraesthetic Words",
        diff: "متوسط",
        desc: "كلمات يُعبّر شكلها الصوتي عن المعنى.",
        ex: "طرطرة / هدير / رفرفة / أزيز",
        tags: ["صوت", "معنى"],
      },
      {
        id: "t13",
        name: "ميزات البارالينغوية",
        en: "Paralinguistic Features",
        diff: "متقدم",
        desc: "عناصر غير لغوية تنقل المعنى: نبرة، سرعة، شدة.",
        ex: "الهمس = سر\nالصراخ = غضب\nالبرود = ثقة",
        tip: "أداءك البارالينغوي قد يُعاكس كلماتك",
        tags: ["أداء", "تعبير"],
      },
      {
        id: "t14",
        name: "حركة العلة",
        en: "Pitch Movement",
        diff: "متقدم",
        desc: "المسار الكامل لتحولات الصوت.",
        ex: "منخفض ← ارتفاع ← ذروة ← هبوط = دراما صوتية",
        tags: ["علة", "دراما"],
      },
      {
        id: "t15",
        name: "الإيقاع الكلي",
        en: "Prosody Features",
        diff: "متقدم",
        desc: "العناصر فوق المقطعية: النبر، المدة، العلة.",
        ex: "SPM + BPM + نبر + مدة + علة = الهوية الكاملة",
        tags: ["prosody", "هوية"],
      },
      {
        id: "t16",
        name: "تقسيم الجملة",
        en: "Sentence Division",
        diff: "متوسط",
        desc: "توزيع الجملة على وحدات نبر.",
        ex: "قصيرة = وحدة واحدة\nطويلة = عدة وحدات",
        tags: ["تقسيم", "تنفس"],
      },
      {
        id: "t17",
        name: "تغير العلة",
        en: "Pitch Change",
        diff: "متوسط",
        desc: "التحكم في ارتفاع الصوت لمنح كل كلمة شخصيتها.",
        ex: "منخفض (هدوء) → متوسط → عالٍ (ذروة)",
        tags: ["علة", "تحكم"],
      },
      {
        id: "t18",
        name: "المقطع النووي للنبر",
        en: "Nuclear Syllable",
        diff: "متقدم",
        desc: "المقطع الأبرز — يحمل أهم معلومة في الجملة.",
        ex: "أنا ما قلتها (ثلاث معانٍ مختلفة بتغيير النووي)",
        tip: "غيّر المقطع النووي لتغيير المعنى بالكامل",
        tags: ["نبر", "مقطع"],
      },
    ],
  },
  {
    id: "music",
    n: "٦",
    title: "الموسيقى",
    sub: "Music Theory",
    c: "#f87171",
    d: "rgba(248,113,113,.12)",
    b: "rgba(248,113,113,.25)",
    icon: "◉",
    techs: [
      {
        id: "m01",
        name: "الميتر المشترك",
        en: "Common Meter",
        diff: "مبتدئ",
        desc: "النمط الإيقاعي الأساسي — نقطة البداية.",
        ex: "4/4: نبرة قوية كل ٤ بيتات",
        tip: "معظم الراب العربي على 4/4",
        tags: ["ميتر", "أساس"],
      },
      {
        id: "m02",
        name: "أربعة بارات",
        en: "4 Bar Unit",
        diff: "مبتدئ",
        desc: "الوحدة الأساسية: ٤ بارات تشكل عبارة موسيقية كاملة.",
        ex: "بار١ (مقدمة) + بار٢ (تطوير)\n+ بار٣ (ذروة) + بار٤ (حل)",
        tip: "فكّر دائماً بوحدات ٤ بارات",
        tags: ["وحدة", "بار"],
      },
      {
        id: "m03",
        name: "الكوبليتس",
        en: "Couplets",
        diff: "مبتدئ",
        desc: "زوج من الأشطر المتقافية — الوحدة الشعرية الأساسية.",
        ex: "شطر A ← شطر A' (نفس القافية)",
        tags: ["زوج", "قافية"],
      },
      {
        id: "m04",
        name: "تنظيم الميتر",
        en: "Meter Organization",
        diff: "متوسط",
        desc: "ترتيب النبرات في وحدات موسيقية.",
        ex: "[قوية + ٣ ضعيفة] × ٤ = بار كامل",
        tags: ["ميتر", "تنظيم"],
      },
      {
        id: "m05",
        name: "التمديد إلى ٦ سطور",
        en: "Extension to 6 Lines",
        diff: "متوسط",
        desc: "توسيع الكوبليت إلى ٦ أشطر لبناء فكرة.",
        ex: "AA / BB / CC",
        tags: ["توسيع", "بناء"],
      },
      {
        id: "m06",
        name: "البارات والنقاط",
        en: "Bars & Points",
        diff: "متوسط",
        desc: "النقاط = مواضع النبر القوي داخل كل بار.",
        ex: "| × — — × | — — × — — |",
        tags: ["بار", "نقطة"],
      },
      {
        id: "m07",
        name: "البروسودي الموسيقي",
        en: "Musical Prosody",
        diff: "متقدم",
        desc: "توافق نبر الكلمات مع نبر الموسيقى.",
        ex: "نبر الكلمة = نبر البيت",
        tip: "غنّ الكلمات — إذا بدت طبيعية فالـ prosody صح",
        tags: ["prosody", "توافق"],
      },
      {
        id: "m08",
        name: "تصميم الكلمات",
        en: "Designing Lyrics",
        diff: "متقدم",
        desc: "المنهجية الحسابية: SPM × BPM × عدد المقاطع.",
        ex: "BPM ÷ ٢ = SPM المثالي\n120 BPM → 60 SPM",
        tip: "احسب SPM قبل الكتابة",
        tags: ["SPM", "BPM"],
      },
      {
        id: "m09",
        name: "التوازن / عدم التوازن",
        en: "Balanced vs Unbalanced",
        diff: "متقدم",
        desc: "المتوازنة (٨+٨) استقرار — غير المتوازنة توتر درامي.",
        ex: "8+8 (هدوء)\n8+6 (توتر)\n8+10 (دراما)",
        tags: ["توازن", "دراما"],
      },
      {
        id: "m10",
        name: "سطور التحفيز",
        en: "Trigger Lines",
        diff: "متقدم",
        desc: "أشطر مصممة لإثارة رد فعل فوري.",
        ex: "جملة قصيرة + صورة قوية + قافية حادة",
        tip: "الـ Trigger في البار ٣ أو ٤ من كل وحدة",
        tags: ["تحفيز", "احتراف"],
      },
      {
        id: "m11",
        name: "جذب الجمهور",
        en: "Audience Grabbing",
        diff: "متوسط",
        desc: "استراتيجيات الاستهلال في أول ٨ بارات.",
        ex: "الاستفزاز / السؤال الجريء / الصورة الصادمة",
        tip: "لديك ٨ بارات قبل قرار المستمع",
        tags: ["جمهور", "استهلال"],
      },
    ],
  },
];

const TOTAL = CHS.reduce((a, c) => a + c.techs.length, 0);
const DC: Record<string, string> = {
  مبتدئ: "#10b981",
  متوسط: "#f59e0b",
  متقدم: "#f87171",
};
const EXAMPLES = [
  "ما في أحد ما في أحد بجانبي في الليل",
  "الشارع علّمني والصمت ربّاني",
  "أنا الفرح والألم أنا الليل والنهار",
  "من الصفر بنيت حلمي بإيدي",
];

function searchAll(q: string) {
  const lq = q.toLowerCase();
  return CHS.flatMap((ch) =>
    ch.techs
      .filter(
        (t) =>
          t.name.includes(q) ||
          t.en.toLowerCase().includes(lq) ||
          t.desc.includes(q) ||
          (t.tags && t.tags.some((tg) => tg.includes(q))),
      )
      .map((t) => ({ ...t, _ch: ch })),
  );
}

function Card({ tech, ch, open, onToggle, badge, onApply }: any) {
  const dc = DC[tech.diff] || "#64748b";
  return (
    <motion.div
      layout
      onClick={(e) => {
        // Prevent toggle if clicking apply button
        if ((e.target as HTMLElement).closest(".apply-btn")) return;
        onToggle();
      }}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${open ? "shadow-lg" : ""}`}
      style={{
        background: open ? ch.d : "rgba(13, 13, 38, 0.5)",
        borderColor: open ? ch.b : "rgba(26, 26, 56, 0.5)",
        boxShadow: open ? `0 0 20px ${ch.d}` : "none",
      }}
    >
      {badge && (
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded mb-2 inline-block border"
          style={{ background: ch.d, color: ch.c, borderColor: ch.b }}
        >
          {ch.title}
        </span>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h4
            className="text-sm font-bold leading-tight mb-0.5"
            style={{ color: open ? ch.c : "#e2e8f0" }}
          >
            {tech.name}
          </h4>
          <p className="text-[10px] font-mono opacity-40">{tech.en}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded border"
            style={{ background: `${dc}18`, color: dc, borderColor: `${dc}28` }}
          >
            {tech.diff}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            style={{ color: open ? ch.c : "#2a2d50" }}
          />
        </div>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{tech.desc}</p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t" style={{ borderColor: ch.b }}>
              <div
                className="text-[9px] font-bold tracking-widest uppercase mb-2"
                style={{ color: ch.c }}
              >
                مثال
              </div>
              <div className="text-xs text-text-primary leading-relaxed whitespace-pre-line font-medium bg-bg-base/30 p-3 rounded-lg border border-border-default/10">
                {tech.ex}
              </div>

              {tech.tip && (
                <div className="flex gap-3 p-3 rounded-lg bg-gold-400/5 border border-gold-400/10 mt-3">
                  <Lightbulb className="w-4 h-4 text-gold-400 shrink-0" />
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {tech.tip}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-4">
                {(tech.tags || []).map((t: string) => (
                  <span
                    key={t}
                    className="text-[9px] px-2 py-0.5 rounded bg-bg-base text-text-muted border border-border-default"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {onApply && (
                <button
                  onClick={() => onApply(tech)}
                  className="apply-btn w-full mt-4 py-2 bg-gold-400 text-bg-base rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-gold-300 transition-all shadow-lg shadow-gold-400/10"
                >
                  <Zap className="w-3 h-3" /> تطبيق هذه التقنية
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const RapAcademy: React.FC<{ beatBlueprint?: any }> = ({
  beatBlueprint,
}) => {
  const [chId, setChId] = useState("grammar");
  const [tab, setTab] = useState("library");
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiMode, setAiMode] = useState("analyze");
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Workshop State
  const { bars, selectedBars, clearSelection } = useRepositoryStore();
  const [workshopBars, setWorkshopBars] = useState<
    { id: string; text: string; original: string }[]
  >([]);
  const [activeWorkshopIdx, setActiveWorkshopIdx] = useState(0);

  useEffect(() => {
    if (selectedBars.length > 0) {
      const selectedData = bars
        .filter((b) => selectedBars.includes(b.id))
        .map((b) => ({
          id: b.id,
          text: b.text,
          original: b.text,
        }));
      setWorkshopBars(selectedData);
      setTab("workshop");
      clearSelection();
    }
  }, [selectedBars, bars, clearSelection]);

  const ch = CHS.find((c) => c.id === chId)!;
  const isSearch = search.trim().length >= 2;
  const results = useMemo(() => searchAll(search), [search]);

  const isLoadingRef = useRef(false);
  const runAI = useCallback(async () => {
    if (!aiText.trim() || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setAiResult(null);

    const ref = CHS.flatMap((c) =>
      c.techs.map((t) => `• ${t.name} (${t.en}): ${t.desc.slice(0, 70)}`),
    ).join("\n");

    try {
      let result;
      if (aiMode === "analyze") {
        result = await geminiService.analyzeRapAcademy(aiText.trim(), ref);
      } else {
        result = await geminiService.improveRapAcademy(aiText.trim(), ref);
      }
      setAiResult(result);
    } catch (e: any) {
      if (e.name === "AbortError" || e.message?.includes("aborted")) {
        console.warn("AI request was aborted");
      } else {
        setAiResult({ error: `خطأ في الاتصال بالمحلل: ${e.message}` });
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [aiText, aiMode]);

  return (
    <div className="flex flex-col h-full bg-bg-primary/20 backdrop-blur-2xl border border-border-default rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-border-default bg-bg-surface/40 relative z-10">
        <div className="flex items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(212,160,23,0.15)]"
          >
            🎓
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-none tracking-tight">
              أكاديمية الراب العربي
            </h2>
            <p className="text-[11px] text-text-muted mt-2 font-mono uppercase tracking-[0.2em]">
              <b className="text-gold-400">{TOTAL}</b> تقنية احترافية •{" "}
              <span className="text-gold-400/60">MAQAM OS2</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-gold-400 transition-colors" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpenId(null);
              }}
              placeholder="ابحث عن تقنية..."
              className="bg-bg-base/40 border border-border-default rounded-xl pl-4 pr-10 py-2.5 text-xs text-text-primary outline-none focus:border-gold-400/50 transition-all w-64 text-right backdrop-blur-md"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex bg-bg-base/40 border border-border-default rounded-xl p-1.5 gap-1 backdrop-blur-md">
            <button
              onClick={() => {
                setTab("library");
                setAiResult(null);
              }}
              className={`text-[11px] font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${tab === "library" ? "bg-gold-400 text-bg-base shadow-[0_0_15px_rgba(212,160,23,0.3)]" : "text-text-muted hover:text-text-primary"}`}
            >
              <BookOpen className="w-4 h-4" /> المكتبة
            </button>
            <button
              onClick={() => {
                setTab("ai");
                setAiResult(null);
              }}
              className={`text-[11px] font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${tab === "ai" ? "bg-gold-400 text-bg-base shadow-[0_0_15px_rgba(212,160,23,0.3)]" : "text-text-muted hover:text-text-primary"}`}
            >
              <Cpu className="w-4 h-4" /> محلل AI
            </button>
            <button
              onClick={() => {
                setTab("workshop");
              }}
              className={`text-[11px] font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${tab === "workshop" ? "bg-gold-400 text-bg-base shadow-[0_0_15px_rgba(212,160,23,0.3)]" : "text-text-muted hover:text-text-primary"}`}
            >
              <Edit3 className="w-4 h-4" /> ورشة البروتوكول
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* SIDEBAR */}
        <aside
          className={`${isSidebarCollapsed ? "w-20" : "w-64"} border-l border-border-default bg-bg-surface/10 overflow-y-auto p-4 transition-all duration-500 relative group/sidebar`}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-bg-surface border border-border-default rounded-full flex items-center justify-center text-text-muted hover:text-gold-400 transition-all opacity-0 group-hover/sidebar:opacity-100 z-20"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-500 ${isSidebarCollapsed ? "rotate-90" : "-rotate-90"}`}
            />
          </button>

          <div
            className={`text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase mb-6 px-2 transition-opacity duration-300 ${isSidebarCollapsed ? "opacity-0" : "opacity-100"}`}
          >
            الفصول
          </div>
          <div className="space-y-2">
            {CHS.map((c) => {
              const active = c.id === chId && !isSearch;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setChId(c.id);
                    setOpenId(null);
                    setSearch("");
                    setTab("library");
                  }}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group ${active ? "bg-gold-400/10 border border-gold-400/30 shadow-[0_0_15px_rgba(212,160,23,0.05)]" : "hover:bg-bg-elevated/50 border border-transparent"}`}
                >
                  <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {c.icon}
                  </span>
                  {!isSidebarCollapsed && (
                    <>
                      <div className="flex-1 text-right min-w-0">
                        <div
                          className={`text-xs font-bold truncate ${active ? "text-gold-400" : "text-text-secondary"}`}
                        >
                          {c.title}
                        </div>
                        <div className="text-[9px] text-text-muted font-mono uppercase tracking-tighter mt-0.5">
                          {c.sub}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-bg-base/50 border border-border-default text-text-muted">
                        {c.techs.length}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 pt-8 border-t border-border-default"
            >
              <div className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase mb-6 px-2">
                الإحصائيات
              </div>
              <div className="space-y-4 px-2">
                {CHS.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-muted">{c.title}</span>
                      <span style={{ color: c.c }}>{c.techs.length}</span>
                    </div>
                    <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(c.techs.length / TOTAL) * 100}%`,
                        }}
                        className="h-full opacity-80"
                        style={{ background: c.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-bg-base/10">
          <AnimatePresence mode="wait">
            {tab === "library" && (
              <motion.div
                key={isSearch ? "search" : chId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {!isSearch ? (
                  <div
                    className="flex items-center gap-4 mb-8 p-6 rounded-2xl bg-bg-surface/30 border-r-4"
                    style={{ borderColor: ch.c }}
                  >
                    <span className="text-4xl">{ch.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold" style={{ color: ch.c }}>
                        الفصل {ch.n}: {ch.title}
                      </h3>
                      <p className="text-sm text-text-muted mt-1">
                        {ch.sub} — استكشف {ch.techs.length} تقنية احترافية
                      </p>
                    </div>
                    <div
                      className="text-6xl font-black opacity-5 select-none"
                      style={{ color: ch.c }}
                    >
                      {ch.n}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-text-primary">
                      نتائج البحث عن:{" "}
                      <span className="text-gold-400">"{search}"</span>
                    </h3>
                    <p className="text-[10px] text-text-muted mt-1">
                      تم العثور على {results.length} تقنية
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {isSearch && results.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                      <Search className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                      <p className="text-text-muted">
                        لا توجد نتائج تطابق بحثك...
                      </p>
                    </div>
                  ) : (
                    (isSearch ? results : ch.techs).map((t: any) => (
                      <Card
                        key={t.id}
                        tech={t}
                        ch={isSearch ? t._ch : ch}
                        open={openId === t.id}
                        onToggle={() =>
                          setOpenId(openId === t.id ? null : t.id)
                        }
                        badge={isSearch}
                        onApply={
                          tab === "workshop"
                            ? (tech: any) => {
                                // We need a way to trigger applyTechnique from WorkshopView
                                // I'll use a custom event or pass it down
                                const event = new CustomEvent("apply-tech", {
                                  detail: tech,
                                });
                                window.dispatchEvent(event);
                              }
                            : null
                        }
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {tab === "workshop" && (
              <motion.div
                key="workshop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full gap-6"
              >
                <ProtocolWorkshopView
                  bars={workshopBars}
                  setBars={setWorkshopBars}
                  activeIdx={activeWorkshopIdx}
                  setActiveIdx={setActiveWorkshopIdx}
                  blueprint={beatBlueprint}
                />
              </motion.div>
            )}

            {tab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full gap-6"
              >
                {/* AI Sidebar */}
                <div className="w-72 shrink-0 flex flex-col gap-6">
                  <div className="bg-bg-surface/30 border border-border-default rounded-2xl p-4 space-y-4">
                    <div>
                      <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase mb-2 block">
                        الوضع
                      </label>
                      <div className="flex bg-bg-base/50 border border-border-default rounded-lg p-1 gap-1">
                        <button
                          onClick={() => {
                            setAiMode("analyze");
                            setAiResult(null);
                          }}
                          className={`flex-1 text-[10px] font-bold py-2 rounded-md transition-all ${aiMode === "analyze" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-text-muted hover:text-text-primary"}`}
                        >
                          🔍 تحليل
                        </button>
                        <button
                          onClick={() => {
                            setAiMode("improve");
                            setAiResult(null);
                          }}
                          className={`flex-1 text-[10px] font-bold py-2 rounded-md transition-all ${aiMode === "improve" ? "bg-gold-400/20 text-gold-400 border border-gold-400/30" : "text-text-muted hover:text-text-primary"}`}
                        >
                          ✨ تحسين
                        </button>
                      </div>
                      <p className="text-[9px] text-text-muted mt-2 leading-relaxed px-1">
                        {aiMode === "analyze"
                          ? "اكتشف التقنيات وقيّم القوة الشعرية للبار."
                          : "احصل على ٤ نسخ محسّنة باستخدام تقنيات احترافية."}
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase mb-2 block">
                        البار
                      </label>
                      <textarea
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        rows={6}
                        placeholder="أدخل البار هنا للتحليل..."
                        className="w-full bg-bg-base/50 border border-border-default rounded-xl p-3 text-xs text-text-primary outline-none focus:border-gold-400/50 transition-all resize-none leading-relaxed text-right"
                      />
                    </div>

                    <button
                      onClick={runAI}
                      disabled={loading || !aiText.trim()}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${loading || !aiText.trim() ? "bg-bg-elevated text-text-muted cursor-not-allowed" : "bg-gold-400 text-bg-base hover:bg-gold-300 shadow-lg shadow-gold-400/10"}`}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : aiMode === "analyze" ? (
                        <Search className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {loading
                        ? "جاري المعالجة..."
                        : aiMode === "analyze"
                          ? "حلّل البار"
                          : "اقترح تحسينات"}
                    </button>
                  </div>

                  <div className="bg-bg-surface/10 border border-border-default/50 rounded-2xl p-4">
                    <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase mb-3 block">
                      أمثلة سريعة
                    </label>
                    <div className="space-y-2">
                      {EXAMPLES.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setAiText(ex)}
                          className="w-full text-right text-[10px] text-text-muted hover:text-gold-400 p-2 rounded-lg hover:bg-bg-surface/30 transition-all border border-transparent hover:border-border-default truncate"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Content Area */}
                <div className="flex-1 bg-bg-surface/20 border border-border-default rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                  {!aiResult && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                      <div className="w-20 h-20 rounded-3xl bg-bg-elevated border border-border-default flex items-center justify-center text-4xl">
                        🎤
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">
                          محلل Salomon الذكي
                        </h3>
                        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                          أدخل باراً في الجانب الأيمن ليقوم Claude بتحليله بناءً
                          على {TOTAL} تقنية احترافية.
                        </p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-gold-400/10 border-t-gold-400 animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-gold-400 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-text-primary">
                          جاري التحليل العميق...
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          يتم فحص {TOTAL} تقنية عبر ٦ فصول تعليمية
                        </p>
                      </div>
                    </div>
                  )}

                  {aiResult && !aiResult.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {aiMode === "analyze" ? (
                        <AnalyzeResult r={aiResult} />
                      ) : (
                        <ImproveResult r={aiResult} />
                      )}
                    </motion.div>
                  )}

                  {aiResult?.error && (
                    <div className="p-4 bg-quality-low/10 border border-quality-low/30 rounded-xl text-quality-low text-xs flex items-center gap-3">
                      <Activity className="w-4 h-4" />
                      {aiResult.error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

function ProtocolWorkshopView({
  bars,
  setBars,
  activeIdx,
  setActiveIdx,
  blueprint,
}: any) {
  const [applyingAI, setApplyingAI] = useState(false);
  const isApplyingRef = useRef(false);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [sections, setSections] = useState<{ index: number; title: string }[]>(
    [],
  );
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "blueprint">("list");
  const [suggestionsCache, setSuggestionsCache] = useState<Record<string, any>>(
    {},
  );
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showGenerativeModal, setShowGenerativeModal] = useState(false);
  const [generativeSuggestions, setGenerativeSuggestions] = useState<string[]>(
    [],
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (blueprint) {
      setViewMode("blueprint");
    }
  }, [blueprint]);

  const currentBar = bars[activeIdx];
  const { updateBar, bars: repoBars } = useRepositoryStore();

  useEffect(() => {
    if (!currentBar || !currentBar.text.trim()) return;
    const cacheKey = currentBar.text;
    if (suggestionsCache[cacheKey]) return;

    const timer = setTimeout(async () => {
      setIsFetchingSuggestions(true);
      try {
        const ref = CHS.flatMap((c) =>
          c.techs.map((t) => `[${t.id}] ${t.name}: ${t.desc}`),
        ).join("\n");
        const res = await geminiService.suggestTechniquesForBar(
          currentBar.text,
          ref,
        );
        if (res.suggestions) {
          setSuggestionsCache((prev) => ({
            ...prev,
            [cacheKey]: res.suggestions,
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentBar?.text, suggestionsCache]);

  useEffect(() => {
    const handleApplyTech = (e: any) => {
      applyTechnique(e.detail);
    };
    window.addEventListener("apply-tech", handleApplyTech);
    return () => window.removeEventListener("apply-tech", handleApplyTech);
  }, [bars, activeIdx, applyingAI]); // Re-bind when state changes to ensure closure has latest values

  const handleUpdateText = (val: string) => {
    const newBars = [...bars];
    newBars[activeIdx].text = val;
    setBars(newBars);
  };

  const handleGenerateAlternatives = async () => {
    if (!currentBar || isGenerating) return;
    setIsGenerating(true);
    setShowGenerativeModal(true);
    try {
      const contextBars = bars
        .slice(Math.max(0, activeIdx - 3), activeIdx)
        .map((b: any) => b.text)
        .join("\n");
      const prompt = `
أنت مساعد ذكي لكتابة الراب العربي.
البار الحالي: "${currentBar.text}"
السياق السابق:
${contextBars}

اقترح 3 بدائل قصيرة (كلمات أو أسطر قصيرة) يمكن أن تملأ الفجوات الإيقاعية أو تحسن القافية للبار الحالي.
أجب بـ JSON فقط:
{
  "suggestions": ["اقتراح 1", "اقتراح 2", "اقتراح 3"]
}
      `;
      const response = await geminiService.generateBars({ prompt });
      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      setGenerativeSuggestions(parsed.suggestions || []);
    } catch (err) {
      console.error(err);
      setGenerativeSuggestions(["حدث خطأ أثناء التوليد"]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTechnique = async (tech: any) => {
    if (!currentBar || isApplyingRef.current) return;
    isApplyingRef.current = true;
    setSelectedTech(tech);
    setApplyingAI(true);
    try {
      const response = await geminiService.improveRapAcademy(
        currentBar.text,
        `• ${tech.name} (${tech.en}): ${tech.desc}\nمثال: ${tech.ex}`,
      );

      if (response.improvements && response.improvements.length > 0) {
        const newText = response.improvements[0].rewrite;

        // Visual sequence: Flash -> Typewriter -> Done
        setShowFlash(true);
        setIsTyping(true);

        // Clear text with a slight delay
        handleUpdateText("");
        await new Promise((r) => setTimeout(r, 200));

        let currentText = "";
        const words = newText.split(" ");

        for (let i = 0; i < words.length; i++) {
          await new Promise((r) => setTimeout(r, 40));
          currentText += (i === 0 ? "" : " ") + words[i];
          handleUpdateText(currentText);
        }

        setIsTyping(false);
        setTimeout(() => setShowFlash(false), 2000);

        // Save to repository immediately
        updateBar(currentBar.id, { text: newText });
      }
    } catch (e: any) {
      if (e.name === "AbortError" || e.message?.includes("aborted")) {
        console.warn("AI request was aborted:", e);
      } else {
        console.error(e);
      }
    } finally {
      isApplyingRef.current = false;
      setApplyingAI(false);
    }
  };

  const saveToRepository = () => {
    if (!currentBar) return;
    updateBar(currentBar.id, { text: currentBar.text });
    // Show success toast or something
  };

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const handleExport = () => {
    const barsToExport =
      selectedIndices.length > 0
        ? selectedIndices.sort((a, b) => a - b).map((i) => bars[i])
        : bars;

    let content = `MAQAM v2.0 - Lyrical Export\nGenerated: ${new Date().toLocaleString()}\n\n`;

    barsToExport.forEach((b: any, i: number) => {
      const section = sections.find((s) => s.index === i);
      if (section) content += `\n[ ${section.title.toUpperCase()} ]\n`;
      content += `${i + 1}. ${b.text}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maqam_export_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addSection = () => {
    const title = prompt("أدخل اسم القسم (مثلاً: الكورس، المقطع الأول):");
    if (title) {
      setSections((prev) => [...prev, { index: activeIdx, title }]);
    }
  };

  const autoSection = async () => {
    if (bars.length < 4 || isExporting || isApplyingRef.current) return;
    isApplyingRef.current = true;
    setIsExporting(true);
    try {
      const barsToAnalyze =
        selectedIndices.length > 0
          ? selectedIndices.sort((a, b) => a - b).map((i) => bars[i].text)
          : bars.map((b: any) => b.text);

      const response =
        await geminiService.detectWorkshopSections(barsToAnalyze);

      if (response.sections && Array.isArray(response.sections)) {
        const newSections: { index: number; title: string }[] = [];
        response.sections.forEach((sec: any) => {
          // Map back to original indices if a subset was selected
          const realIndex =
            selectedIndices.length > 0
              ? selectedIndices.sort((a, b) => a - b)[sec.startIndex]
              : sec.startIndex;

          if (realIndex !== undefined) {
            newSections.push({ index: realIndex, title: sec.name });
          }
        });
        setSections(newSections.sort((a, b) => a.index - b.index));
      }
    } catch (e) {
      console.error(e);
    } finally {
      isApplyingRef.current = false;
      setIsExporting(false);
    }
  };

  if (bars.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-bg-elevated border border-border-default flex items-center justify-center text-4xl">
          🏗️
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">
            ورشة إعادة البناء خالية
          </h3>
          <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
            حدد مجموعة من البارات من المستودع واضغط على "إرسال للأكاديمية" للبدء
            في تطويرها يدوياً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      {/* View Toggle */}
      <div className="flex items-center justify-between bg-bg-surface/30 border border-border-default p-2 rounded-2xl">
        <div className="flex bg-bg-base/50 p-1 rounded-xl gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode === "list" ? "bg-gold-400 text-bg-base shadow-lg" : "text-text-muted hover:text-text-primary"}`}
          >
            <List className="w-3.5 h-3.5" /> قائمة البارات
          </button>
          <button
            onClick={() => setViewMode("blueprint")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode === "blueprint" ? "bg-gold-400 text-bg-base shadow-lg" : "text-text-muted hover:text-text-primary"}`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> مخطط المسار (Protocol)
          </button>
        </div>
        {blueprint && (
          <div className="flex items-center gap-3 px-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gold-400">
                {blueprint.beatType} - {blueprint.subType}
              </span>
              <span className="text-[8px] text-text-muted uppercase font-mono">
                {blueprint.bpm} BPM
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <AudioWaveform className="w-4 h-4 text-gold-400" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {viewMode === "list" ? (
          <>
            {/* Matrix Grid Integration in Workshop */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Bar List */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="text-[9px] font-bold tracking-[0.3em] text-text-muted uppercase">
                      البارات ({bars.length})
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveToRepository}
                        className="p-1 text-text-muted hover:text-gold-400 transition-colors"
                        title="حفظ التغييرات"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={addSection}
                        className="p-1 text-text-muted hover:text-gold-400 transition-colors"
                        title="إضافة قسم"
                      >
                        <PlusSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleExport}
                        className="p-1 text-text-muted hover:text-gold-400 transition-colors"
                        title="تصدير المختار"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {bars.map((b: any, i: number) => {
                      const section = sections.find((s) => s.index === i);
                      return (
                        <React.Fragment key={b.id}>
                          {section && (
                            <div className="py-2 px-3 bg-gold-400/5 border-y border-gold-400/10 flex items-center justify-between group">
                              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="w-3 h-3" /> {section.title}
                              </span>
                              <button
                                onClick={() =>
                                  setSections((prev) =>
                                    prev.filter((s) => s.index !== i),
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-quality-low transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 group">
                            <input
                              type="checkbox"
                              checked={selectedIndices.includes(i)}
                              onChange={() => toggleSelect(i)}
                              className="w-3 h-3 rounded border-border-default bg-bg-base text-gold-400 focus:ring-gold-400/50"
                            />
                            <button
                              onClick={() => setActiveIdx(i)}
                              className={`flex-1 p-3 rounded-xl border text-right transition-all ${activeIdx === i ? "bg-gold-400/10 border-gold-400/30" : "bg-bg-surface/30 border-border-default hover:border-border-default/80"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono opacity-50">
                                    #{i + 1}
                                  </span>
                                  <span className="text-[9px] font-mono text-gold-400 bg-gold-400/10 px-1 rounded border border-gold-400/20">
                                    {b.serialNumber ||
                                      `BAR-${String(i + 1).padStart(4, "0")}`}
                                  </span>
                                  <span className="text-[9px] font-mono text-text-muted bg-bg-elevated px-1 rounded border border-border-default">
                                    Mora: {b.totalMorae || 0}
                                  </span>
                                </div>
                                {b.text !== b.original && (
                                  <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                                )}
                              </div>
                              <div className="text-xs font-bold truncate">
                                {b.text}
                              </div>
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <button
                    onClick={autoSection}
                    disabled={isExporting}
                    className="w-full py-2 bg-bg-surface border border-border-default rounded-xl text-[10px] font-bold text-text-muted hover:text-gold-400 hover:border-gold-400/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Cpu className="w-3 h-3" />
                    )}
                    تقسيم تلقائي بالذكاء الاصطناعي
                  </button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-bg-surface/30 border border-border-default rounded-2xl p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Edit3 className="w-4 h-4 text-gold-400" />
                        <h3 className="text-sm font-bold text-text-primary">
                          تحرير البار #{activeIdx + 1}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateText(currentBar.original)}
                          className="p-2 text-text-muted hover:text-gold-400 transition-colors"
                          title="استعادة النص الأصلي"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveToRepository}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-400 text-bg-base rounded-lg text-xs font-bold hover:bg-gold-300 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> حفظ التعديلات
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-text-muted font-mono uppercase">
                        النص الأصلي
                      </label>
                      <div className="p-4 bg-bg-base/30 border border-border-default rounded-xl text-sm text-text-muted/60 italic">
                        {currentBar.original}
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[10px] text-gold-400 font-mono uppercase">
                        النص المطور
                      </label>

                      <AnimatePresence mode="wait">
                        {selectedTech && (
                          <motion.div
                            key={selectedTech.id}
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className="p-4 bg-gold-400/5 border border-gold-400/20 rounded-xl mb-3 overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gold-400/20 flex items-center justify-center">
                                  <Zap className="w-3.5 h-3.5 text-gold-400" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gold-400 block">
                                    تقنية نشطة: {selectedTech.name}
                                  </span>
                                  <span className="text-[8px] text-text-muted uppercase font-mono">
                                    {selectedTech.en}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedTech(null)}
                                className="p-1.5 hover:bg-gold-400/10 rounded-lg transition-colors"
                              >
                                <X className="w-3 h-3 text-text-muted" />
                              </button>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed mb-3 bg-bg-base/20 p-2 rounded-lg border border-border-default/30">
                              <span className="text-gold-400 font-bold ml-1">
                                الغرض:
                              </span>
                              {selectedTech.desc}
                            </p>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 text-[9px] text-text-muted italic bg-bg-base/30 p-2 rounded border border-border-default/50 truncate">
                                مثال: {selectedTech.ex}
                              </div>
                              <button
                                onClick={() =>
                                  handleUpdateText(selectedTech.ex)
                                }
                                className="shrink-0 text-[9px] font-bold text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> نسخ المثال
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative group">
                        <AnimatePresence>
                          {applyingAI && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-10 bg-bg-base/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center gap-3 overflow-hidden"
                            >
                              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                                <div className="w-full h-1 bg-gold-400/50 absolute top-0 animate-scanline" />
                              </div>
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full border-2 border-gold-400/20 border-t-gold-400 animate-spin" />
                                <Cpu className="w-5 h-5 text-gold-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              <div className="text-[10px] font-mono text-gold-400 animate-pulse uppercase tracking-widest">
                                جارِ إعادة الهندسة...
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div
                          animate={
                            showFlash
                              ? {
                                  boxShadow: [
                                    "0 0 0 0px rgba(251, 191, 36, 0)",
                                    "0 0 0 20px rgba(251, 191, 36, 0)",
                                    "0 0 0 0px rgba(251, 191, 36, 0)",
                                  ],
                                  borderColor: [
                                    "rgba(251, 191, 36, 0.2)",
                                    "rgba(251, 191, 36, 1)",
                                    "rgba(251, 191, 36, 0.2)",
                                  ],
                                  scale: [1, 1.01, 1],
                                }
                              : {}
                          }
                          transition={{ duration: 0.8 }}
                          className="rounded-xl overflow-hidden relative"
                        >
                          {showFlash && (
                            <div className="absolute inset-0 pointer-events-none z-20">
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{
                                    opacity: 0,
                                    scale: 0,
                                    x: "50%",
                                    y: "50%",
                                  }}
                                  animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0],
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`,
                                  }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  className="absolute w-2 h-2 bg-gold-400 rounded-full blur-[1px]"
                                />
                              ))}
                            </div>
                          )}
                          <textarea
                            value={currentBar.text}
                            onChange={(e) =>
                              !isTyping && handleUpdateText(e.target.value)
                            }
                            readOnly={isTyping}
                            className={`w-full h-32 bg-bg-base/50 border border-gold-400/20 rounded-xl p-4 text-lg font-bold text-text-primary outline-none focus:border-gold-400/50 transition-all resize-none text-right ${isTyping ? "cursor-wait" : ""}`}
                            placeholder="اكتب هنا أو اختر تقنية من المكتبة لتطبيقها..."
                          />
                        </motion.div>

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={handleGenerateAlternatives}
                            disabled={isGenerating || isTyping}
                            className="px-4 py-2 bg-gold-400/10 border border-gold-400/30 text-gold-400 rounded-lg text-xs font-bold hover:bg-gold-400/20 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            توليد خيارات إضافية
                          </button>
                        </div>

                        {showGenerativeModal && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-bg-surface/80 border border-gold-400/30 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-gold-400 flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> خيارات مقترحة
                              </h4>
                              <button
                                onClick={() => setShowGenerativeModal(false)}
                                className="text-text-muted hover:text-text-primary"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {isGenerating ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {generativeSuggestions.map((sug, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      handleUpdateText(sug);
                                      setShowGenerativeModal(false);
                                    }}
                                    className="text-right p-3 rounded-lg bg-bg-base/50 border border-border-default hover:border-gold-400/50 hover:bg-gold-400/10 transition-all text-sm text-text-primary"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {showFlash && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            className="absolute top-4 left-4 z-20 flex flex-col items-start gap-1"
                          >
                            <div className="bg-quality-perfect text-bg-base px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
                              <Sparkles className="w-2.5 h-2.5" />{" "}
                              {isTyping ? "جارِ الكتابة..." : "تم التحديث"}
                            </div>
                            {selectedTech && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gold-400/20 backdrop-blur-md border border-gold-400/30 text-gold-400 px-2 py-1 rounded text-[7px] font-bold uppercase tracking-tighter"
                              >
                                تطبيق: {selectedTech.name}
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {isTyping && (
                          <div className="absolute bottom-4 left-4 z-20 flex items-end gap-0.5 h-4">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, 16, 4] }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                                className="w-1 bg-gold-400 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="bg-gold-400/5 border border-gold-400/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3 text-gold-400">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                          اقتراحات الذكاء الاصطناعي
                        </span>
                        {isFetchingSuggestions && (
                          <Loader2 className="w-3 h-3 animate-spin mr-auto" />
                        )}
                      </div>
                      {(() => {
                        const currentSuggestions = currentBar
                          ? suggestionsCache[currentBar.text]
                          : null;
                        if (currentSuggestions) {
                          return (
                            <div className="flex flex-col gap-2">
                              {currentSuggestions.map((sug: any, i: number) => {
                                const tech = CHS.flatMap((c) => c.techs).find(
                                  (t) => t.id === sug.techniqueId,
                                );
                                return (
                                  <div
                                    key={i}
                                    className="bg-bg-surface/50 border border-border-default rounded-lg p-3 flex items-start justify-between gap-4"
                                  >
                                    <div>
                                      <div className="text-xs font-bold text-text-primary mb-1">
                                        {sug.techniqueName}
                                      </div>
                                      <div className="text-[10px] text-text-secondary leading-relaxed">
                                        {sug.reason}
                                      </div>
                                    </div>
                                    {tech && (
                                      <button
                                        onClick={() => applyTechnique(tech)}
                                        disabled={applyingAI}
                                        className="shrink-0 px-3 py-1.5 bg-gold-400/10 text-gold-400 hover:bg-gold-400 hover:text-bg-base rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                      >
                                        تطبيق
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs text-text-muted">
                            جاري تحليل البار لاقتراح تقنيات...
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quick Tech Access */}
                  <div className="flex-1 bg-bg-surface/10 border border-border-default/50 rounded-2xl p-6 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold-400" />
                        <h3 className="text-sm font-bold text-text-primary">
                          تطبيق تقنية ذكية
                        </h3>
                      </div>
                      <p className="text-[10px] text-text-muted">
                        اختر تقنية من المكتبة (الجانب الأيمن) لتطبيقها فوراً
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-3">
                        {CHS.flatMap((c) => c.techs.slice(0, 4)).map(
                          (t: any) => (
                            <button
                              key={t.id}
                              onClick={() => applyTechnique(t)}
                              disabled={applyingAI}
                              className="p-3 rounded-xl border border-border-default bg-bg-surface/30 hover:border-gold-400/30 hover:bg-gold-400/5 transition-all text-right group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gold-400">
                                  {t.name}
                                </span>
                                {applyingAI ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-gold-400" />
                                ) : (
                                  <Zap className="w-3 h-3 text-text-muted group-hover:text-gold-400" />
                                )}
                              </div>
                              <div className="text-[9px] text-text-muted line-clamp-1">
                                {t.desc}
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                      <div className="mt-4 p-4 bg-gold-400/5 border border-gold-400/10 rounded-xl flex items-center gap-3">
                        <Lightbulb className="w-4 h-4 text-gold-400 shrink-0" />
                        <p className="text-[10px] text-text-secondary">
                          يمكنك أيضاً فتح أي تقنية في "المكتبة" والضغط على زر
                          "تطبيق" (سيتم إضافته) لتجربتها على هذا البار.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6"></div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <BlueprintWorksheet
              blueprint={blueprint}
              workshopBars={bars}
              setWorkshopBars={setBars}
              repoBars={repoBars}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BlueprintWorksheet({
  blueprint,
  workshopBars,
  setWorkshopBars,
  repoBars,
  activeIdx,
  setActiveIdx,
}: any) {
  if (!blueprint || !blueprint.trackProtocol) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-bg-surface/10 border border-border-default border-dashed rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">
          لا يوجد بروتوكول متاح
        </h3>
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
          قم بتحليل بيت موسيقي في "استوديو التحليل" أولاً لإنشاء ورقة العمل
          التلقائية.
        </p>
      </div>
    );
  }

  const injectBar = (slotIdx: number, bar: any) => {
    const newBars = [...workshopBars];
    // Ensure we have enough slots
    while (newBars.length <= slotIdx) {
      newBars.push({ id: crypto.randomUUID(), text: "", original: "" });
    }
    newBars[slotIdx] = { ...bar, original: bar.text };
    setWorkshopBars(newBars);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-bold text-text-primary">
            مخطط التنفيذ البصري (Visual Protocol)
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <button
            onClick={() => {
              /* Save logic for blueprint */
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-gold-400/10 border border-gold-400/30 text-gold-400 rounded-lg font-bold hover:bg-gold-400/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" /> حفظ المخطط
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-quality-perfect" />
            <span className="text-text-muted">Verse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold-400" />
            <span className="text-text-muted">Hook</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
        {blueprint.trackProtocol.sections?.map((section: any, sIdx: number) => (
          <div key={sIdx} className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${section.type === "hook" ? "bg-gold-400 text-bg-base" : "bg-bg-elevated border border-border-default text-text-primary"}`}
              >
                {section.type}
              </div>
              <div className="h-px flex-1 bg-border-default/30" />
              <div className="text-[10px] font-mono text-text-muted">
                {section.bars} BARS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.directives?.map((dir: any, dIdx: number) => {
                const bar = workshopBars[dir.index];
                const isActive = activeIdx === dir.index;

                return (
                  <div
                    key={dIdx}
                    onClick={() => setActiveIdx(dir.index)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${isActive ? "bg-gold-400/10 border-gold-400/40 ring-1 ring-gold-400/20" : "bg-bg-surface/30 border-border-default hover:border-border-default/80"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-bg-base flex items-center justify-center text-[10px] font-mono font-bold text-gold-400 border border-border-default">
                          {dir.index + 1}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-text-primary">
                            {dir.recommendedTechnique}
                          </div>
                          <div className="text-[8px] text-text-muted uppercase font-mono">
                            Focus: {dir.phonemeFocus}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {dir.energyLevel === "peak" && (
                          <Flame className="w-3 h-3 text-quality-low animate-pulse" />
                        )}
                        <div
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${dir.energyLevel === "peak" ? "bg-quality-low/20 text-quality-low" : "bg-bg-base text-text-muted"}`}
                        >
                          {dir.energyLevel}
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[3rem] flex items-center justify-center border border-dashed border-border-default/50 rounded-xl bg-bg-base/20 group-hover:bg-bg-base/40 transition-all overflow-hidden">
                      {bar && bar.text ? (
                        <p className="text-xs font-bold text-text-primary px-3 text-center leading-relaxed">
                          {bar.text}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                          <PlusSquare className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">
                            انقر للتحرير أو اسحب باراً
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[8px] text-text-muted italic max-w-[70%] truncate">
                        {dir.description}
                      </div>
                      <div className="text-[9px] font-mono text-gold-400/60">
                        Target: {dir.syllableTarget}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="relative">
                        <button className="p-1.5 bg-bg-elevated border border-border-default rounded-lg hover:text-gold-400">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Repository Quick Access for Injection */}
      <div className="h-48 shrink-0 bg-bg-surface/30 border border-border-default rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gold-400" />
            <h3 className="text-xs font-bold text-text-primary">
              حقن مباشر من المستودع
            </h3>
          </div>
          <div className="text-[9px] text-text-muted">
            اسحب البار أو انقر على "+" لحقنه في المخطط النشط
          </div>
        </div>
        <div className="flex-1 overflow-x-auto flex gap-3 pb-2 custom-scrollbar-h">
          {(repoBars || []).slice(0, 10).map((b: any) => (
            <div
              key={b.id}
              onClick={() => injectBar(activeIdx, b)}
              className="w-48 shrink-0 bg-bg-base/40 border border-border-default rounded-xl p-3 hover:border-gold-400/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                {b.text}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[8px] font-mono text-text-muted">
                  {b.corePhoneme}
                </span>
                <PlusSquare className="w-3 h-3 text-text-muted group-hover:text-gold-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyzeResult({ r }: any) {
  const s = Math.max(0, Math.min(10, r.score || 0));
  const sc = s >= 8 ? "#10b981" : s >= 6 ? "#f59e0b" : "#f87171";
  const sc2: Record<string, string> = {
    قوي: "#10b981",
    متوسط: "#f59e0b",
    خفيف: "#64748b",
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-6 items-center p-6 bg-bg-elevated/30 rounded-2xl border border-border-default">
        <div
          className="w-20 h-20 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center bg-bg-base/50"
          style={{ borderColor: `${sc}44` }}
        >
          <span
            className="text-3xl font-black leading-none"
            style={{ color: sc }}
          >
            {s}
          </span>
          <span className="text-[10px] text-text-muted mt-1 font-mono">
            / 10
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-primary leading-relaxed">
            {r.summary}
          </p>
          {r.flow_note && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-purple-400 font-medium">
              <Activity className="w-3.5 h-3.5" /> {r.flow_note}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase border-b border-border-default pb-3">
          التقنيات المكتشفة{" "}
          <span className="text-quality-perfect ml-2">
            {Array.isArray(r.detected) ? r.detected.length : 0}
          </span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(r.detected) ? r.detected : []).map((d: any, i: number) => {
            const c = sc2[d.strength] || "#64748b";
            return (
              <div
                key={i}
                className="p-4 rounded-xl border-r-4 bg-bg-surface/30 border border-border-default"
                style={{ borderRightColor: c }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold" style={{ color: c }}>
                    {d.name}
                  </span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      background: `${c}18`,
                      color: c,
                      borderColor: `${c}28`,
                    }}
                  >
                    {d.strength}
                  </span>
                </div>
                <p className="text-[9px] font-mono opacity-30 mb-2">
                  {d.nameEn}
                </p>
                <p className="text-[11px] text-text-secondary italic leading-relaxed">
                  "{d.evidence}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {r.suggestions?.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase border-b border-border-default pb-3">
            اقتراحات التطوير
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {(r.suggestions || []).map((s: string, i: number) => (
              <div
                key={i}
                className="flex gap-3 p-4 bg-bg-surface/10 rounded-xl border border-border-default text-xs text-text-secondary leading-relaxed hover:bg-bg-surface/20 transition-all"
              >
                <span className="text-gold-400 font-bold shrink-0">→</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImproveResult({ r }: any) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase">
          البار الأصلي
        </h4>
        <div className="p-5 bg-bg-elevated/30 border border-border-default rounded-2xl text-lg font-bold text-text-muted/60 italic">
          {r.original}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase border-b border-border-default pb-3">
          مقترحات التحسين{" "}
          <span className="text-gold-400 ml-2">
            {r.improvements?.length || 0}
          </span>
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {(r.improvements || []).map((imp: any, i: number) => (
            <div
              key={i}
              className="p-6 bg-bg-surface/30 border border-border-default rounded-2xl relative group hover:border-gold-400/30 transition-all"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-bg-base border border-border-default flex items-center justify-center text-xs font-black text-gold-400/20 group-hover:text-gold-400 transition-colors">
                {i + 1}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-bold text-gold-400">
                  {imp.technique}
                </span>
              </div>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                {imp.why}
              </p>
              <div className="p-4 bg-bg-base/50 border border-gold-400/10 rounded-xl text-lg font-bold text-quality-perfect leading-relaxed text-right">
                {imp.rewrite}
              </div>
            </div>
          ))}
        </div>
      </div>

      {r.pro_tip && (
        <div className="p-6 bg-gold-400/5 border border-gold-400/20 rounded-2xl flex gap-5">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gold-400/10 flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-gold-400 uppercase mb-2">
              نصيحة الخبير
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {r.pro_tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
