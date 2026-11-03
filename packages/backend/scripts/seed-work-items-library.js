const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const ORG_ID = 'cmvl5owdo0000m2hfz0hnsi2g';

const STANDARD_UNITS = [
  { code: 'SQM', nameAr: 'متر مربع', nameEn: 'Square Meter', symbolAr: 'م²', symbolEn: 'm²', category: 'AREA', isDefault: true, sortOrder: 1 },
  { code: 'CBM', nameAr: 'متر مكعب', nameEn: 'Cubic Meter', symbolAr: 'م³', symbolEn: 'm³', category: 'VOLUME', isDefault: false, sortOrder: 2 },
  { code: 'LM', nameAr: 'متر طولي', nameEn: 'Linear Meter', symbolAr: 'م.ط', symbolEn: 'lm', category: 'LENGTH', isDefault: false, sortOrder: 3 },
  { code: 'PCS', nameAr: 'قطعة', nameEn: 'Piece', symbolAr: 'قطعة', symbolEn: 'pc', category: 'COUNT', isDefault: false, sortOrder: 4 },
  { code: 'POINT', nameAr: 'نقطة', nameEn: 'Point', symbolAr: 'نقطة', symbolEn: 'pt', category: 'COUNT', isDefault: false, sortOrder: 5 },
  { code: 'SET', nameAr: 'طقم', nameEn: 'Set', symbolAr: 'طقم', symbolEn: 'set', category: 'COUNT', isDefault: false, sortOrder: 6 },
  { code: 'KG', nameAr: 'كيلوجرام', nameEn: 'Kilogram', symbolAr: 'كجم', symbolEn: 'kg', category: 'WEIGHT', isDefault: false, sortOrder: 7 },
  { code: 'TON', nameAr: 'طن', nameEn: 'Ton', symbolAr: 'طن', symbolEn: 'ton', category: 'WEIGHT', isDefault: false, sortOrder: 8 },
  { code: 'LUMP_SUM', nameAr: 'مقطوعية', nameEn: 'Lump Sum', symbolAr: 'مقطوعية', symbolEn: 'LS', category: 'SERVICE', isDefault: false, sortOrder: 9 },
];

const WORK_ITEMS_36 = [
  // ─── أولاً: الأعمال الإنشائية ──────────────────────────────────
  {
    code: 'CON-01',
    nameAr: 'أعمال الحفر',
    nameEn: 'Excavation Works',
    category: 'CONSTRUCTION',
    subCategory: 'أعمال ترابية',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 45,
    descriptionAr: 'حفر في جميع أنواع التربة حتى المنسوب التصميمي مع ترحيل نواتج الحفر للمقالب العمومية المعتمدة.',
    descriptionEn: 'Site excavation in all soil types down to design levels including disposal of excavated materials.',
    sortOrder: 1,
  },
  {
    code: 'CON-02',
    nameAr: 'أعمال الردم',
    nameEn: 'Backfilling Works',
    category: 'CONSTRUCTION',
    subCategory: 'أعمال ترابية',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 35,
    descriptionAr: 'أعمال الردم بتربة نظيفة معتمدة على طبقات سماكة 25-30 سم مع الرش والدمك الميكانيكي واختبارات الكثافة.',
    descriptionEn: 'Backfilling with clean approved material in layers of 25-30 cm with water spraying and mechanical compaction.',
    sortOrder: 2,
  },
  {
    code: 'CON-03',
    nameAr: 'أعمال الدفان',
    nameEn: 'Compacted Sub-base Filling',
    category: 'CONSTRUCTION',
    subCategory: 'أعمال ترابية',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 40,
    descriptionAr: 'توريد وفرد ودمك مواد الدفان المتدرجة (Sub-base) تحت الأرضيات والقواعد مع الفحص المخبري لنسبة الدمك 95%.',
    descriptionEn: 'Supply, spreading and compaction of graded sub-base material under floor slabs and footings with 95% compaction test.',
    sortOrder: 3,
  },
  {
    code: 'CON-04',
    nameAr: 'أعمال الخرسانة العادية',
    nameEn: 'Plain Concrete Works (PCC)',
    category: 'CONSTRUCTION',
    subCategory: 'خرسانات',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 280,
    descriptionAr: 'صب خرسانة عادية نظافة أسفل القواعد المسلحة والأرضيات جهد 200 كجم/سم² سماكة 10 سم شاملة العزل والفرش.',
    descriptionEn: 'Casting plain concrete blinding under footings and ground slabs 200 kg/cm² including polyethylene sheet and curing.',
    sortOrder: 4,
  },
  {
    code: 'CON-05',
    nameAr: 'أعمال الخرسانة المسلحة',
    nameEn: 'Reinforced Concrete Works (RCC)',
    category: 'CONSTRUCTION',
    subCategory: 'خرسانات',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 650,
    descriptionAr: 'أعمال خرسانة مسلحة جاهزة جهد 350-400 كجم/سم² مقاوم للكبريتات شاملة النجارة والحدادة والصب والدمك والمعالجة.',
    descriptionEn: 'Ready-mix reinforced concrete 350-400 kg/cm² SRC including formwork, steel reinforcement, pouring and curing.',
    sortOrder: 5,
  },
  {
    code: 'CON-06',
    nameAr: 'أعمال صب القواعد',
    nameEn: 'Footings Concrete Works',
    category: 'CONSTRUCTION',
    subCategory: 'خرسانات',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 580,
    descriptionAr: 'صب الخرسانة المسلحة للقواعد المنفصلة والشريطية والمشتركة شاملة حديد التسليح عالي المقاومة والشدات الخشبية.',
    descriptionEn: 'Reinforced concrete casting for isolated, strip, and combined footings including high-tensile steel and formwork.',
    sortOrder: 6,
  },
  {
    code: 'CON-07',
    nameAr: 'أعمال الأعمدة الخرسانية',
    nameEn: 'Concrete Columns Works',
    category: 'CONSTRUCTION',
    subCategory: 'خرسانات',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 750,
    descriptionAr: 'تنفيذ الأعمدة الخرسانية بالارتفاعات الهندسية شاملة حديد التسليح والشدات الرأسية الشاقولية والدمك بالهزاز الميكانيكي.',
    descriptionEn: 'Execution of vertical concrete columns including rebar cage, plumbed formwork, mechanical vibration and curing.',
    sortOrder: 7,
  },
  {
    code: 'CON-08',
    nameAr: 'أعمال الأسقف',
    nameEn: 'Slabs & Beams Concrete Works',
    category: 'CONSTRUCTION',
    subCategory: 'خرسانات',
    unitCode: 'CBM',
    unitSymbol: 'م³',
    unitEn: 'm³',
    defaultPrice: 700,
    descriptionAr: 'تنفيذ الأسقف والكمرات الخرسانية (هوردي / مصمت / فلات سلاب) شاملة الشدات والتسليح والصب والتسوية الدقيقة.',
    descriptionEn: 'Concrete slabs and beams execution (hollow block / solid / flat slab) including scaffolding, rebar and power trowel finish.',
    sortOrder: 8,
  },
  {
    code: 'CON-09',
    nameAr: 'أعمال المباني بالطوب',
    nameEn: 'Blockwork & Masonry',
    category: 'CONSTRUCTION',
    subCategory: 'مباني وعزل',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 85,
    descriptionAr: 'بناء جدران من البلوك الإسمنتي أو البركاني المعزول مقاس 20 سم بالمونة الإسمنتية والتشريك والربط مع الأعمدة بالسياج.',
    descriptionEn: '20cm cement/volcanic block masonry construction using cement mortar, wire mesh anchors and column ties.',
    sortOrder: 9,
  },
  {
    code: 'CON-10',
    nameAr: 'أعمال العزل المائي',
    nameEn: 'Waterproofing Works',
    category: 'CONSTRUCTION',
    subCategory: 'مباني وعزل',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 65,
    descriptionAr: 'عزل مائي بلفائف البيتومين المعدلة سماكة 4 ملم للأسطح ودورات المياه والمطابخ مع زوايا الفيليت واختبار الغمر 48 ساعة.',
    descriptionEn: '4mm modified bituminous membrane waterproofing for roofs and wet areas including angle fillets and 48hr water test.',
    sortOrder: 10,
  },

  // ─── ثانياً: أعمال التشطيبات ──────────────────────────────────
  {
    code: 'FIN-01',
    nameAr: 'أعمال اللياسة',
    nameEn: 'Internal & External Plastering',
    category: 'FINISHING',
    subCategory: 'لياسة ودهانات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 35,
    descriptionAr: 'لياسة إسمنتية شاملة الطرطشة المسمارية وشبك الفواصل والزوايا والأوتار والبؤج بسماكة 2 سم مع الرش بالماء لمدة 5 أيام.',
    descriptionEn: 'Cement plastering including spatter dash, fiber mesh, corner beads and dot/screed application at 20mm thickness.',
    sortOrder: 11,
  },
  {
    code: 'FIN-02',
    nameAr: 'أعمال المعجون',
    nameEn: 'Wall Putty & Primer',
    category: 'FINISHING',
    subCategory: 'لياسة ودهانات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 20,
    descriptionAr: 'تجهيز وتنعيم الأسطح بثلاث طبقات معجون داخلي مع الصنفرة وطبقة أساس مائي (برايمر) عالي الالتصاق.',
    descriptionEn: 'Surface preparation with three coats of interior wall putty, smooth sanding and high-adhesion water primer.',
    sortOrder: 12,
  },
  {
    code: 'FIN-03',
    nameAr: 'أعمال الدهانات الداخلية',
    nameEn: 'Interior Painting Works',
    category: 'FINISHING',
    subCategory: 'لياسة ودهانات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 40,
    descriptionAr: 'دهانات بلاستيكية داخلية معتمدة (جوتن / الجزيرة) وجهين نهائيين قابلة للغسيل ومقاومة للبكتيريا والعفن.',
    descriptionEn: 'Interior emulsion painting (Jotun/Jazeera approved) 2 finish coats, washable and anti-bacterial.',
    sortOrder: 13,
  },
  {
    code: 'FIN-04',
    nameAr: 'أعمال الدهانات الخارجية',
    nameEn: 'Exterior Textured Painting (Profile)',
    category: 'FINISHING',
    subCategory: 'لياسة ودهانات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 55,
    descriptionAr: 'دهانات بروفايل خارجية مقاومة للعوامل الجوية والأشعة فوق البنفسجية سماكة 2-3 ملم شاملة الأساس والتشطيب.',
    descriptionEn: 'Exterior decorative profile texture painting UV-resistant and weatherproof 2-3mm thickness.',
    sortOrder: 14,
  },
  {
    code: 'FIN-05',
    nameAr: 'تركيب السيراميك',
    nameEn: 'Ceramic Tile Installation',
    category: 'FINISHING',
    subCategory: 'أرضيات وتكسيات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 60,
    descriptionAr: 'توريد وتركيب سيراميك للأرضيات والجدران بالمونة الإسمنتية أو الغراء المعتمد شامل الترويبة الإيبوكسية المانعة للبكتيريا.',
    descriptionEn: 'Floor and wall ceramic tiling using cement mortar or approved tile adhesive with epoxy waterproof grouting.',
    sortOrder: 15,
  },
  {
    code: 'FIN-06',
    nameAr: 'تركيب البورسلان',
    nameEn: 'Porcelain Tile Installation',
    category: 'FINISHING',
    subCategory: 'أرضيات وتكسيات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 80,
    descriptionAr: 'تركيب بورسلان ليزري قص عالي الدقة بمادة لاصقة مخصصة مع أنظمة فواصل التسوية والتسوية التامة والترويبة.',
    descriptionEn: 'Laser-cut porcelain tile installation using specialized adhesive with leveling spacers and precision grouting.',
    sortOrder: 16,
  },
  {
    code: 'FIN-07',
    nameAr: 'تركيب الرخام',
    nameEn: 'Marble Flooring & Cladding',
    category: 'FINISHING',
    subCategory: 'أرضيات وتكسيات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 160,
    descriptionAr: 'تركيب رخام طبيعي للأرضيات والدرج والمداخل شامل الصب والغراء والجلي والتلميع الميكانيكي بأحجار الألماس.',
    descriptionEn: 'Natural marble installation for floors, stairs and entrances including mortar bed, diamond polishing and crystallization.',
    sortOrder: 17,
  },
  {
    code: 'FIN-08',
    nameAr: 'أعمال الجبس بورد',
    nameEn: 'Gypsum Board Ceilings',
    category: 'FINISHING',
    subCategory: 'أسقف وديكورات',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 75,
    descriptionAr: 'توريد وتركيب أسقف جبس بورد عادي ومقاوم للرطوبة مع الشاسيهات المعدنية المجلفنة ومعالجة الفواصل بالشاش والمعجون.',
    descriptionEn: 'Supply & installation of regular/MR gypsum board ceilings on galvanized steel suspension with taped joints.',
    sortOrder: 18,
  },
  {
    code: 'FIN-09',
    nameAr: 'تركيب الأبواب',
    nameEn: 'Door Supply & Installation',
    category: 'FINISHING',
    subCategory: 'فتحات وأبواب',
    unitCode: 'PCS',
    unitSymbol: 'قطعة',
    unitEn: 'pc',
    defaultPrice: 450,
    descriptionAr: 'تركيب أبواب خشبية كبس حراري WPC أو خشب سويدي مع الحلق والبراويز والمفصلات والكوالين الألمانية المقاومة للرطوبة.',
    descriptionEn: 'WPC/engineered wood door installation complete with sub-frame, architraves, heavy-duty hinges and German lockset.',
    sortOrder: 19,
  },
  {
    code: 'FIN-10',
    nameAr: 'تركيب النوافذ والألمنيوم',
    nameEn: 'Aluminum Windows Installation',
    category: 'FINISHING',
    subCategory: 'فتحات وأبواب',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 380,
    descriptionAr: 'توريد وتركيب قطاعات ألمنيوم دبل جلاس عازل للصوت والحرارة مع إكسسوارات إيطالية وسيليكون إنشائي مانع للتسرب.',
    descriptionEn: 'Double glazed thermal & sound insulated aluminum windows installation with Italian hardware and structural sealant.',
    sortOrder: 20,
  },

  // ─── ثالثاً: الأعمال الكهربائية ──────────────────────────────────
  {
    code: 'ELE-01',
    nameAr: 'تمديدات كهربائية',
    nameEn: 'Electrical Wiring & Conduiting',
    category: 'ELECTRICAL',
    subCategory: 'شبكات وتمديدات',
    unitCode: 'LM',
    unitSymbol: 'م.ط',
    unitEn: 'lm',
    defaultPrice: 45,
    descriptionAr: 'تمديد مواسير PVC وأسلاك نحاسية معتمدة (الفنار / الرياض) داخل الجدران والأسقف مع علب السحب والتجميع.',
    descriptionEn: 'Installation of heavy duty PVC conduits, fire-rated copper wiring (Alfanar/Riyadh) and junction pull boxes.',
    sortOrder: 21,
  },
  {
    code: 'ELE-02',
    nameAr: 'تركيب لوحات التوزيع',
    nameEn: 'Distribution Boards (MDB/SMDB)',
    category: 'ELECTRICAL',
    subCategory: 'لوحات وتحكم',
    unitCode: 'PCS',
    unitSymbol: 'قطعة',
    unitEn: 'pc',
    defaultPrice: 850,
    descriptionAr: 'توريد وتركيب لوحات توزيع كهربائية رئيسية وفرعية بقواطع أوتوماتيكية معتمدة وتأريض قياسي ووسم الدوائر.',
    descriptionEn: 'Supply and installation of main/sub distribution boards with MCBs, ELCBs, grounding bar and circuit labeling.',
    sortOrder: 22,
  },
  {
    code: 'ELE-03',
    nameAr: 'تركيب المفاتيح والأفياش',
    nameEn: 'Switches & Sockets Installation',
    category: 'ELECTRICAL',
    subCategory: 'تجهيزات نهائية',
    unitCode: 'POINT',
    unitSymbol: 'نقطة',
    unitEn: 'pt',
    defaultPrice: 35,
    descriptionAr: 'تركيب مفاتيح إضاءة وأفياش كهربائية ثلاثية 13/16 أمبير معتمدة تشمل التوصيل والاختبار وضمان الجودة.',
    descriptionEn: 'Installation of standard 13A/16A grounded switched sockets, light switches and faceplates with continuity testing.',
    sortOrder: 23,
  },
  {
    code: 'ELE-04',
    nameAr: 'تركيب وحدات الإنارة',
    nameEn: 'Lighting Fixtures & LED',
    category: 'ELECTRICAL',
    subCategory: 'تجهيزات نهائية',
    unitCode: 'POINT',
    unitSymbol: 'نقطة',
    unitEn: 'pt',
    defaultPrice: 65,
    descriptionAr: 'تركيب كشافات سبوت لايت، إنارة مخفية LED، ونجف بالسقف الجبسي مع التوصيل والمحولات الإلكترونية.',
    descriptionEn: 'Installation of LED downlights, cove light strips, spotlights and ceiling fixtures with transformers and testing.',
    sortOrder: 24,
  },
  {
    code: 'ELE-05',
    nameAr: 'تمديدات أنظمة التيار الخفيف',
    nameEn: 'Low Current Systems (CCTV & Data)',
    category: 'ELECTRICAL',
    subCategory: 'شبكات وتمديدات',
    unitCode: 'LM',
    unitSymbol: 'م.ط',
    unitEn: 'lm',
    defaultPrice: 30,
    descriptionAr: 'تمديدات كابلات الشبكات CAT6، كاميرات المراقبة، وأجهزة الإنتركوم الصوتي والمرئي وأنظمة الصوتيات المركزية.',
    descriptionEn: 'Low current structured cabling installation: CAT6 data network, IP CCTV security wiring and intercom systems.',
    sortOrder: 25,
  },

  // ─── رابعاً: الأعمال الميكانيكية والسباكة ───────────────────────
  {
    code: 'MEP-01',
    nameAr: 'تمديدات المياه',
    nameEn: 'PPR Water Supply Piping',
    category: 'PLUMBING_HVAC',
    subCategory: 'سباكة وتغذية',
    unitCode: 'LM',
    unitSymbol: 'م.ط',
    unitEn: 'lm',
    defaultPrice: 55,
    descriptionAr: 'تمديد شبكات تغذية المياه بأنابيب حرارية خضراء PPR معتمدة مع لحام حراري واختبار ضغط هيدروليكي 16 بار.',
    descriptionEn: 'PPR hot & cold water supply piping with thermo-fusion welded fittings and 16 bar hydraulic pressure testing.',
    sortOrder: 26,
  },
  {
    code: 'MEP-02',
    nameAr: 'تمديدات الصرف الصحي',
    nameEn: 'UPVC Drainage & Sewer Piping',
    category: 'PLUMBING_HVAC',
    subCategory: 'سباكة وتغذية',
    unitCode: 'LM',
    unitSymbol: 'م.ط',
    unitEn: 'lm',
    defaultPrice: 70,
    descriptionAr: 'تمديد أنابيب الصرف الصحي ومياه الأمطار UPVC ضغط عالي مع مخارج التهوية وغرف التفتيش وميول الصرف القياسية.',
    descriptionEn: 'UPVC heavy-duty sanitary drainage and rainwater piping with ventilation stacks, cleanouts and inspection chambers.',
    sortOrder: 27,
  },
  {
    code: 'MEP-03',
    nameAr: 'تركيب الأدوات الصحية',
    nameEn: 'Sanitary Ware Installation',
    category: 'PLUMBING_HVAC',
    subCategory: 'أجهزة وتجهيزات',
    unitCode: 'SET',
    unitSymbol: 'طقم',
    unitEn: 'set',
    defaultPrice: 350,
    descriptionAr: 'تركيب مغاسل، كراسي إفرنجية معلقة، شطافات وخلاطات مياه مع المحابس وإكسسوارات التثبيت واختبار مانع التسرب.',
    descriptionEn: 'Complete installation of wall-hung WC, washbasins, mixers, angle valves, bidet sprays and sealing accessories.',
    sortOrder: 28,
  },
  {
    code: 'MEP-04',
    nameAr: 'تركيب وحدات التكييف',
    nameEn: 'HVAC Split & Package Installation',
    category: 'PLUMBING_HVAC',
    subCategory: 'أجهزة وتجهيزات',
    unitCode: 'PCS',
    unitSymbol: 'قطعة',
    unitEn: 'pc',
    defaultPrice: 600,
    descriptionAr: 'تركيب وحدات تكييف سبليت ومخفي (كونسيلد) تشمل مواسير النحاس المعزولة وتصريف المتكاثف وشحن الغاز والتشغيل التجريبي.',
    descriptionEn: 'Installation of split and ducted concealed AC units including insulated copper lines, condensate drain and gas charge.',
    sortOrder: 29,
  },
  {
    code: 'MEP-05',
    nameAr: 'أعمال مكافحة الحريق',
    nameEn: 'Fire Fighting Piping & Sprinklers',
    category: 'PLUMBING_HVAC',
    subCategory: 'سلامة وإطفاء',
    unitCode: 'POINT',
    unitSymbol: 'نقطة',
    unitEn: 'pt',
    defaultPrice: 220,
    descriptionAr: 'تركيب شبكة رشاشات ميكانيكية وصناديق حريق حديد سيملس وفق كود البناء السعودي واشتراطات الدفاع المدني.',
    descriptionEn: 'Fire sprinkler and hose reel system piping installation using seamless black steel pipes per SBC fire safety standards.',
    sortOrder: 30,
  },

  // ─── خامساً: أعمال الصيانة ────────────────────────────────────
  {
    code: 'MNT-01',
    nameAr: 'صيانة كهربائية',
    nameEn: 'Electrical Preventative Maintenance',
    category: 'MAINTENANCE',
    subCategory: 'صيانة كهروميكانيكية',
    unitCode: 'LUMP_SUM',
    unitSymbol: 'مقطوعية',
    unitEn: 'LS',
    defaultPrice: 300,
    descriptionAr: 'فحص واستبدال القواطع المعطلة، موازنة الأحمال الكهربائية، فحص العوازل واختبار دوائر الحماية والتأريض.',
    descriptionEn: 'Comprehensive electrical inspection, breaker replacement, thermal imaging, load balancing and earthing check.',
    sortOrder: 31,
  },
  {
    code: 'MNT-02',
    nameAr: 'صيانة السباكة',
    nameEn: 'Plumbing Maintenance & Repair',
    category: 'MAINTENANCE',
    subCategory: 'صيانة كهروميكانيكية',
    unitCode: 'LUMP_SUM',
    unitSymbol: 'مقطوعية',
    unitEn: 'LS',
    defaultPrice: 250,
    descriptionAr: 'صيانة وتغيير المحابس والخلاطات، تسليك شبكات الصرف الصحي، فحص مضخات الرفع والعوامات وخزانات المياه.',
    descriptionEn: 'Plumbing fixture repairs, drain unclogging, booster pump servicing, float valve replacement and tank inspection.',
    sortOrder: 32,
  },
  {
    code: 'MNT-03',
    nameAr: 'صيانة التكييف',
    nameEn: 'HVAC Routine Service & Filter Cleaning',
    category: 'MAINTENANCE',
    subCategory: 'صيانة كهروميكانيكية',
    unitCode: 'PCS',
    unitSymbol: 'قطعة',
    unitEn: 'pc',
    defaultPrice: 180,
    descriptionAr: 'تنظيف الفلاتر والمكثفات بالضغط العالي، قياس ضغط غاز الفريون، فحص كفاءة الكمبروسر وتنظيف خطوط التصريف.',
    descriptionEn: 'High-pressure chemical coil washing, air filter cleaning, freon pressure top-up and compressor amp testing.',
    sortOrder: 33,
  },
  {
    code: 'MNT-04',
    nameAr: 'معالجة تسربات المياه',
    nameEn: 'Water Leak Detection & Repair',
    category: 'MAINTENANCE',
    subCategory: 'عزل وترميم',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 120,
    descriptionAr: 'كشف إلكتروني لتسربات المياه مع حقن فواصل التمدد ومعالجة العوازل المتضررة بمواد إسمنتية بوليمرية عازلة.',
    descriptionEn: 'Acoustic/infrared leak detection, epoxy injection of cracks and polymeric waterproof re-coating of damaged zones.',
    sortOrder: 34,
  },
  {
    code: 'MNT-05',
    nameAr: 'أعمال الترميم',
    nameEn: 'Structural Renovation & Strengthening',
    category: 'MAINTENANCE',
    subCategory: 'عزل وترميم',
    unitCode: 'LUMP_SUM',
    unitSymbol: 'مقطوعية',
    unitEn: 'LS',
    defaultPrice: 5000,
    descriptionAr: 'ترميم ومعالجة تشققات الخرسانات، تقشير الصدأ ودهان الحديد بمواد إيبوكسية مانعة للتآكل مع التدعيم الإنشائي بالكربون فايبر.',
    descriptionEn: 'Structural concrete crack repair, rebar rust passivation with zinc primer, non-shrink mortar and carbon fiber reinforcement.',
    sortOrder: 35,
  },
  {
    code: 'MNT-06',
    nameAr: 'صيانة الدهانات والتشطيبات',
    nameEn: 'Finish & Paint Touch-up Services',
    category: 'MAINTENANCE',
    subCategory: 'عزل وترميم',
    unitCode: 'SQM',
    unitSymbol: 'م²',
    unitEn: 'm²',
    defaultPrice: 30,
    descriptionAr: 'إزالة طبقات الدهان المقشر، معالجة الرطوبة والملوحة وإعادة التأسيس بالمعجون والدهان بدرجة اللون المطابقة.',
    descriptionEn: 'Peeling paint removal, salt and dampness treatment, surface re-puttying and matching color topcoat application.',
    sortOrder: 36,
  },
];

async function seedDatabase(prismaInstance, targetName) {
  console.log(`\n=== Seeding Work Items Library on ${targetName} ===`);

  // 1. Ensure all Units of Measure exist
  console.log('Syncing Units of Measure...');
  const unitMap = {};
  for (const u of STANDARD_UNITS) {
    let existingUom = await prismaInstance.unitOfMeasure.findFirst({
      where: {
        organizationId: ORG_ID,
        OR: [{ code: u.code }, { symbolAr: u.symbolAr }],
      },
    });

    if (!existingUom) {
      existingUom = await prismaInstance.unitOfMeasure.create({
        data: {
          organizationId: ORG_ID,
          code: u.code,
          nameAr: u.nameAr,
          nameEn: u.nameEn,
          symbolAr: u.symbolAr,
          symbolEn: u.symbolEn,
          category: u.category,
          isDefault: u.isDefault,
          sortOrder: u.sortOrder,
        },
      });
      console.log(`  + Created UoM: ${u.nameAr} (${u.symbolAr})`);
    }
    unitMap[u.code] = existingUom.id;
    unitMap[u.symbolAr] = existingUom.id;
  }

  // 2. Upsert the 36 Work Items
  console.log(`Upserting ${WORK_ITEMS_36.length} Work Items...`);
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of WORK_ITEMS_36) {
    const uomId = unitMap[item.unitCode] || unitMap[item.unitSymbol] || null;

    // Check by code or nameAr
    const existing = await prismaInstance.workItemTemplate.findFirst({
      where: {
        organizationId: ORG_ID,
        OR: [{ code: item.code }, { nameAr: item.nameAr }],
      },
    });

    if (existing) {
      await prismaInstance.workItemTemplate.update({
        where: { id: existing.id },
        data: {
          code: item.code,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          category: item.category,
          subCategory: item.subCategory,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          unit: item.unitSymbol,
          unitEn: item.unitEn,
          unitOfMeasureId: uomId,
          defaultPrice: item.defaultPrice,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      await prismaInstance.workItemTemplate.create({
        data: {
          organizationId: ORG_ID,
          code: item.code,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          category: item.category,
          subCategory: item.subCategory,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          unit: item.unitSymbol,
          unitEn: item.unitEn,
          unitOfMeasureId: uomId,
          defaultPrice: item.defaultPrice,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
      createdCount++;
    }
  }

  console.log(`✅ ${targetName}: ${createdCount} created, ${updatedCount} updated. Total active items: ${createdCount + updatedCount}`);
}

async function main() {
  // 1. Supabase Production
  const supabaseUrl = 'postgresql://postgres.izorqftbziirdorrqgjj:Mu7ammed%40010@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=30';
  const supaPrisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });
  try {
    await seedDatabase(supaPrisma, 'Supabase Production');
  } finally {
    await supaPrisma.$disconnect();
  }

  // 2. Localhost PGlite
  const localEnv = require('dotenv').parse(fs.readFileSync(path.join(__dirname, '../.env')));
  const localPrisma = new PrismaClient({ datasources: { db: { url: localEnv.DATABASE_URL } } });
  try {
    await seedDatabase(localPrisma, 'Localhost PGlite');
  } catch (err) {
    console.log('Local DB note:', err.message);
  } finally {
    await localPrisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Fatal seeding error:', e);
  process.exit(1);
});
