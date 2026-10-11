/* Standart mashqlar kutubxonasi va 6 kunlik PPL dasturi.
   type: 'w' = vazn × takror, 'bw' = o‘z vazni (+kg) × takror, 't' = vaqt (unit: daq | s).
   en / ru — YouTube'da texnika videosini qidirish uchun. */

window.GROUPS = [
  ['razminka', 'Razminka'],
  ['kokrak', 'Ko‘krak'],
  ['orqa', 'Orqa'],
  ['yelka', 'Yelka'],
  ['biceps', 'Biceps'],
  ['triceps', 'Triceps'],
  ['oyoq', 'Oyoq'],
  ['boldir', 'Boldir'],
  ['press', 'Press'],
  ['kardio', 'Kardio'],
];

window.DEFAULT_EXERCISES = {
  // Razminka / kardio
  warmup: { name: 'Razminka', group: 'razminka', type: 't', unit: 'daq', en: 'gym warm up routine before workout', ru: 'разминка перед тренировкой в зале', video: 'https://youtu.be/CjYHKWwHJlk',
    cue: '5 daqiqa yengil kardio, bo‘g‘imlarni aylantirish, keyin birinchi mashqdan 2 ta yengil podxod.' },
  stretch: { name: 'Cho‘zilish (stretching)', group: 'razminka', type: 't', unit: 'daq', en: 'post workout stretching routine', ru: 'растяжка после тренировки', video: 'https://youtu.be/sGdRJxUdPN8',
    cue: 'Har bir mushakda 30–40 soniya, og‘riqsiz. Nafasni ushlamang.' },
  cardio: { name: 'Kardio (yo‘lakcha / velo)', group: 'kardio', type: 't', unit: 'daq', en: 'incline treadmill walk', ru: 'кардио на беговой дорожке в гору', video: 'https://youtu.be/rMxxdKTlB18',
    cue: 'Puls 120–140 atrofida — gaplasha oladigan tezlikda. Yog‘ yoqish va yurak uchun.' },

  // Ko‘krak
  bench: { name: 'Shtanga jimi (gorizontal)', group: 'kokrak', type: 'w', en: 'barbell bench press', ru: 'жим штанги лежа техника', video: 'https://youtu.be/gRVjAtPip0Y',
    cue: 'Kuraklarni yig‘ib pastga tushiring, oyoqlar polda. Shtanga ko‘krakning pastki qismiga, tirsaklar ~45°.' },
  incline_bb: { name: 'Qiya skameykada shtanga jimi', group: 'kokrak', type: 'w', en: 'incline barbell bench press', ru: 'жим штанги на наклонной скамье', video: 'https://youtu.be/DbFgADa2PL8',
    cue: 'Skameyka 30°. Shtanga o‘mrov ostiga tushadi, belni ortiqcha egmang.' },
  incline_db: { name: 'Qiya skameykada gantel jimi', group: 'kokrak', type: 'w', en: 'incline dumbbell press', ru: 'жим гантелей на наклонной скамье', video: 'https://youtu.be/8iPEnn-ltC8',
    cue: 'Skameyka 30°. Pastda to‘liq cho‘zilish, yuqorida gantellarni urishtirmang.' },
  db_press: { name: 'Gantel jimi (gorizontal)', group: 'kokrak', type: 'w', en: 'dumbbell bench press', ru: 'жим гантелей лежа', video: 'https://youtu.be/VmB1G1K7v94',
    cue: 'Kuraklar yig‘ilgan, gantellar ko‘krak chizig‘ida, sekin tushiring (2–3 soniya).' },
  machine_press: { name: 'Trenajyorda ko‘krak jimi', group: 'kokrak', type: 'w', en: 'machine chest press', ru: 'жим в тренажере сидя', video: 'https://youtu.be/xUm0BiZCWlQ',
    cue: 'Tutqichlar ko‘krak o‘rtasi balandligida, yelkalar orqaga yig‘ilgan.' },
  dips: { name: 'Brusya', group: 'kokrak', type: 'bw', en: 'chest dips', ru: 'отжимания на брусьях на грудь', video: 'https://youtu.be/dX_nSOOJIsE',
    cue: 'Biroz oldinga engashing — ko‘krak ishlaydi. Yelka og‘risa chuqur tushmang.' },
  cable_fly: { name: 'Krossover (kabel)', group: 'kokrak', type: 'w', en: 'cable crossover', ru: 'сведение рук в кроссовере', video: 'https://youtu.be/taI4XduLpTk',
    cue: 'Tirsaklar biroz bukilgan va qotgan, qo‘llar yoy bo‘ylab yuradi, oxirida 1 soniya siqing.' },
  pec_deck: { name: 'Pek-dek (butterfly)', group: 'kokrak', type: 'w', en: 'pec deck fly', ru: 'бабочка в тренажере', video: 'https://youtu.be/H4mVGHaK2f4',
    cue: 'Ko‘krakni oldinga chiqaring, yelkalar pastda. Sekin qaytaring.' },

  // Orqa
  deadlift: { name: 'O‘lik tortish (deadlift)', group: 'orqa', type: 'w', en: 'conventional deadlift', ru: 'становая тяга техника', video: 'https://youtu.be/WFUOtnI1jwk',
    cue: 'Shtanga oyoq o‘rtasi ustida, bel to‘g‘ri. Nafas olib qorinni qotiring, polni oyoq bilan itaring.' },
  pullup: { name: 'Turnik (tortilish)', group: 'orqa', type: 'bw', en: 'pull ups', ru: 'подтягивания техника', video: 'https://youtu.be/XB_7En-zf_M',
    cue: 'To‘liq osilishdan boshlang, ko‘krakni turnikka torting, siltanmang.' },
  bb_row: { name: 'Egilib shtanga tortish', group: 'orqa', type: 'w', en: 'barbell row', ru: 'тяга штанги в наклоне', video: 'https://youtu.be/9efgcAjQe7E',
    cue: 'Gavda ~45°, bel to‘g‘ri. Shtangani qorin pastiga torting, tirsaklar orqaga.' },
  tbar: { name: 'T-shtanga tortish', group: 'orqa', type: 'w', en: 't bar row', ru: 'тяга т-грифа', video: 'https://youtu.be/j3Igk5nyZE4',
    cue: 'Ko‘krak ochiq, kuraklarni oxirida yig‘ing. Gavda bilan siltamang.' },
  lat_pd: { name: 'Yuqori blok tortish', group: 'orqa', type: 'w', en: 'lat pulldown', ru: 'тяга верхнего блока', video: 'https://youtu.be/AOpi-p0cJkc',
    cue: 'Tutqichni ko‘krak yuqorisiga, tirsaklarni pastga va orqaga yo‘naltiring.' },
  cable_row: { name: 'O‘tirib blok tortish', group: 'orqa', type: 'w', en: 'seated cable row', ru: 'тяга горизонтального блока', video: 'https://youtu.be/GZbfZ033f74',
    cue: 'Kuraklarni orqaga yig‘ing, gavda deyarli qimirlamasin.' },
  db_row: { name: 'Bir qo‘lda gantel tortish', group: 'orqa', type: 'w', en: 'single arm dumbbell row', ru: 'тяга гантели одной рукой', video: 'https://youtu.be/DMo3HJoawrU',
    cue: 'Gantelni son yoniga torting, gavdani burmang.' },
  straight_pd: { name: 'To‘g‘ri qo‘lda pastga tortish', group: 'orqa', type: 'w', en: 'straight arm pulldown', ru: 'пуловер в кроссовере прямыми руками', video: 'https://youtu.be/G9uNaXGTJ4w',
    cue: 'Qo‘llar deyarli to‘g‘ri, harakat faqat yelkada — keng mushakni his qiling.' },
  shrug: { name: 'Shrag (yelka qisish)', group: 'orqa', type: 'w', en: 'dumbbell shrugs', ru: 'шраги с гантелями', video: 'https://youtu.be/cJRVVxmytaM',
    cue: 'Yelkalarni to‘g‘ri yuqoriga, aylantirmang. Yuqorida 1 soniya ushlang.' },

  // Yelka
  ohp: { name: 'Turib shtanga yuqoriga (armiya jimi)', group: 'yelka', type: 'w', en: 'overhead press', ru: 'армейский жим стоя', video: 'https://youtu.be/2yjwXTZQDDI',
    cue: 'Dumba va qorin qotgan. Shtanga yuz oldidan to‘g‘ri yuqoriga, boshni oldinga chiqaring.' },
  db_shoulder: { name: 'O‘tirib gantel yuqoriga', group: 'yelka', type: 'w', en: 'seated dumbbell shoulder press', ru: 'жим гантелей сидя на плечи', video: 'https://youtu.be/qEwKCR5JCog',
    cue: 'Skameyka 80–90°, gantellar quloq balandligigacha tushadi.' },
  lateral: { name: 'Gantel yonga ko‘tarish', group: 'yelka', type: 'w', en: 'dumbbell lateral raise', ru: 'махи гантелями в стороны', video: 'https://youtu.be/pgrWjBfaFe8',
    cue: 'Tirsak biroz bukilgan, yelka balandligigacha. Trapetsiya bilan ko‘tarmang, sekin tushiring.' },
  cable_lateral: { name: 'Kabelda yonga ko‘tarish', group: 'yelka', type: 'w', en: 'cable lateral raise', ru: 'махи в кроссовере в сторону', video: 'https://youtu.be/qitQHqNZbeM',
    cue: 'Bir qo‘lda, kabel tana oldidan o‘tadi. Pastda ham taranglik saqlanadi.' },
  rear_delt: { name: 'Orqa delta (reverse fly)', group: 'yelka', type: 'w', en: 'reverse pec deck', ru: 'обратная бабочка задняя дельта', video: 'https://youtu.be/dC7jhEk-29A',
    cue: 'Kichik vazn, qo‘llar keng yoy bo‘ylab orqaga. Kuraklarni ortiqcha yig‘mang.' },
  face_pull: { name: 'Face pull', group: 'yelka', type: 'w', en: 'face pull', ru: 'тяга каната к лицу фейс пул', video: 'https://youtu.be/rep-qVOkqgk',
    cue: 'Arqonni yuz tomonga, oxirida qo‘llarni ikki tomonga ajrating. Yelka sog‘lig‘i uchun.' },

  // Biceps
  bb_curl: { name: 'Shtanga bilan biceps', group: 'biceps', type: 'w', en: 'barbell curl', ru: 'подъем штанги на бицепс', video: 'https://youtu.be/kwG2ipFRgfo',
    cue: 'Tirsaklar gavda yonida qotgan, siltamang. Pastda to‘liq yoying.' },
  hammer: { name: 'Bolg‘a (hammer curl)', group: 'biceps', type: 'w', en: 'hammer curl', ru: 'молотки с гантелями', video: 'https://youtu.be/zC3nLlEvin4',
    cue: 'Kaftlar bir-biriga qaragan, navbatma-navbat yoki birga.' },
  incline_curl: { name: 'Qiya skameykada gantel biceps', group: 'biceps', type: 'w', en: 'incline dumbbell curl', ru: 'сгибания с гантелями на наклонной скамье', video: 'https://youtu.be/soxrZlIl35U',
    cue: 'Skameyka 45–60°, qo‘llar orqaga osilib turadi — biceps cho‘zilgan holatdan ishlaydi.' },
  preacher: { name: 'Skott skameykasida biceps', group: 'biceps', type: 'w', en: 'preacher curl', ru: 'сгибания на скамье скотта', video: 'https://youtu.be/fIWP-FRFNU0',
    cue: 'Pastda to‘liq yoymay, 2–3 soniyada sekin tushiring.' },

  // Triceps
  pushdown: { name: 'Blokda triceps (pastga)', group: 'triceps', type: 'w', en: 'triceps rope pushdown', ru: 'разгибания на блоке трицепс', video: 'https://youtu.be/-xa-6cQaZKY',
    cue: 'Tirsaklar yonda qotgan, pastda to‘liq yoying va arqonni ajrating.' },
  oh_ext: { name: 'Bosh ortidan triceps', group: 'triceps', type: 'w', en: 'overhead cable triceps extension', ru: 'разгибание рук из-за головы', video: 'https://youtu.be/GzmlxvSFE7A',
    cue: 'Tirsaklar oldinga qaragan, triceps cho‘zilgan holatda ishlaydi.' },
  skull: { name: 'Fransuz jimi (skull crusher)', group: 'triceps', type: 'w', en: 'ez bar skull crusher', ru: 'французский жим лежа', video: 'https://youtu.be/d_KZxkY_0cM',
    cue: 'Shtanga peshona / bosh ortiga tushadi, tirsaklar tarqalmasin.' },
  cgbp: { name: 'Tor ushlab jim', group: 'triceps', type: 'w', en: 'close grip bench press', ru: 'жим узким хватом', video: 'https://youtu.be/nEF0bv2FW94',
    cue: 'Ushlash yelka kengligida, tirsaklar gavdaga yaqin.' },

  // Oyoq
  squat: { name: 'Shtanga bilan o‘tirib-turish (squat)', group: 'oyoq', type: 'w', en: 'barbell back squat', ru: 'приседания со штангой техника', video: 'https://youtu.be/SW_C1A-rejs',
    cue: 'Oyoq yelka kengligida, tizzalar oyoq uchi yo‘nalishida. Kamida parallelgacha, bel neytral.' },
  hack: { name: 'Gakk-o‘tirish (hack squat)', group: 'oyoq', type: 'w', en: 'hack squat', ru: 'гакк приседания', video: 'https://youtu.be/rYgNArpwE7E',
    cue: 'Bel suyanchiqqa yopishgan, chuqur tushing, tovonlardan itaring.' },
  rdl: { name: 'Rumin o‘lik tortishi (RDL)', group: 'oyoq', type: 'w', en: 'romanian deadlift', ru: 'румынская тяга', video: 'https://youtu.be/2SHsk9AzdjA',
    cue: 'Tizza biroz bukilgan, sonni orqaga itaring, shtanga oyoqqa yaqin. Son orqasida cho‘zilish.' },
  leg_press: { name: 'Leg press (oyoq jimi)', group: 'oyoq', type: 'w', en: 'leg press', ru: 'жим ногами', video: 'https://youtu.be/K5n2vg3oZa4',
    cue: 'Bel o‘rindiqdan ko‘tarilmasin, tepada tizzani to‘liq qulflamang.' },
  lunge: { name: 'Yurib hamla (lunge)', group: 'oyoq', type: 'w', en: 'dumbbell walking lunges', ru: 'выпады с гантелями в ходьбе', video: 'https://youtu.be/D7KaRcUTQeE',
    cue: 'Takror — har oyoqqa. Orqa tizza polga deyarli tegadi, gavda tik.' },
  bulgarian: { name: 'Bolgar o‘tirishi', group: 'oyoq', type: 'w', en: 'bulgarian split squat', ru: 'болгарские выпады', video: 'https://youtu.be/2C-uNgKwPLE',
    cue: 'Orqa oyoq skameykada. Takror — har oyoqqa. Biroz oldinga engashsangiz dumba ko‘proq ishlaydi.' },
  leg_curl: { name: 'Yotib oyoq bukish', group: 'oyoq', type: 'w', en: 'lying leg curl', ru: 'сгибание ног лежа', video: 'https://youtu.be/1Tq3QdYUuHs',
    cue: 'Tos skameykadan ko‘tarilmasin, sekin tushiring.' },
  seated_curl: { name: 'O‘tirib oyoq bukish', group: 'oyoq', type: 'w', en: 'seated leg curl', ru: 'сгибание ног сидя', video: 'https://youtu.be/ELOCsoDSmrg',
    cue: 'Biroz oldinga engashing — son orqasi ko‘proq cho‘ziladi.' },
  leg_ext: { name: 'Oyoq yoyish (leg extension)', group: 'oyoq', type: 'w', en: 'leg extension', ru: 'разгибание ног в тренажере', video: 'https://youtu.be/YyvSfVjQeL0',
    cue: 'Tepada 1 soniya siqing, siltab ko‘tarmang.' },
  hip_thrust: { name: 'Dumba ko‘prigi (hip thrust)', group: 'oyoq', type: 'w', en: 'barbell hip thrust', ru: 'ягодичный мост со штангой', video: 'https://youtu.be/SEdqd1n0cvg',
    cue: 'Iyak ko‘krakka, tepada tos to‘liq yoyilgan — belni egmang.' },

  // Boldir
  calf_stand: { name: 'Turib boldir', group: 'boldir', type: 'w', en: 'standing calf raise', ru: 'подъем на носки стоя', video: 'https://youtu.be/3UWi44yN-wM',
    cue: 'Pastda 1–2 soniya cho‘zing, tepada siqing. Prujina qilib sakramang.' },
  calf_seat: { name: 'O‘tirib boldir', group: 'boldir', type: 'w', en: 'seated calf raise', ru: 'подъем на носки сидя', video: 'https://youtu.be/6O5hh1rBtx8',
    cue: 'To‘liq amplituda, sekin temp.' },

  // Press
  hlr: { name: 'Osilib oyoq ko‘tarish', group: 'press', type: 'bw', en: 'hanging leg raise', ru: 'подъем ног в висе', video: 'https://youtu.be/hdng3Nm1x_E',
    cue: 'Tosni yuqoriga burang, tebranmang.' },
  cable_crunch: { name: 'Kabelda press (krunch)', group: 'press', type: 'w', en: 'cable crunch', ru: 'скручивания на блоке', video: 'https://youtu.be/ToJeyhydUxU',
    cue: 'Harakat belda emas, qorinda — qovurg‘alarni tosga yaqinlashtiring.' },
  ab_wheel: { name: 'Press roligi', group: 'press', type: 'bw', en: 'ab wheel rollout', ru: 'ролик для пресса', video: 'https://youtu.be/rqiTPdK1c_I',
    cue: 'Bel cho‘kmasin, qorin doim qotgan.' },
  plank: { name: 'Planka', group: 'press', type: 't', unit: 's', en: 'plank proper form', ru: 'планка техника', video: 'https://youtu.be/kL_NJAkCQBg',
    cue: 'Tana to‘g‘ri chiziq, dumba va qorin qotgan.' },
};

/* Dushanba = 0 … Yakshanba = 6. Element: [mashq, podxod, takror (yoki daq/s), dam (s)] */
window.DEFAULT_PROGRAM = [
  { name: 'Push A', title: 'Ko‘krak · Yelka · Triceps (kuch)', items: [
    ['warmup', 1, '10', 0], ['bench', 4, '6-8', 150], ['incline_db', 4, '8-10', 120], ['ohp', 3, '6-8', 120],
    ['dips', 3, '8-12', 90], ['lateral', 4, '12-15', 60], ['cable_fly', 3, '12-15', 60], ['pushdown', 3, '10-12', 60],
    ['oh_ext', 3, '10-12', 60], ['hlr', 3, '12-15', 60], ['cardio', 1, '15', 0],
  ] },
  { name: 'Pull A', title: 'Orqa · Biceps (kuch)', items: [
    ['warmup', 1, '10', 0], ['deadlift', 4, '5', 180], ['pullup', 4, '6-10', 120], ['bb_row', 4, '8-10', 120],
    ['cable_row', 3, '10-12', 90], ['face_pull', 3, '15', 60], ['shrug', 3, '12-15', 60], ['bb_curl', 3, '8-10', 75],
    ['hammer', 3, '10-12', 60], ['plank', 3, '60', 60], ['cardio', 1, '15', 0],
  ] },
  { name: 'Legs A', title: 'Oyoq · Boldir · Press (kuch)', items: [
    ['warmup', 1, '10', 0], ['squat', 4, '6-8', 180], ['rdl', 3, '8-10', 120], ['leg_press', 3, '10-12', 120],
    ['lunge', 3, '12', 90], ['leg_curl', 3, '10-12', 60], ['leg_ext', 3, '12-15', 60], ['calf_stand', 4, '12-15', 60],
    ['cable_crunch', 3, '15', 60], ['cardio', 1, '10', 0],
  ] },
  { name: 'Push B', title: 'Ko‘krak · Yelka · Triceps (hajm)', items: [
    ['warmup', 1, '10', 0], ['incline_bb', 4, '8-10', 120], ['db_press', 3, '10-12', 90], ['db_shoulder', 3, '8-12', 90],
    ['pec_deck', 3, '12-15', 60], ['cable_lateral', 4, '12-15', 60], ['rear_delt', 3, '15', 60], ['cgbp', 3, '8-10', 90],
    ['skull', 3, '10-12', 60], ['ab_wheel', 3, '10-12', 60], ['cardio', 1, '15', 0],
  ] },
  { name: 'Pull B', title: 'Orqa · Biceps (hajm)', items: [
    ['warmup', 1, '10', 0], ['lat_pd', 4, '10-12', 90], ['tbar', 4, '8-10', 120], ['db_row', 3, '10-12', 90],
    ['straight_pd', 3, '12-15', 60], ['face_pull', 3, '15', 60], ['incline_curl', 3, '10-12', 60], ['preacher', 3, '12', 60],
    ['hlr', 3, '12-15', 60], ['cardio', 1, '15', 0],
  ] },
  { name: 'Legs B', title: 'Oyoq · Dumba · Press (hajm)', items: [
    ['warmup', 1, '10', 0], ['hack', 4, '8-10', 150], ['hip_thrust', 4, '8-12', 120], ['bulgarian', 3, '10', 90],
    ['seated_curl', 3, '12-15', 60], ['leg_ext', 3, '12-15', 60], ['calf_seat', 4, '15-20', 60], ['cable_crunch', 3, '15', 60],
    ['plank', 2, '60', 60], ['cardio', 1, '15', 0],
  ] },
  { name: 'Dam olish', title: 'Tiklanish — sayr va cho‘zilish', rest: true, items: [
    ['stretch', 1, '20', 0],
  ] },
];
