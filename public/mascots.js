// The SnapSense crew: 25 mascot characters, one per job role.
// Four content departments (authenticity, awareness, sales, trust) with six
// roles each (manager, creator, designer, editor, copywriter, planner), plus
// Nadia, the PA to the Head of Marketing. The owner/HoM is BOSS (not in CREW).
// Role ids look like `<dept>-<type>` (e.g. 'sales-editor'), or 'pa' / 'hom'.
// Each has a look (colour, outfit, accessories), a personality, how they
// behave under stress, where they like to hang out, and what they say.
(function (PO) {
  'use strict';

  // lines: work / idle / stress / done / fire / help / thanks / comfort / chat
  const CREW = [
    {
      id: 'blu', name: 'Danial', role: 'awareness-editor', gender: 'boy', color: '#2f6df6',
      hoodie: '#1f2537', pants: '#1b1d22', headphones: '#1d1d24', item: 'coffee', backpack: true, device: 'monitor',
      traits: ['chill', 'introvert', 'suka kopi', 'suka gaming', 'kerja keras', 'tapi pemalu'],
      likes: ['coffee', 'arcade'], stressMood: 'tired',
      lines: {
        work: ['Cut laju, hook depan', 'Reels 15 saat je', 'Subtitle jap...', 'Transition smooth'],
        idle: ['Kopi dulu bro', 'Satu game je...', 'Chill je', '...'],
        stress: ['Jangan stress, slow2 je bro', 'Kopi... perlu kopi', 'Rendering 99%...'],
        done: ['Done. Export siap', 'Settle bro'],
        fire: ['ALAMAK PC AKU!'], help: ['Relax, aku padam'], thanks: ['Thanks bro, respect'],
        chat: ['Jom game malam ni?', 'Kopi lagi?', 'Okay je', 'Setuju je'],
      },
    },
    {
      id: 'lili', name: 'Lili', role: 'awareness-planner', gender: 'girl', color: '#f06a9b', hairLong: true, bow: '#ffffff',
      hoodie: '#ece4d6', pants: '#b9a98d', headphones: '#f4f4f4', item: 'iced', backpack: true, device: 'laptop',
      traits: ['ceria', 'suka makan', 'suka shopping', 'friendly', 'suka selfie', 'overthinking'],
      likes: ['coffee', 'sofa', 'studio'], stressMood: 'sad',
      lines: {
        work: ['Content calendar update!', 'Posting jam 8 malam!', 'Jadual minggu depan siap~', 'Slot Jumaat kosong?'],
        idle: ['Jom makan!', 'Selfie jap!', 'Lapar la...', 'Shopping jom?'],
        stress: ['Overthink lagi...', 'Okay ke ni?? 🥺', 'Lepas ni makan je'],
        done: ['Yay! Dah post!', 'Viral la ni!'],
        fire: ['TOLONGGG!'], help: ['Lili datang!'], thanks: ['Sayang korang!'],
        chat: ['Jom makan! Setuju je!', 'Cantik tak outfit ni?', 'Nak boba!', 'Hehe~'],
      },
    },
    {
      id: 'green', name: 'Haziq', role: 'sales-planner', gender: 'boy', color: '#3fae6a',
      hoodie: '#2f7d4a', pants: '#1b1d22', hat: { type: 'cap', color: '#ece8df', logo: '#1d1d24' }, bag: true, device: 'laptop',
      traits: ['calm', 'simple', 'suka nature', 'suka travel', 'jarang marah', 'setia kawan'],
      likes: ['win', 'books', 'sofa'], stressMood: 'thinking',
      lines: {
        work: ['Plan promo siap 80%', 'Timeline campaign raya', 'Slot booking on track', 'Checklist promo dulu'],
        idle: ['Tengok pokok jap', 'Plan trip next month', 'Tenang je'],
        stress: ['Tarik nafas... okay', 'Satu-satu, chill', 'Masih on track'],
        done: ['Plan settle!', 'Event ready!'],
        fire: ['Okay... jangan panik'], help: ['Aku handle'], thanks: ['Terima kasih kawan'],
        chat: ['Jom hiking weekend?', 'Cuaca best hari ni', 'Steady je'],
      },
    },
    {
      id: 'purple', name: 'Sofea', role: 'awareness-creator', gender: 'girl', color: '#9b6ad8', hairLong: true,
      hoodie: '#1d1d24', pants: '#1b1d22', sunglasses: true, item: 'phone', backpack: true, device: 'monitor',
      traits: ['punya style', 'suka fashion', 'confident', 'suka content', 'kadang moody', 'tapi baik'],
      likes: ['studio', 'coffee'], stressMood: 'angry',
      lines: {
        work: ['Trend ni kena ikut', 'Shoot hook 3 saat', 'Viral otw ✨', 'Audio trending, jom'],
        idle: ['Pose sikit', 'Outfit check ✨', 'Mood hari ni: slay'],
        stress: ['Ugh, mood swing...', 'Jangan kacau kejap', 'Not today...'],
        done: ['Slayed it ✨', 'Content siap!'],
        fire: ['EH API?!'], help: ['Okay okay aku tolong'], thanks: ['You guys the best'],
        chat: ['Style kau cun', 'Nak collab?', 'Hmm boleh la'],
      },
    },
    {
      id: 'yellow', name: 'Irfan', role: 'awareness-manager', gender: 'boy', color: '#f2c230',
      hoodie: '#1d1d24', hoodieMark: '#f4f4f4', pants: '#e6e2da', hat: { type: 'beanie', color: '#1d1d24' }, item: 'skate', device: 'monitor',
      traits: ['suka sukan', 'energetic', 'suka muzik', 'cepat bosan', 'suka lepak', 'baik hati'],
      likes: ['arcade', 'studio', 'cooler'], stressMood: 'embarrassed',
      lines: {
        work: ['Reach naik! Gas!', 'Trend minggu ni apa?', 'Followers baru masuk!', 'Hook kena padu!'],
        idle: ['Bosan la...', 'Jom skate!', 'Lagu ni best gila'],
        stress: ['Bosan + stress = 😵', 'Jom skate jap!', 'Energy low...'],
        done: ['LET\'S GOOO!', 'Campaign live!'],
        fire: ['WOI API WOI!'], help: ['Aku laju, aku pergi!'], thanks: ['Power la korang!'],
        chat: ['Jom futsal!', 'Lagu baru dah dengar?', 'Gas!'],
      },
    },
    {
      id: 'red', name: 'Mira', role: 'awareness-designer', gender: 'girl', color: '#e04545', hairLong: true,
      hoodie: '#c8343a', pants: '#1b1d22', hat: { type: 'cap', color: '#1d1d24', logo: '#f4f4f4' }, neckphones: '#1d1d24', item: 'iced', bag: true, device: 'laptop',
      traits: ['tegas', 'fokus', 'suka masak', 'family oriented', 'cepat cemburu', 'protective'],
      likes: ['coffee', 'sofa'], stressMood: 'angry',
      lines: {
        work: ['Thumbnail kena pop!', 'Carousel v3 final', 'Branding kena konsisten', 'Cover reels siap'],
        idle: ['Nak masak apa malam ni', 'Rehat 5 minit'],
        stress: ['Siapa usik file aku?!', 'Final_final_v3??', 'Jangan revise lagi!'],
        done: ['Design approved!', 'Puas hati'],
        fire: ['KOMPUTER AKU!!'], help: ['Ke tepi, aku padam!'], thanks: ['Okay... thanks'],
        chat: ['Dah makan?', 'Jaga diri tau', 'Hmph'],
      },
    },
    {
      id: 'cyan', name: 'Farid', role: 'trust-designer', gender: 'boy', color: '#38c6e0',
      hoodie: '#e6e0cf', pants: '#1b1d22', glasses: true, item: 'tablet', backpack: true, device: 'laptop',
      traits: ['suka ilmu', 'suka baca', 'detail', 'low profile', 'pemikir', 'suka kopi'],
      likes: ['books', 'coffee'], stressMood: 'thinking',
      lines: {
        work: ['Layout portfolio kemas', 'Infografik tips siap', 'Template FAQ ✓', 'Testimoni ada izin? ✓'],
        idle: ['Baca buku jap', 'Fakta menarik:', 'Kopi #3'],
        stress: ['Kenapa tak jalan...', 'Stack overflow...', 'Hmm, logik dia...'],
        done: ['Deployed ✓', 'Semua test lulus'],
        fire: ['Overheat. Logik.'], help: ['Ikut SOP: padam'], thanks: ['Terima kasih, noted'],
        chat: ['Kau tahu tak...', 'Menurut kajian...', 'Interesting'],
      },
    },
    {
      id: 'orange', name: 'Amir', role: 'authenticity-creator', gender: 'boy', color: '#f08a2c',
      hoodie: '#1d1d24', pants: '#d8cdb6', hat: { type: 'cap', color: '#ece8df', logo: '#f08a2c' }, neckphones: '#1d1d24', item: 'camera', bag: true, device: 'laptop', wink: true,
      traits: ['happy go lucky', 'suka ketawa', 'suka makanan', 'suka jalan', 'mudah mesra', 'selalu positif'],
      likes: ['studio', 'sofa', 'coffee'], stressMood: 'laughing',
      lines: {
        work: ['Shoot BTS jap! *klik*', 'Candid lagi best!', 'Moment real ni cun!', 'Vlog belakang tabir'],
        idle: ['Hahaha!', 'Jom jalan-jalan!', 'Makan sedap jom'],
        stress: ['Rilek la, semua okay!', 'Haha... okay... 😅', 'Positif je!'],
        done: ['Gallery siap! 📸', 'Cantik semua!'],
        fire: ['Eh hangat pulak! 😂'], help: ['Aku datang! Hehe'], thanks: ['Korang terbaik!'],
        chat: ['Hahaha kelakar!', 'Jom ambil gambar!', 'Senyum sikit!'],
      },
    },
    {
      id: 'black', name: 'Zul', role: 'authenticity-manager', gender: 'boy', color: '#2a2a30',
      hoodie: '#1d1d24', pants: '#1b1d22', hat: { type: 'beanie', color: '#151518' }, headphones: '#3a3a42', backpack: true, device: 'monitor', iris: '#e6e8ef',
      traits: ['tenang', 'suka muzik', 'suka malam', 'independent', 'jarang bercakap', 'deep thinker'],
      likes: ['bean', 'win'], stressMood: 'tired',
      lines: {
        work: ['BTS. Rolling.', 'Cerita real je.', 'Raw pun okay.', 'Team, gerak. ♪'],
        idle: ['♪ ♪', '...', 'Malam lagi best'],
        stress: ['...', '*volume up*', 'Hmm.'],
        done: ['Wrap.', '👍'],
        fire: ['...API.'], help: ['*padam diam-diam*'], thanks: ['Thanks.'],
        chat: ['Hmm.', 'Okay.', '♪'],
      },
    },
    {
      id: 'white', name: 'Aina', role: 'sales-copywriter', gender: 'girl', color: '#ecebe8', hairLong: true,
      hoodie: '#f4f2ee', pants: '#e6e0d2', hat: { type: 'cap', color: '#f4f2ee', logo: '#1d2a55' }, item: 'phone', bag: true, device: 'laptop', iris: '#3a3f4b',
      traits: ['sweet', 'penyayang', 'suka haiwan', 'suka aesthetic', 'mudah tersentuh', 'family girl'],
      likes: ['bean', 'sofa', 'books'], stressMood: 'sad',
      lines: {
        work: ['Ayat promo lagi sedap...', 'CTA: Book sekarang!', 'Caption pakej siap', 'Skrip balas DM'],
        idle: ['Comel kucing ni 🐱', 'Aesthetic gila', 'Rindu family'],
        stress: ['Huhu... banyaknya kerja', 'Sedih la...', 'Okay, boleh... 🥺'],
        done: ['Yay siap! 🤍', 'Puas hati~'],
        fire: ['Takutnya!!'], help: ['Saya tolong!'], thanks: ['Terharu 🥹'],
        chat: ['Comelnya!', 'Awak okay?', 'Sayang korang 🤍'],
      },
    },
    {
      id: 'navy', name: 'Hafiz', role: 'sales-manager', gender: 'boy', color: '#24346e',
      hoodie: '#1f2a55', hoodieMark: '#f4f4f4', track: true, pants: '#1b1d22', headphones: '#1d1d24', device: 'monitor', iris: '#e6e8ef',
      traits: ['kompetitif', 'suka sukan', 'disiplin', 'suka cabaran', 'tak suka drama', 'goal oriented'],
      likes: ['arcade', 'win'], stressMood: 'focused',
      lines: {
        work: ['Promo bulan ni GO', 'Target booking: 20', 'Conversion naik 3%', 'Harga pakej final'],
        idle: ['Push-up 20 kali', 'Siapa nak lawan?', 'Target minggu ni?'],
        stress: ['Fokus. Deadline.', 'Tiada drama.', 'Cabaran diterima.'],
        done: ['Deal closed.', 'Target capai 🏆'],
        fire: ['Situasi kritikal!'], help: ['Aku ambil alih'], thanks: ['Kerja berpasukan 👊'],
        chat: ['Lawan aku?', 'Disiplin!', 'Next target.'],
      },
    },
    {
      id: 'lilac', name: 'Nadia', role: 'pa', gender: 'girl', color: '#b79be6', hairLong: true, bow: '#e93d82',
      hoodie: '#c9b3ee', pants: '#ece4d6', item: 'iced', bag: true, device: 'laptop', caring: true,
      traits: ['lembut', 'suka seni', 'suka dgr lagu', 'mudah baper', 'manja', 'caring'],
      likes: ['sofa', 'bean', 'coffee'], stressMood: 'sad',
      lines: {
        work: ['Jadual bos hari ni ✨', 'Approval bos pending', 'Reminder: meeting 3pm', 'Bos, nak sign ni?'],
        idle: ['Lagu ni sedih 🥺', 'Lukis jap~', 'Semua okay?'],
        stress: ['Baper sikit...', 'Peluk jap?', 'Okay je... 🥹'],
        done: ['Siap dengan kasih 💜', 'Yay~'],
        fire: ['Eh eh API!'], help: ['Nadia tolong!'], thanks: ['Terima kasih sayang 💜'],
        comfort: ['Okay tak? Rehat jap 💜', 'Jangan stress, ada kami', 'Nak air? 🧋'],
        chat: ['Semua sihat?', 'Comel la korang', 'Peluk! 💜'],
      },
    },

    // ---- Authenticity: behind-the-scenes, real stories, raw moments, founder voice ----
    {
      id: 'hana', name: 'Hana', role: 'authenticity-designer', gender: 'girl', color: '#0f9a8a', hairLong: true, bow: '#ffd166',
      hoodie: '#f3e9d2', pants: '#2b3a42', item: 'tablet', bag: true, device: 'laptop',
      traits: ['kreatif', 'suka scrapbook', 'suka kucing', 'pendiam', 'perfectionist', 'hati lembut'],
      likes: ['studio', 'books', 'bean'], stressMood: 'embarrassed',
      lines: {
        work: ['Frame BTS ni comel', 'Collage cerita founder', 'Tone raw, jangan over', 'Grain sikit, baru real'],
        idle: ['Kucing aku rindu...', 'Doodle jap~', 'Washi tape baru!'],
        stress: ['Tak cukup cantik lagi...', 'Ulang sekali lagi?', 'Alamak, salah warna 😣'],
        done: ['Siap! Real & cantik', 'Yay, lepas~'],
        fire: ['Eh eh asap!'], help: ['Hana tolong!'], thanks: ['Terima kasih 🥹'],
        chat: ['Tengok kucing aku!', 'Comelnya design kau', 'Hehe okay~'],
      },
    },
    {
      id: 'syafiq', name: 'Syafiq', role: 'authenticity-editor', gender: 'boy', color: '#7a4a2a',
      hoodie: '#2e4a3a', pants: '#1b1d22', hat: { type: 'beanie', color: '#c9772e' }, headphones: '#d9d6cf', item: 'coffee', device: 'monitor',
      traits: ['santai', 'suka filem', 'night owl', 'suka teh tarik', 'loyal', 'lawak hambar'],
      likes: ['coffee', 'arcade', 'bean'], stressMood: 'tired',
      lines: {
        work: ['Footage BTS banyak gila', 'Biar raw, jangan cut', 'Mini doc founder', 'Sound asli lagi feel'],
        idle: ['Teh tarik satu!', 'Movie malam ni?', 'Rehat mata jap'],
        stress: ['Footage 200GB... 😩', 'Mata dah layu', 'Render lagi?'],
        done: ['Export siap, real gila', 'Settle, geng'],
        fire: ['PC aku berasap?!'], help: ['Jap, aku datang'], thanks: ['Thanks geng'],
        chat: ['Dah tengok filem tu?', 'Haha hambar kan', 'Teh tarik jom'],
      },
    },
    {
      id: 'izzah', name: 'Izzah', role: 'authenticity-copywriter', gender: 'girl', color: '#f9b998', hairLong: true,
      hoodie: '#5b6bb5', pants: '#e6e0d2', glasses: true, item: 'phone', bag: true, device: 'laptop',
      traits: ['suka menulis', 'jiwang', 'suka puisi', 'pendengar setia', 'emosional', 'jujur'],
      likes: ['books', 'sofa', 'coffee'], stressMood: 'sad',
      lines: {
        work: ['Cerita founder dari hati', 'Caption BTS jujur', 'Suara brand, bukan robot', 'Kisah client sebenar'],
        idle: ['Tulis puisi jap', 'Hujan... syahdu', 'Baca novel~'],
        stress: ['Writer\'s block...', 'Ayat tak jadi 🥺', 'Padam, tulis balik'],
        done: ['Siap, menangis sikit 🥹', 'Ayat ni kena!'],
        fire: ['Ya Allah, api!'], help: ['Izzah tolong!'], thanks: ['Terharu sangat 💛'],
        chat: ['Kau okay hari ni?', 'Cerita la, aku dengar', 'Sweet nya~'],
      },
    },
    {
      id: 'adam', name: 'Adam', role: 'authenticity-planner', gender: 'boy', color: '#7f8c24',
      hoodie: '#e8dcc0', pants: '#3a3020', hat: { type: 'cap', color: '#3a3020', logo: '#f4f4f4' }, item: 'tablet', bag: true, device: 'laptop',
      traits: ['teratur', 'suka memancing', 'sabar', 'suka list', 'abang-abang', 'boleh harap'],
      likes: ['win', 'books', 'coffee'], stressMood: 'thinking',
      lines: {
        work: ['Jadual shoot BTS', 'Slot cerita client Rabu', 'Day-in-the-life plan', 'Founder talk: Jumaat'],
        idle: ['Weekend pancing!', 'List lagi satu', 'Sabar je'],
        stress: ['Jadual bertindih...', 'Okay, susun balik', 'Satu-satu dulu'],
        done: ['Plan settle!', 'Semua on track'],
        fire: ['Bertenang, ikut aku'], help: ['Aku ambil hos'], thanks: ['Sama-sama, adik'],
        chat: ['Jom memancing?', 'Dah makan, dik?', 'Steady'],
      },
    },

    // ---- Awareness: reach, trends, viral hooks, new followers ----
    {
      id: 'balqis', name: 'Balqis', role: 'awareness-copywriter', gender: 'girl', color: '#c0178a', hairLong: true, bow: '#1d1d24',
      hoodie: '#ffe066', pants: '#1b1d22', item: 'iced', backpack: true, device: 'laptop', wink: true,
      traits: ['kecoh', 'suka meme', 'cepat', 'suka K-pop', 'witty', 'drama queen'],
      likes: ['coffee', 'arcade', 'studio'], stressMood: 'stressed',
      lines: {
        work: ['Hook 3 saat: siap!', 'Caption viral ni', 'Meme trend hari ni', 'Tulis pun boleh FYP'],
        idle: ['Scroll TikTok jap', 'Comeback K-pop!', 'Meme ni kelakar gila'],
        stress: ['Hook tak padu!!', 'Trend dah basi?! 😱', 'Aaaaa idea mana'],
        done: ['FYP confirm!', 'Siap, slay~'],
        fire: ['APA NI API?!'], help: ['Balqis on the way!'], thanks: ['Love korang!'],
        chat: ['Tengok meme ni!', 'Gosip apa hari ni?', 'Omg sama!'],
      },
    },

    // ---- Sales: offers, packages, prices, promos, conversion, DMs to bookings ----
    {
      id: 'ariff', name: 'Ariff', role: 'sales-creator', gender: 'boy', color: '#a8dc32',
      hoodie: '#2b2d6e', hoodieMark: '#a8dc32', pants: '#d8cdb6', sunglasses: true, neckphones: '#f4f4f4', item: 'phone', device: 'monitor',
      traits: ['peramah', 'pandai cakap', 'suka kereta', 'yakin', 'suka gym', 'sikit poyo'],
      likes: ['studio', 'arcade', 'win'], stressMood: 'embarrassed',
      lines: {
        work: ['Video promo pakej!', 'Unboxing pakej raya', 'Slot terhad, book!', 'Shoot offer 30 saat'],
        idle: ['Gym petang ni', 'Kereta baru cun', 'Cermin jap'],
        stress: ['Takde orang book? 😅', 'Ulang take ke-8', 'Senyum, senyum...'],
        done: ['Promo live, bro!', 'Booking masuk!'],
        fire: ['Woi api!!'], help: ['Aku settle'], thanks: ['Kau memang power'],
        chat: ['Bro, gym jom', 'Deal or no deal?', 'Mantap!'],
      },
    },
    {
      id: 'qistina', name: 'Qistina', role: 'sales-designer', gender: 'girl', color: '#93ecd0', hairLong: true, bow: '#ffffff',
      hoodie: '#e85d75', pants: '#f4f2ee', item: 'iced', bag: true, device: 'laptop',
      traits: ['ceria', 'suka pastel', 'suka baking', 'teliti', 'suka diskaun', 'mudah gelak'],
      likes: ['bean', 'sofa', 'coffee'], stressMood: 'embarrassed',
      lines: {
        work: ['Poster promo 20% off', 'Price list kemas', 'Banner pakej raya', 'Harga kena nampak!'],
        idle: ['Bake cookies weekend~', 'Sale Shopee!', 'Pastel is life'],
        stress: ['Harga salah taip?!', 'Revise lagi... 🥲', 'Font mana satu'],
        done: ['Poster siap! 💸', 'Cantik & laku~'],
        fire: ['Alamak alamak!'], help: ['Qis tolong!'], thanks: ['Thank you! 🧁'],
        chat: ['Nak cookies?', 'Ada sale tau!', 'Hihi~'],
      },
    },
    {
      id: 'hakim', name: 'Hakim', role: 'sales-editor', gender: 'boy', color: '#8a1f36', iris: '#e6e8ef',
      hoodie: '#d9d6cf', pants: '#1b1d22', hat: { type: 'beanie', color: '#1d1d24' }, headphones: '#f2c230', item: 'coffee', backpack: true, device: 'monitor',
      traits: ['serius', 'suka bola', 'cepat', 'suka nasi lemak', 'efisien', 'diam-diam lawak'],
      likes: ['coffee', 'win', 'arcade'], stressMood: 'focused',
      lines: {
        work: ['Ad 15 saat, CTA hujung', 'Cut testimoni promo', 'Version A/B siap', 'Retarget video'],
        idle: ['Nasi lemak jom', 'Bola malam ni', 'Hm.'],
        stress: ['Deadline ads 5pm', 'Fokus.', 'Render cepat la...'],
        done: ['Ad siap. Launch.', 'Done, bos'],
        fire: ['Api! Gerak!'], help: ['Aku pegang extinguisher'], thanks: ['Thanks, bro'],
        chat: ['Siapa menang semalam?', 'Nasi lemak?', 'Haha, okay'],
      },
    },

    // ---- Trust: real testimonials (with permission), portfolio, tips, FAQs, reviews ----
    {
      id: 'rina', name: 'Rina', role: 'trust-manager', gender: 'girl', color: '#9fc4f0', hairLong: true,
      hoodie: '#1f3b5c', pants: '#e6e0d2', glasses: true, item: 'tablet', bag: true, device: 'monitor',
      traits: ['tenang', 'berprinsip', 'suka yoga', 'matang', 'kakak sulung', 'tegas tapi adil'],
      likes: ['books', 'win', 'bean'], stressMood: 'focused',
      lines: {
        work: ['Testimoni real je, ada izin', 'Review minggu ni bagus', 'Portfolio update', 'FAQ kena jelas'],
        idle: ['Yoga jap', 'Teh herba~', 'Nafas dalam-dalam'],
        stress: ['Jangan reka review.', 'Semak izin dulu', 'Tenang... satu-satu'],
        done: ['Trust naik ✓', 'Kerja yang jujur'],
        fire: ['Semua keluar, tertib!'], help: ['Kakak handle'], thanks: ['Terima kasih, team'],
        chat: ['Dah minum air?', 'Bagus, teruskan', 'Hmm, betul tu'],
      },
    },
    {
      id: 'iman', name: 'Iman', role: 'trust-creator', gender: 'girl', color: '#f9a8c9', hairLong: true, bow: '#e93d82',
      hoodie: '#3d6e8a', pants: '#ece4d6', item: 'camera', backpack: true, device: 'laptop',
      traits: ['bubbly', 'suka bunga', 'suka mengajar', 'sabar', 'suka explain', 'positive vibes'],
      likes: ['studio', 'sofa', 'coffee'], stressMood: 'shocked',
      lines: {
        work: ['Tips posing 101!', 'Video FAQ client', 'Before vs after', 'Interview client real'],
        idle: ['Bunga ni cantik!', 'Ajar adik math~', 'Hihi'],
        stress: ['Eh? Client tak bagi izin?', 'Shoot semula?!', 'Okay okay, boleh!'],
        done: ['Tips video siap! 🌸', 'Yeay!'],
        fire: ['HAH?! API?!'], help: ['Iman datang!'], thanks: ['Sayang korang 🌸'],
        chat: ['Nak tips? Hehe', 'Comel la!', 'Semangat!'],
      },
    },
    {
      id: 'faiz', name: 'Faiz', role: 'trust-editor', gender: 'boy', color: '#66788f',
      hoodie: '#d9a441', pants: '#1b1d22', track: true, headphones: '#1d1d24', item: 'coffee', backpack: true, device: 'monitor',
      traits: ['teliti', 'suka basikal', 'introvert', 'suka lego', 'konsisten', 'baik orangnya'],
      likes: ['books', 'coffee', 'arcade'], stressMood: 'tired',
      lines: {
        work: ['Montaj portfolio', 'Testimoni video: subtitle', 'Showreel 2026', 'Tips reel, potong kemas'],
        idle: ['Lego jap', 'Kayuh petang ni', '...'],
        stress: ['Frame drop lagi...', 'Ngantuk...', 'Sikit lagi...'],
        done: ['Showreel siap.', 'Kemas ✓'],
        fire: ['Api. Okay. Padam.'], help: ['Aku tolong'], thanks: ['Thanks ya'],
        chat: ['Lego baru beli', 'Jom kayuh?', 'Okay'],
      },
    },
    {
      id: 'wani', name: 'Wani', role: 'trust-copywriter', gender: 'girl', color: '#9a5a86', hairLong: true, bow: '#f2c230',
      hoodie: '#f4f2ee', pants: '#4a3f5c', glasses: true, item: 'coffee', bag: true, device: 'laptop',
      traits: ['bijak', 'suka trivia', 'kelakar', 'suka podcast', 'mak cik bawang', 'jujur'],
      likes: ['books', 'coffee', 'sofa'], stressMood: 'angry',
      lines: {
        work: ['Jawapan FAQ ringkas', 'Quote review asli', 'Artikel tips kahwin', 'Caption portfolio'],
        idle: ['Podcast best ni', 'Trivia: tahu tak...', 'Gosip apa?'],
        stress: ['Siapa tulis "best ever"?!', 'Review palsu? TAK.', 'Huh, typo lagi'],
        done: ['Siap, jujur & jelas', 'Ngam!'],
        fire: ['Eh, bau terbakar!'], help: ['Wani datang!'], thanks: ['Kasih ya!'],
        chat: ['Dengar cerita tak?', 'Haha betul!', 'Trivia time!'],
      },
    },
    {
      id: 'khairul', name: 'Khairul', role: 'trust-planner', gender: 'boy', color: '#1f5c34', iris: '#e6e8ef',
      hoodie: '#e9d8a6', pants: '#2b2f36', hat: { type: 'cap', color: '#e04545', logo: '#f4f4f4' }, item: 'tablet', bag: true, device: 'laptop',
      traits: ['rajin', 'suka camping', 'pagi-pagi dah sampai', 'suka spreadsheet', 'humble', 'setia'],
      likes: ['win', 'books', 'coffee'], stressMood: 'thinking',
      lines: {
        work: ['Kalendar testimoni', 'Minta izin client dulu', 'Slot tips: Selasa', 'Review follow-up'],
        idle: ['Camping next week!', 'Spreadsheet baru ✓', 'Kopi O satu'],
        stress: ['Izin belum dapat...', 'Susun semula', 'Hmm, slot penuh'],
        done: ['Jadual settle!', 'Semua dah ada izin ✓'],
        fire: ['Ikut laluan kecemasan!'], help: ['Aku bantu'], thanks: ['Terima kasih banyak'],
        chat: ['Jom camping?', 'Awal lagi ni', 'Insya-Allah boleh'],
      },
    },
  ];

  // The owner: Head of Marketing (photographer/videographer too). Not part of CREW.
  const BOSS = {
    id: 'hom', name: 'BOS', role: 'hom', gender: 'boy', color: '#b8932a',
    hoodie: '#22252e', pants: '#3a3f4b', item: 'camera', device: 'monitor',
    traits: ['visionary', 'decisive'], likes: ['win', 'studio', 'coffee'], stressMood: 'focused',
    lines: {
      work: ['Approve!', 'Meeting 5 minit', 'Mana report minggu ni?', 'Shoot client esok, siap?'],
      idle: ['Kopi dulu', 'Hmm, idea baru...'],
      stress: ['Fokus semua.', 'Kita boleh.'],
      done: ['Good job team!', 'Approve!'],
      fire: ['Semua selamat?!'], help: ['Bos turun padang!'], thanks: ['Terima kasih team'],
      chat: ['Good job team!', 'Approve!', 'Meeting 5 minit', 'Proud of you all'],
    },
  };

  const FIRE = {
    id: 'bomba', name: 'Bomba', color: '#8a93a6', gender: 'boy', hoodie: '#f76b15', pants: '#26324a', hat: { type: 'helmet' },
    traits: ['berani', 'cekap'], likes: [], stressMood: 'focused',
    lines: { help: ['Bomba sampai!', 'Bertenang semua!'], done: ['ALL CLEAR!'] },
  };

  const byId = new Map([...CREW, BOSS].map((m) => [m.id, m]));
  const byRole = new Map([...CREW, BOSS].map((m) => [m.role, m]));

  // A sub-agent is an intern version of its lead: lighter colour, graduation cap.
  function intern(parent, idx) {
    const base = parent || CREW[idx % CREW.length];
    return {
      id: `intern-${base.id}`, name: `Mini-${base.name}`, gender: base.gender, color: PO.sprites.shade(base.color, 0.18),
      hairLong: base.hairLong, hoodie: '#f4f2ee', pants: '#9aa4b2', hat: { type: 'grad' }, device: 'laptop', intern: true,
      traits: ['rajin', 'baru belajar'], likes: ['books'], stressMood: 'embarrassed',
      lines: {
        work: ['Saya cuba!', 'Belajar jap...', 'Macam ni ke boss?'],
        stress: ['Alamak... 😅', 'Boss tolong!'], done: ['Siap boss!'], idle: ['Hehe'], chat: ['Baik boss!'],
      },
    };
  }

  PO.mascots = { CREW, FIRE, BOSS, get: (id) => byId.get(id), forRole: (role) => byRole.get(role), intern };
})(window.PO = window.PO || {});
