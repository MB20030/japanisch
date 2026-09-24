(() => {
  'use strict';

  const alphabet = [
    ['A', 'ei'], ['B', 'bii'], ['C', 'shii'], ['D', 'dii'], ['E', 'ii'], ['F', 'efu'], ['G', 'jii'],
    ['H', 'eichi'], ['I', 'ai'], ['J', 'jei'], ['K', 'kei'], ['L', 'eru'], ['M', 'emu'], ['N', 'enu'],
    ['O', 'oo'], ['P', 'pii'], ['Q', 'kyuu'], ['R', 'aaru'], ['S', 'esu'], ['T', 'tii'], ['U', 'yuu'],
    ['V', 'uii'], ['W', 'daburyu'], ['X', 'ekkusu'], ['Y', 'wai'], ['Z', 'zetto']
  ].map(([letter, reading]) => ({ letter, reading }));

  const questionWords = [
    { romaji: 'doko', kana: 'どこ', meaning: 'wo', note: 'Ort', jp: '事務所は どこですか。', de: 'Wo ist das Büro?' },
    { romaji: 'dochira', kana: 'どちら', meaning: 'wo (höflich) / welches von beiden', note: 'höflicher Ort oder Auswahl aus zwei Dingen', jp: '海と山と どちらが好きですか。', de: 'Was mögen Sie lieber, das Meer oder die Berge?' },
    { romaji: 'doko e', kana: 'どこへ', meaning: 'wohin', note: 'Ziel einer Bewegung', jp: '明日 どこへ行きますか。', de: 'Wohin fahren Sie morgen?' },
    { romaji: 'doko de', kana: 'どこで', meaning: 'wo', note: 'Ort einer Handlung', jp: 'どこで ひるごはんを食べますか。', de: 'Wo essen Sie zu Mittag?' },
    { romaji: 'doko ni', kana: 'どこに', meaning: 'wo', note: 'Ort eines Zustands oder einer Existenz', jp: '本は どこにありますか。', de: 'Wo befindet sich das Buch?' },
    { romaji: 'nan', kana: 'なん', meaning: 'was', note: 'vor です und Zählwörtern oft なん', jp: 'これは なんですか。', de: 'Was ist das?' },
    { romaji: 'nani o', kana: 'なにを', meaning: 'was', note: 'Objekt einer aktiven Handlung', jp: '今日 なにを食べますか。', de: 'Was essen Sie heute?' },
    { romaji: 'nan no', kana: 'なんの', meaning: 'was für ein', note: 'fragt nach Art oder Zugehörigkeit', jp: 'これは なんの本ですか。', de: 'Was für ein Buch ist das?' },
    { romaji: 'nan de', kana: 'なんで', meaning: 'womit / wie', note: 'Mittel oder Art und Weise', jp: 'なんで うちへ帰りますか。', de: 'Womit fahren Sie nach Hause?' },
    { romaji: 'itsu', kana: 'いつ', meaning: 'wann', note: 'Zeitpunkt', jp: 'いつ イタリアへ行きますか。', de: 'Wann fahren Sie nach Italien?' },
    { romaji: 'nan-ji', kana: 'なんじ', meaning: 'wie viel Uhr', note: 'Uhrzeit', jp: '何時に大学へ行きますか。', de: 'Um wie viel Uhr gehen Sie zur Universität?' },
    { romaji: 'nan-nin', kana: 'なんにん', meaning: 'wie viele Personen', note: 'Personenzähler', jp: '庭に子供が何人いますか。', de: 'Wie viele Kinder sind im Garten?' },
    { romaji: 'nan-kai', kana: 'なんかい', meaning: 'wie oft', note: 'Häufigkeit', jp: '一週間に何回テニスをしますか。', de: 'Wie oft pro Woche spielen Sie Tennis?' },
    { romaji: 'dare / donata', kana: 'だれ / どなた', meaning: 'wer / wer (höflich)', note: 'Person', jp: 'あの人は だれですか。', de: 'Wer ist die Person dort drüben?' },
    { romaji: 'dare to', kana: 'だれと', meaning: 'mit wem', note: 'Begleitung', jp: 'だれと映画を見ますか。', de: 'Mit wem schauen Sie den Film an?' },
    { romaji: 'dare no', kana: 'だれの', meaning: 'wessen', note: 'Besitz oder Zugehörigkeit', jp: 'それは だれのボールペンですか。', de: 'Wessen Kugelschreiber ist das?' },
    { romaji: 'dare ni', kana: 'だれに', meaning: 'wem', note: 'Empfänger oder Zielperson', jp: 'だれに花をあげますか。', de: 'Wem schenken Sie Blumen?' },
    { romaji: 'ikura', kana: 'いくら', meaning: 'wie viel', note: 'nur für Kosten und Preise', jp: 'これは いくらですか。', de: 'Wie viel kostet das?' },
    { romaji: 'ikutsu', kana: 'いくつ', meaning: 'wie viele Stück', note: 'allgemeine Stückzahl', jp: 'りんごが いくつありますか。', de: 'Wie viele Äpfel gibt es?' },
    { romaji: 'dō', kana: 'どう', meaning: 'wie', note: 'Zustand oder Situation', jp: '天気は どうですか。', de: 'Wie ist das Wetter?' },
    { romaji: 'donna', kana: 'どんな', meaning: 'was für ein', note: 'Beschreibung eines Nomens', jp: 'ミラーさんは どんな人ですか。', de: 'Was für eine Person ist Herr Miller?' },
    { romaji: 'dōyatte', kana: 'どうやって', meaning: 'wie / auf welche Weise', note: 'Vorgehensweise', jp: 'どうやって駅まで行きますか。', de: 'Wie kommen Sie zum Bahnhof?' },
    { romaji: 'dōshite', kana: 'どうして', meaning: 'warum', note: 'Grund', jp: 'どうして早く帰りますか。', de: 'Warum fahren Sie früher nach Hause?' },
    { romaji: 'donokurai', kana: 'どのくらい', meaning: 'wie lange / wie viel', note: 'Dauer oder ungefähre Menge', jp: '日本語を どのくらい勉強しましたか。', de: 'Wie lange haben Sie Japanisch gelernt?' },
    { romaji: 'dore', kana: 'どれ', meaning: 'welches', note: 'Auswahl aus mehreren Dingen', jp: '安いチョコレートは どれですか。', de: 'Welches ist die billige Schokolade?' }
  ];

  const particles = [
    { romaji: 'wa', kana: 'は', function: 'markiert das Thema und kann einen Kontrast setzen', example: 'ビールは飲みません。', translation: 'Bier trinke ich nicht.' },
    { romaji: 'ga', kana: 'が', function: 'markiert das Subjekt, besonders nach Fragepronomen', example: 'どれがおいしいですか。', translation: 'Welches schmeckt gut?' },
    { romaji: 'mo', kana: 'も', function: 'bedeutet „auch“ und ersetzt dabei oft は, が oder を', example: 'わたしも教師です。', translation: 'Ich bin auch Lehrerin.' },
    { romaji: 'no', kana: 'の', function: 'verbindet Nomen und markiert ein Attribut oder Besitz', example: 'わたしの隣のうちの子供', translation: 'das Kind aus dem Haus neben mir' },
    { romaji: 'o', kana: 'を', function: 'markiert das Akkusativobjekt', example: 'すしを食べます。', translation: 'Ich esse Sushi.' },
    { romaji: 'ni', kana: 'に', function: 'markiert Ort ohne Handlung, Zeit, Richtung, Ziel oder Zweck', example: '五時に食べます。', translation: 'Wir essen um fünf Uhr.' },
    { romaji: 'de', kana: 'で', function: 'markiert Handlungsort, Mittel, Einschränkung oder Ursache', example: '海で泳ぎます。', translation: 'Ich schwimme im Meer.' },
    { romaji: 'e', kana: 'へ', function: 'markiert die Richtung einer Bewegung', example: '先生は東京へ行きました。', translation: 'Die Lehrerin ging nach Tokyo.' },
    { romaji: 'ka', kana: 'か', function: 'markiert eine Frage oder eine Alternative', example: 'おいしいですか。', translation: 'Schmeckt es?' },
    { romaji: 'to', kana: 'と', function: 'verbindet Nomen, markiert Begleitung, Zitat oder Bedingung', example: '友達と会いました。', translation: 'Ich habe meine Freundin getroffen.' },
    { romaji: 'ya', kana: 'や', function: 'verbindet eine unvollständige Aufzählung', example: '本や新聞や雑誌などがあります。', translation: 'Es gibt unter anderem Bücher, Zeitungen und Zeitschriften.' },
    { romaji: 'yo', kana: 'よ', function: 'bekräftigt eine Aussage', example: '行くよ。', translation: 'Ich gehe!' },
    { romaji: 'ne', kana: 'ね', function: 'bedeutet sinngemäß „nicht wahr?“ und bindet den Gesprächspartner ein', example: 'そうですね。', translation: 'Tatsächlich, so ist es, nicht wahr?' }
  ];

  const adjectives = [
    { word: 'muzukashii', type: 'i', meaning: 'schwierig' },
    { word: 'takai', type: 'i', meaning: 'teuer / hoch' },
    { word: 'yasui', type: 'i', meaning: 'billig' },
    { word: 'omoshiroi', type: 'i', meaning: 'interessant' },
    { word: 'yasashii', type: 'i', meaning: 'freundlich' },
    { word: 'kibishii', type: 'i', meaning: 'streng' },
    { word: 'otonashii', type: 'i', meaning: 'artig, brav, ruhig' },
    { word: 'oishii', type: 'i', meaning: 'gut schmeckend' },
    { word: 'mazui', type: 'i', meaning: 'schlecht schmeckend' },
    { word: 'hayai', type: 'i', meaning: 'schnell' },
    { word: 'fukuzatsu', type: 'na', meaning: 'kompliziert' },
    { word: 'kantan', type: 'na', meaning: 'einfach' },
    { word: 'kirei', type: 'na', meaning: 'schön' },
    { word: 'rippa', type: 'na', meaning: 'eindrücklich' },
    { word: 'shizuka', type: 'na', meaning: 'ruhig' },
    { word: 'nigiyaka', type: 'na', meaning: 'belebt' },
    { word: 'shinsetsu', type: 'na', meaning: 'freundlich' },
    { word: 'enerugisshu', type: 'na', meaning: 'tatkräftig' },
    { word: 'odayaka', type: 'na', meaning: 'friedlich, still, ruhig, mild' },
    { word: 'hansamu', type: 'na', meaning: 'gut aussehend (Mann)' },
    { word: 'herushii', type: 'na', meaning: 'gesund (von Esswaren)' }
  ];

  const particleDrills = [
    { prompt: '私は学生___。', de: 'Was mich betrifft: Ich bin Student/in.', answer: 'です', options: ['です', 'を', 'で', 'へ'], explanation: 'Das Thema steht mit は; です schließt den Nominalsatz höflich ab.' },
    { prompt: 'すし___食べます。', de: 'Ich esse Sushi.', answer: 'を', options: ['を', 'に', 'と', 'ね'], explanation: 'Sushi ist das direkte Objekt und erhält を.' },
    { prompt: '海___泳ぎます。', de: 'Ich schwimme im Meer.', answer: 'で', options: ['で', 'に', 'へ', 'の'], explanation: 'Die Handlung findet am Meer statt; der Handlungsort erhält で.' },
    { prompt: '五時___食べます。', de: 'Wir essen um fünf Uhr.', answer: 'に', options: ['に', 'で', 'を', 'や'], explanation: 'Ein genauer Zeitpunkt wird mit に markiert.' },
    { prompt: '先生は東京___行きました。', de: 'Die Lehrerin ging nach Tokyo.', answer: 'へ', options: ['へ', 'を', 'も', 'が'], explanation: 'Die Bewegungsrichtung erhält へ, gesprochen e.' },
    { prompt: 'どれ___おいしいですか。', de: 'Welches schmeckt gut?', answer: 'が', options: ['が', 'は', 'の', 'と'], explanation: 'Nach einem Fragepronomen, das nach dem Subjekt fragt, steht が.' },
    { prompt: '本___新聞___雑誌などがあります。', de: 'Es gibt unter anderem Bücher, Zeitungen und Zeitschriften.', answer: 'や', options: ['や', 'と', 'か', 'よ'], explanation: 'や kennzeichnet eine beispielhafte, unvollständige Aufzählung.' },
    { prompt: 'そうです___。', de: 'So ist es, nicht wahr?', answer: 'ね', options: ['ね', 'よ', 'を', 'へ'], explanation: 'ね sucht Zustimmung und bindet das Gegenüber ein.' }
  ];

  const makeKana = (group, rows) => rows.map(([romaji, hiragana, katakana]) => ({ romaji, hiragana, katakana, group }));
  const kana = [
    ...makeKana('basic', [
      ['a', 'あ', 'ア'], ['i', 'い', 'イ'], ['u', 'う', 'ウ'], ['e', 'え', 'エ'], ['o', 'お', 'オ'],
      ['ka', 'か', 'カ'], ['ki', 'き', 'キ'], ['ku', 'く', 'ク'], ['ke', 'け', 'ケ'], ['ko', 'こ', 'コ'],
      ['sa', 'さ', 'サ'], ['shi', 'し', 'シ'], ['su', 'す', 'ス'], ['se', 'せ', 'セ'], ['so', 'そ', 'ソ'],
      ['ta', 'た', 'タ'], ['chi', 'ち', 'チ'], ['tsu', 'つ', 'ツ'], ['te', 'て', 'テ'], ['to', 'と', 'ト'],
      ['na', 'な', 'ナ'], ['ni', 'に', 'ニ'], ['nu', 'ぬ', 'ヌ'], ['ne', 'ね', 'ネ'], ['no', 'の', 'ノ'],
      ['ha', 'は', 'ハ'], ['hi', 'ひ', 'ヒ'], ['fu', 'ふ', 'フ'], ['he', 'へ', 'ヘ'], ['ho', 'ほ', 'ホ'],
      ['ma', 'ま', 'マ'], ['mi', 'み', 'ミ'], ['mu', 'む', 'ム'], ['me', 'め', 'メ'], ['mo', 'も', 'モ'],
      ['ya', 'や', 'ヤ'], ['yu', 'ゆ', 'ユ'], ['yo', 'よ', 'ヨ'],
      ['ra', 'ら', 'ラ'], ['ri', 'り', 'リ'], ['ru', 'る', 'ル'], ['re', 'れ', 'レ'], ['ro', 'ろ', 'ロ'],
      ['wa', 'わ', 'ワ'], ['wo', 'を', 'ヲ'], ['n', 'ん', 'ン']
    ]),
    ...makeKana('voiced', [
      ['ga', 'が', 'ガ'], ['gi', 'ぎ', 'ギ'], ['gu', 'ぐ', 'グ'], ['ge', 'げ', 'ゲ'], ['go', 'ご', 'ゴ'],
      ['za', 'ざ', 'ザ'], ['ji', 'じ', 'ジ'], ['zu', 'ず', 'ズ'], ['ze', 'ぜ', 'ゼ'], ['zo', 'ぞ', 'ゾ'],
      ['da', 'だ', 'ダ'], ['ji (di)', 'ぢ', 'ヂ'], ['zu (du)', 'づ', 'ヅ'], ['de', 'で', 'デ'], ['do', 'ど', 'ド'],
      ['ba', 'ば', 'バ'], ['bi', 'び', 'ビ'], ['bu', 'ぶ', 'ブ'], ['be', 'べ', 'ベ'], ['bo', 'ぼ', 'ボ'],
      ['pa', 'ぱ', 'パ'], ['pi', 'ぴ', 'ピ'], ['pu', 'ぷ', 'プ'], ['pe', 'ぺ', 'ペ'], ['po', 'ぽ', 'ポ']
    ]),
    ...makeKana('contracted', [
      ['kya', 'きゃ', 'キャ'], ['kyu', 'きゅ', 'キュ'], ['kyo', 'きょ', 'キョ'],
      ['sha', 'しゃ', 'シャ'], ['shu', 'しゅ', 'シュ'], ['sho', 'しょ', 'ショ'],
      ['cha', 'ちゃ', 'チャ'], ['chu', 'ちゅ', 'チュ'], ['cho', 'ちょ', 'チョ'],
      ['nya', 'にゃ', 'ニャ'], ['nyu', 'にゅ', 'ニュ'], ['nyo', 'にょ', 'ニョ'],
      ['hya', 'ひゃ', 'ヒャ'], ['hyu', 'ひゅ', 'ヒュ'], ['hyo', 'ひょ', 'ヒョ'],
      ['mya', 'みゃ', 'ミャ'], ['myu', 'みゅ', 'ミュ'], ['myo', 'みょ', 'ミョ'],
      ['rya', 'りゃ', 'リャ'], ['ryu', 'りゅ', 'リュ'], ['ryo', 'りょ', 'リョ'],
      ['gya', 'ぎゃ', 'ギャ'], ['gyu', 'ぎゅ', 'ギュ'], ['gyo', 'ぎょ', 'ギョ'],
      ['ja', 'じゃ', 'ジャ'], ['ju', 'じゅ', 'ジュ'], ['jo', 'じょ', 'ジョ'],
      ['bya', 'びゃ', 'ビャ'], ['byu', 'びゅ', 'ビュ'], ['byo', 'びょ', 'ビョ'],
      ['pya', 'ぴゃ', 'ピャ'], ['pyu', 'ぴゅ', 'ピュ'], ['pyo', 'ぴょ', 'ピョ']
    ])
  ];

  const kanaReadings = [
    ['かな', 'kana'], ['かんたん', 'kantan'], ['ならへ いきます。', 'nara e ikimasu'],
    ['わたしは のみます。', 'watashi wa nomimasu'], ['ほんを よみます。', 'hon o yomimasu'],
    ['こうこう', 'kōkō'], ['きって', 'kitte'], ['たべます', 'tabemasu'], ['みず', 'mizu'], ['です', 'desu'],
    ['ごご', 'gogo'], ['さんぽ', 'sanpo'], ['とうきょう', 'tōkyō'], ['しゃしん', 'shashin'],
    ['おちゃ', 'ocha'], ['ひゃく', 'hyaku'], ['さんびゃく', 'sanbyaku'], ['りょこう', 'ryokō'],
    ['ざっし', 'zasshi'], ['がっこう', 'gakkō'], ['はな と へび', 'hana to hebi']
  ].map(([kanaText, romaji]) => ({ kana: kanaText, romaji }));

  const kanaRules = [
    { sign: 'は・を・へ', title: 'Partikeln klingen anders', text: 'は wird als Partikel wa, を als o und へ als e gelesen.' },
    { sign: 'う', title: 'Langer Vokal', text: 'Ein う nach einem Vokal verlängert ihn oft: きょうと = Kyōto.' },
    { sign: 'っ', title: 'Kleines tsu', text: 'Das kleine っ verdoppelt den folgenden Konsonanten: きって = kitte.' },
    { sign: '゛ ゜', title: 'Dakuten und Handakuten', text: 'Die Zeichen ゛ und ゜ machen aus k→g, s→z, t→d und h→b/p.' },
    { sign: 'ゃ・ゅ・ょ', title: 'Kombinationslaute', text: 'Kleine ya/yu/yo verbinden sich mit der i-Reihe: きゃ = kya, nicht kiya.' }
  ];

  const minnaLessons = [
    {
      lesson: 1, title: 'Vorstellen & zuordnen', pages: '1–4',
      summary: 'Einfache Nominalsätze mit は und です bilden, verneinen und als Frage formulieren.',
      patterns: [['N1 wa N2 desu', 'N1 ist N2.'], ['N1 wa N2 ja arimasen', 'N1 ist nicht N2.'], ['N1 wa N2 desu ka', 'Ist N1 N2?'], ['N1 mo N2 desu', 'N1 ist auch N2.'], ['N1 no N2', 'N2 von/aus N1']],
      drills: [
        { prompt: 'Watashi ___ gakusei desu.', answer: 'wa', options: ['wa', 'o', 'de', 'e'], explanation: 'Das Satzthema wird mit wa markiert.' },
        { prompt: 'Miraa-san wa kaishain ___ arimasen.', answer: 'ja', options: ['ja', 'mo', 'no', 'ka'], explanation: 'ja arimasen verneint den Nominalsatz höflich.' },
        { prompt: 'Ano kata wa dare desu ___.', answer: 'ka', options: ['ka', 'wa', 'no', 'mo'], explanation: 'ka macht aus der Aussage eine Frage.' },
        { prompt: 'Watashi ___ daigakusei desu.', answer: 'mo', options: ['mo', 'no', 'o', 'ni'], explanation: 'mo bedeutet hier „auch“.' }
      ]
    },
    {
      lesson: 2, title: 'Dinge zeigen & Besitz', pages: '5–8',
      summary: 'Mit kore/sore/are und kono/sono/ano Dinge lokalisieren, benennen und Besitz ausdrücken.',
      patterns: [['kore / sore / are', 'dieses / das / jenes Ding'], ['kono / sono / ano + N', 'dieses / das / jenes Nomen'], ['sō desu', 'Das stimmt.'], ['N1 no N2', 'N2 von N1'], ['dare no', 'wessen']],
      drills: [
        { prompt: '___ wa jisho desu. (dieses Ding)', answer: 'Kore', options: ['Kore', 'Kono', 'Koko', 'Dochira'], explanation: 'kore steht allein und bezeichnet ein Ding nahe beim Sprecher.' },
        { prompt: '___ hon wa watashi no desu. (dieses Buch)', answer: 'Kono', options: ['Kono', 'Kore', 'Sono', 'Sore'], explanation: 'kono steht immer direkt vor einem Nomen.' },
        { prompt: 'Sono kasa wa ___ no desu ka.', answer: 'dare', options: ['dare', 'doko', 'nanji', 'ikura'], explanation: 'dare no fragt nach dem Besitzer: wessen?' },
        { prompt: 'Are wa kuruma ___ zasshi desu.', answer: 'no', options: ['no', 'mo', 'ka', 'wa'], explanation: 'no verbindet Auto und Zeitschrift: eine Autozeitschrift.' }
      ]
    },
    {
      lesson: 3, title: 'Orte & Preise', pages: '9–12',
      summary: 'Orte mit koko/soko/asoko angeben, höflich nach dem Weg fragen und Preise nennen.',
      patterns: [['koko / soko / asoko', 'hier / dort / dort drüben'], ['kochira / sochira / achira', 'höfliche Richtungs- und Ortswörter'], ['N wa doko desu ka', 'Wo ist N?'], ['doko no N', 'N aus welchem Land/von welcher Firma?'], ['ikura', 'wie viel (Preis)']],
      drills: [
        { prompt: 'Toire wa ___ desu ka.', answer: 'doko', options: ['doko', 'dare', 'nani', 'itsu'], explanation: 'doko fragt nach einem Ort.' },
        { prompt: 'Koko ___ uketsuke desu.', answer: 'wa', options: ['wa', 'o', 'ni', 'de'], explanation: 'koko ist das Thema des Nominalsatzes.' },
        { prompt: 'Kono tokei wa ___ desu ka.', answer: 'ikura', options: ['ikura', 'ikutsu', 'dore', 'donata'], explanation: 'ikura fragt nach dem Preis.' },
        { prompt: 'O-kuni wa ___ desu ka. (höflich)', answer: 'dochira', options: ['dochira', 'kore', 'nanji', 'dare no'], explanation: 'dochira ist die höflichere Orts- oder Richtungsfrage.' }
      ]
    },
    {
      lesson: 4, title: 'Zeit & Tagesablauf', pages: '13–17',
      summary: 'Uhrzeiten nennen, Zeitspannen mit kara/made bilden und Verben in Gegenwart und Vergangenheit verwenden.',
      patterns: [['ima nanji desu ka', 'Wie viel Uhr ist es jetzt?'], ['N-ji N-fun', 'Stunde und Minute'], ['kara / made', 'von / bis'], ['V-masu / V-masen', 'Gegenwart positiv / negativ'], ['V-mashita / V-masen deshita', 'Vergangenheit positiv / negativ']],
      drills: [
        { prompt: 'Mainichi roku-ji ___ okimasu.', answer: 'ni', options: ['ni', 'de', 'o', 'wa'], explanation: 'Eine konkrete Uhrzeit wird mit ni markiert.' },
        { prompt: 'Ginkō wa ku-ji ___ san-ji made desu.', answer: 'kara', options: ['kara', 'ni', 'to', 'e'], explanation: 'kara markiert den Beginn, made das Ende.' },
        { prompt: 'Kinō benkyōshi___.', answer: 'mashita', options: ['mashita', 'masu', 'masen', 'desu'], explanation: 'Kinō verweist auf gestern; mashita ist die höfliche Vergangenheit.' },
        { prompt: 'Nichiyōbi hataraki___.', answer: 'masen', options: ['masen', 'mashita', 'deshita', 'ka'], explanation: 'masen verneint ein Verb in der Gegenwart bzw. Zukunft.' }
      ]
    }
  ];

  const materials = [
    {
      id: 'pdf-alphabet', title: 'ABC – japanische Buchstabennamen', folder: 'Kursmaterial', kind: 'alphabet', icon: 'A',
      pdf: 'materials/ABCDEFG.pdf', pages: 1, count: alphabet.length,
      description: 'Die 26 lateinischen Buchstaben so aussprechen, wie sie im Japanischen gelesen werden.',
      searchText: alphabet.map((item) => `${item.letter} ${item.reading}`).join(' ')
    },
    {
      id: 'pdf-question-words', title: 'Japanische Fragewörter', folder: 'Kursmaterial', kind: 'questions', icon: '問',
      pdf: 'materials/Fragewörter_Interrogate_pronouns_JP-2.pdf', pages: 5, count: questionWords.length,
      description: 'Fragewörter nach Funktion unterscheiden und direkt in Beispielsätzen anwenden.',
      searchText: questionWords.map((item) => `${item.romaji} ${item.kana} ${item.meaning} ${item.de}`).join(' ')
    },
    {
      id: 'pdf-kana-lab', title: 'Kana-Labor: Hiragana & Katakana', folder: 'Kursmaterial', kind: 'kana', icon: 'あ',
      pdf: 'materials/MNG kana tables and readings.pdf', pages: 5, count: kana.length * 2 + kanaReadings.length,
      description: 'Hiragana und Katakana systematisch entdecken, erkennen, aktiv abrufen und in echten Wörtern lesen.',
      sources: [
        ['Kana-Tabelle', 'materials/MNG kana tables and readings.pdf'],
        ['Leseübung + Lösung', 'materials/Kana_einführung_Leseübung1_mitLösung.pdf'],
        ['Hiragana schreiben', 'materials/hiragana.exercise.pdf'],
        ['Katakana schreiben', 'materials/katakana.exercise.pdf']
      ],
      searchText: `Hiragana Katakana Kana Alphabet Silbenschrift ${kana.map((item) => `${item.romaji} ${item.hiragana} ${item.katakana}`).join(' ')}`
    },
    {
      id: 'pdf-minna-1-4', title: 'Minna no Nihongo · Lektionen 1–4', folder: 'Kursmaterial', kind: 'textbook', icon: 'み',
      pdf: 'materials/MNG S1 Lehrbuch romanized L1-4_mit_Loesungen(abS18)-1.pdf', pages: 28, count: minnaLessons.reduce((sum, lesson) => sum + lesson.drills.length, 0),
      description: 'Die ersten vier Lektionen als kompakte Grammatikpfade mit interaktiven Kapitel-Checks und Original-Lösungen.',
      searchText: minnaLessons.map((lesson) => `${lesson.title} ${lesson.summary} ${lesson.patterns.flat().join(' ')}`).join(' ')
    },
    {
      id: 'pdf-numbers', title: 'Japanische Zahlen', folder: 'Kursmaterial', kind: 'numbers', icon: '数',
      pdf: 'materials/Japanese_numbers.pdf', pages: 1, count: 48,
      description: 'Zahlen bis 99.999 bilden, Sonderlesungen erkennen und Zahl ↔ Lesung trainieren.',
      searchText: 'ichi ni san shi yon go roku shichi nana hachi kyū ku jū hyaku sen man Zahlen'
    },
    {
      id: 'pdf-klg', title: 'Kompaktlehrgang Japanisch', folder: 'Kursmaterial', kind: 'course', icon: '文',
      pdf: 'materials/KLG_pack_DE.pdf', pages: 15, count: 6,
      description: 'Sechs interaktive Kapitel zu Satzstruktur, Partikeln, Zahlen, Uhrzeit, Datum und Adjektiven.',
      searchText: `Thema Rhema Satzbau ${particles.map((item) => item.romaji).join(' ')} Zahlen Uhrzeit Datum Adjektive ${adjectives.map((item) => item.word).join(' ')}`
    }
  ];

  window.JP_MATERIALS = materials;
  window.JP_COURSE_CONTENT = { alphabet, questionWords, particles, adjectives, particleDrills, kana, kanaReadings, kanaRules, minnaLessons };
})();
