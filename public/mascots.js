// The SnapSense crew: twelve mascot characters, one per job role.
// Each has a look (colour, outfit, accessories), a personality, how they
// behave under stress, where they like to hang out, and what they say.
(function (PO) {
  'use strict';

  // lines: work / idle / stress / done / fire / help / thanks / comfort / chat
  const CREW = [
    {
      id: 'blu', name: 'Danial', role: 'video-editor', gender: 'boy', color: '#2f6df6',
      hoodie: '#1f2537', pants: '#1b1d22', headphones: '#1d1d24', item: 'coffee', backpack: true, device: 'monitor',
      traits: ['chill', 'introvert', 'suka kopi', 'suka gaming', 'kerja keras', 'tapi pemalu'],
      likes: ['coffee', 'arcade'], stressMood: 'tired',
      lines: {
        work: ['Render jap...', 'Cut sini, cut sana', 'Color grade dulu', 'Frame ni cantik'],
        idle: ['Kopi dulu bro', 'Satu game je...', 'Chill je', '...'],
        stress: ['Jangan stress, slow2 je bro', 'Kopi... perlu kopi', 'Rendering 99%...'],
        done: ['Done. Export siap', 'Settle bro'],
        fire: ['ALAMAK PC AKU!'], help: ['Relax, aku padam'], thanks: ['Thanks bro, respect'],
        chat: ['Jom game malam ni?', 'Kopi lagi?', 'Okay je', 'Setuju je'],
      },
    },
    {
      id: 'lili', name: 'Lili', role: 'social-media', gender: 'girl', color: '#f06a9b', hairLong: true, bow: '#ffffff',
      hoodie: '#ece4d6', pants: '#b9a98d', headphones: '#f4f4f4', item: 'iced', backpack: true, device: 'laptop',
      traits: ['ceria', 'suka makan', 'suka shopping', 'friendly', 'suka selfie', 'overthinking'],
      likes: ['coffee', 'sofa', 'studio'], stressMood: 'sad',
      lines: {
        work: ['Caption ni okay tak?', 'Posting jam 8 malam!', 'Engagement naik!', 'Story dulu~'],
        idle: ['Jom makan!', 'Selfie jap!', 'Lapar la...', 'Shopping jom?'],
        stress: ['Overthink lagi...', 'Okay ke ni?? 🥺', 'Lepas ni makan je'],
        done: ['Yay! Dah post!', 'Viral la ni!'],
        fire: ['TOLONGGG!'], help: ['Lili datang!'], thanks: ['Sayang korang!'],
        chat: ['Jom makan! Setuju je!', 'Cantik tak outfit ni?', 'Nak boba!', 'Hehe~'],
      },
    },
    {
      id: 'green', name: 'Haziq', role: 'project-manager', gender: 'boy', color: '#3fae6a',
      hoodie: '#2f7d4a', pants: '#1b1d22', hat: { type: 'cap', color: '#ece8df', logo: '#1d1d24' }, bag: true, device: 'laptop',
      traits: ['calm', 'simple', 'suka nature', 'suka travel', 'jarang marah', 'setia kawan'],
      likes: ['win', 'books', 'sofa'], stressMood: 'thinking',
      lines: {
        work: ['Event plan siap 80%', 'Booking venue...', 'Timeline on track', 'Checklist dulu'],
        idle: ['Tengok pokok jap', 'Plan trip next month', 'Tenang je'],
        stress: ['Tarik nafas... okay', 'Satu-satu, chill', 'Masih on track'],
        done: ['Plan settle!', 'Event ready!'],
        fire: ['Okay... jangan panik'], help: ['Aku handle'], thanks: ['Terima kasih kawan'],
        chat: ['Jom hiking weekend?', 'Cuaca best hari ni', 'Steady je'],
      },
    },
    {
      id: 'purple', name: 'Sofea', role: 'content-creator', gender: 'girl', color: '#9b6ad8', hairLong: true,
      hoodie: '#1d1d24', pants: '#1b1d22', sunglasses: true, item: 'phone', backpack: true, device: 'monitor',
      traits: ['punya style', 'suka fashion', 'confident', 'suka content', 'kadang moody', 'tapi baik'],
      likes: ['studio', 'coffee'], stressMood: 'angry',
      lines: {
        work: ['Content idea baru!', 'Shoot OOTD jap', 'Trend ni kena ikut', 'Edit thumbnail'],
        idle: ['Pose sikit', 'Outfit check ✨', 'Mood hari ni: slay'],
        stress: ['Ugh, mood swing...', 'Jangan kacau kejap', 'Not today...'],
        done: ['Slayed it ✨', 'Content siap!'],
        fire: ['EH API?!'], help: ['Okay okay aku tolong'], thanks: ['You guys the best'],
        chat: ['Style kau cun', 'Nak collab?', 'Hmm boleh la'],
      },
    },
    {
      id: 'yellow', name: 'Irfan', role: 'marketing-manager', gender: 'boy', color: '#f2c230',
      hoodie: '#1d1d24', hoodieMark: '#f4f4f4', pants: '#e6e2da', hat: { type: 'beanie', color: '#1d1d24' }, item: 'skate', device: 'monitor',
      traits: ['suka sukan', 'energetic', 'suka muzik', 'cepat bosan', 'suka lepak', 'baik hati'],
      likes: ['arcade', 'studio', 'cooler'], stressMood: 'embarrassed',
      lines: {
        work: ['Campaign GO!', 'Ads ROI naik!', 'Funnel siap', 'Hype dia!'],
        idle: ['Bosan la...', 'Jom skate!', 'Lagu ni best gila'],
        stress: ['Bosan + stress = 😵', 'Jom skate jap!', 'Energy low...'],
        done: ['LET\'S GOOO!', 'Campaign live!'],
        fire: ['WOI API WOI!'], help: ['Aku laju, aku pergi!'], thanks: ['Power la korang!'],
        chat: ['Jom futsal!', 'Lagu baru dah dengar?', 'Gas!'],
      },
    },
    {
      id: 'red', name: 'Mira', role: 'graphic-designer', gender: 'girl', color: '#e04545', hairLong: true,
      hoodie: '#c8343a', pants: '#1b1d22', hat: { type: 'cap', color: '#1d1d24', logo: '#f4f4f4' }, neckphones: '#1d1d24', item: 'iced', bag: true, device: 'laptop',
      traits: ['tegas', 'fokus', 'suka masak', 'family oriented', 'cepat cemburu', 'protective'],
      likes: ['coffee', 'sofa'], stressMood: 'angry',
      lines: {
        work: ['Kerning ni salah!', 'Logo v12 final', 'Branding kena konsisten', 'Fokus...'],
        idle: ['Nak masak apa malam ni', 'Rehat 5 minit'],
        stress: ['Siapa usik file aku?!', 'Final_final_v3??', 'Jangan revise lagi!'],
        done: ['Design approved!', 'Puas hati'],
        fire: ['KOMPUTER AKU!!'], help: ['Ke tepi, aku padam!'], thanks: ['Okay... thanks'],
        chat: ['Dah makan?', 'Jaga diri tau', 'Hmph'],
      },
    },
    {
      id: 'cyan', name: 'Farid', role: 'web-developer', gender: 'boy', color: '#38c6e0',
      hoodie: '#e6e0cf', pants: '#1b1d22', glasses: true, item: 'tablet', backpack: true, device: 'laptop',
      traits: ['suka ilmu', 'suka baca', 'detail', 'low profile', 'pemikir', 'suka kopi'],
      likes: ['books', 'coffee'], stressMood: 'thinking',
      lines: {
        work: ['Kejap, research dulu', 'Bug ni menarik', 'Docs kata...', 'Tests pass ✓'],
        idle: ['Baca buku jap', 'Fakta menarik:', 'Kopi #3'],
        stress: ['Kenapa tak jalan...', 'Stack overflow...', 'Hmm, logik dia...'],
        done: ['Deployed ✓', 'Semua test lulus'],
        fire: ['Overheat. Logik.'], help: ['Ikut SOP: padam'], thanks: ['Terima kasih, noted'],
        chat: ['Kau tahu tak...', 'Menurut kajian...', 'Interesting'],
      },
    },
    {
      id: 'orange', name: 'Amir', role: 'photographer', gender: 'boy', color: '#f08a2c',
      hoodie: '#1d1d24', pants: '#d8cdb6', hat: { type: 'cap', color: '#ece8df', logo: '#f08a2c' }, neckphones: '#1d1d24', item: 'camera', bag: true, device: 'laptop', wink: true,
      traits: ['happy go lucky', 'suka ketawa', 'suka makanan', 'suka jalan', 'mudah mesra', 'selalu positif'],
      likes: ['studio', 'sofa', 'coffee'], stressMood: 'laughing',
      lines: {
        work: ['Senyum! *klik*', 'Lighting perfect!', 'Retouch sikit', 'Shot ni cun!'],
        idle: ['Hahaha!', 'Jom jalan-jalan!', 'Makan sedap jom'],
        stress: ['Rilek la, semua okay!', 'Haha... okay... 😅', 'Positif je!'],
        done: ['Gallery siap! 📸', 'Cantik semua!'],
        fire: ['Eh hangat pulak! 😂'], help: ['Aku datang! Hehe'], thanks: ['Korang terbaik!'],
        chat: ['Hahaha kelakar!', 'Jom ambil gambar!', 'Senyum sikit!'],
      },
    },
    {
      id: 'black', name: 'Zul', role: 'videographer', gender: 'boy', color: '#2a2a30',
      hoodie: '#1d1d24', pants: '#1b1d22', hat: { type: 'beanie', color: '#151518' }, headphones: '#3a3a42', backpack: true, device: 'monitor', iris: '#e6e8ef',
      traits: ['tenang', 'suka muzik', 'suka malam', 'independent', 'jarang bercakap', 'deep thinker'],
      likes: ['bean', 'win'], stressMood: 'tired',
      lines: {
        work: ['...', 'Audio mix', 'Rolling.', '♪'],
        idle: ['♪ ♪', '...', 'Malam lagi best'],
        stress: ['...', '*volume up*', 'Hmm.'],
        done: ['Wrap.', '👍'],
        fire: ['...API.'], help: ['*padam diam-diam*'], thanks: ['Thanks.'],
        chat: ['Hmm.', 'Okay.', '♪'],
      },
    },
    {
      id: 'white', name: 'Aina', role: 'copywriter', gender: 'girl', color: '#ecebe8', hairLong: true,
      hoodie: '#f4f2ee', pants: '#e6e0d2', hat: { type: 'cap', color: '#f4f2ee', logo: '#1d2a55' }, item: 'phone', bag: true, device: 'laptop', iris: '#3a3f4b',
      traits: ['sweet', 'penyayang', 'suka haiwan', 'suka aesthetic', 'mudah tersentuh', 'family girl'],
      likes: ['bean', 'sofa', 'books'], stressMood: 'sad',
      lines: {
        work: ['Ayat ni lagi sedap...', 'Tagline baru!', 'Proofread jap', 'Copy siap draf'],
        idle: ['Comel kucing ni 🐱', 'Aesthetic gila', 'Rindu family'],
        stress: ['Huhu... banyaknya kerja', 'Sedih la...', 'Okay, boleh... 🥺'],
        done: ['Yay siap! 🤍', 'Puas hati~'],
        fire: ['Takutnya!!'], help: ['Saya tolong!'], thanks: ['Terharu 🥹'],
        chat: ['Comelnya!', 'Awak okay?', 'Sayang korang 🤍'],
      },
    },
    {
      id: 'navy', name: 'Hafiz', role: 'account-manager', gender: 'boy', color: '#24346e',
      hoodie: '#1f2a55', hoodieMark: '#f4f4f4', track: true, pants: '#1b1d22', headphones: '#1d1d24', device: 'monitor', iris: '#e6e8ef',
      traits: ['kompetitif', 'suka sukan', 'disiplin', 'suka cabaran', 'tak suka drama', 'goal oriented'],
      likes: ['arcade', 'win'], stressMood: 'focused',
      lines: {
        work: ['Client meeting 3pm', 'KPI on target', 'Strategi Q4', 'Proposal hantar'],
        idle: ['Push-up 20 kali', 'Siapa nak lawan?', 'Target minggu ni?'],
        stress: ['Fokus. Deadline.', 'Tiada drama.', 'Cabaran diterima.'],
        done: ['Deal closed.', 'Target capai 🏆'],
        fire: ['Situasi kritikal!'], help: ['Aku ambil alih'], thanks: ['Kerja berpasukan 👊'],
        chat: ['Lawan aku?', 'Disiplin!', 'Next target.'],
      },
    },
    {
      id: 'lilac', name: 'Nadia', role: 'hr', gender: 'girl', color: '#b79be6', hairLong: true, bow: '#e93d82',
      hoodie: '#c9b3ee', pants: '#ece4d6', item: 'iced', bag: true, device: 'laptop', caring: true,
      traits: ['lembut', 'suka seni', 'suka dgr lagu', 'mudah baper', 'manja', 'caring'],
      likes: ['sofa', 'bean', 'coffee'], stressMood: 'sad',
      lines: {
        work: ['Onboarding staf baru', 'Survey team ✨', 'Jadual cuti', 'Team bonding plan'],
        idle: ['Lagu ni sedih 🥺', 'Lukis jap~', 'Semua okay?'],
        stress: ['Baper sikit...', 'Peluk jap?', 'Okay je... 🥹'],
        done: ['Siap dengan kasih 💜', 'Yay~'],
        fire: ['Eh eh API!'], help: ['Nadia tolong!'], thanks: ['Terima kasih sayang 💜'],
        comfort: ['Okay tak? Rehat jap 💜', 'Jangan stress, ada kami', 'Nak air? 🧋'],
        chat: ['Semua sihat?', 'Comel la korang', 'Peluk! 💜'],
      },
    },
  ];

  const FIRE = {
    id: 'bomba', name: 'Bomba', color: '#8a93a6', gender: 'boy', hoodie: '#f76b15', pants: '#26324a', hat: { type: 'helmet' },
    traits: ['berani', 'cekap'], likes: [], stressMood: 'focused',
    lines: { help: ['Bomba sampai!', 'Bertenang semua!'], done: ['ALL CLEAR!'] },
  };

  const byId = new Map(CREW.map((m) => [m.id, m]));
  const byRole = new Map(CREW.map((m) => [m.role, m]));

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

  PO.mascots = { CREW, FIRE, get: (id) => byId.get(id), forRole: (role) => byRole.get(role), intern };
})(window.PO = window.PO || {});
