// data.js

// Statistics for the Angkatan Dashboard
export const ANGKATAN_STATS = [
  { rank: 'KAPT.', total: 1, active: 1, color: '#475569' },
  { rank: 'LT.', total: 2, active: 1, color: '#3b82f6' },
  { rank: 'LT.M', total: 18, active: 8, color: '#f97316' },
  { rank: 'SM', total: 6, active: 5, color: '#a855f7' },
  { rank: 'SJN.', total: 28, active: 26, color: '#0ea5e9' },
  { rank: 'KPL.', total: 21, active: 19, color: '#22c55e' },
  { rank: 'L/KPL.', total: 24, active: 17, color: '#10b981' },
  { rank: 'PBT.', total: 372, active: 194, color: '#1e40af' },
];

export const MEMBERSHIP_TREND = [
  { year: '2021', val: 18 }, { year: '2022', val: 44 }, 
  { year: '2023', val: 63 }, { year: '2024', val: 24 }, { year: '2025', val: 13 }
];

export const RANK_PROGRESSION = [
  { rank: 'KAPT - MEJ', lulus: 1, kenaikan: 1, lantikan: 0, kbp: 1, ptb: 0, aktif: 1, simpanan: 0 },
  { rank: 'LT - KAPT', lulus: 0, kenaikan: 0, lantikan: 0, kbp: 2, ptb: 0, aktif: 0, simpanan: 1 },
  { rank: 'LT.M - LT', lulus: 0, kenaikan: 0, lantikan: 0, kbp: 11, ptb: 0, aktif: 4, simpanan: 3 },
  { rank: 'SM - SK', lulus: 1, kenaikan: 1, lantikan: 0, kbp: 6, ptb: 0, aktif: 5, simpanan: 1 },
  { rank: 'SJN - SM', lulus: 9, kenaikan: 0, lantikan: 9, kbp: 4, ptb: 3, aktif: 16, simpanan: 4 },
  { rank: 'KPL - SJN', lulus: 3, kenaikan: 0, lantikan: 0, kbp: 0, ptb: 4, aktif: 15, simpanan: 4 },
  { rank: 'L/KPL - KPL', lulus: 4, kenaikan: 0, lantikan: 0, kbp: 4, ptb: 0, aktif: 8, simpanan: 4 },
];

export const KEWANGAN_SUMMARY = {
  totalAllocation: "333,552.48",
  year: "2026",
  title: "Angkatan Pertahanan Awam Malaysia WP Labuan"
};

export const KEWANGAN_BREAKDOWN = [
  { q: 'SUKUAN 1', months: 'JAN - MAC', spend: '369,980.78', percent: 26.12, color: '#3b82f6' },
  { q: 'SUKUAN 2', months: 'APR - JUN', spend: '596,191.40', percent: 42.09, color: '#0ea5e9' },
  { q: 'SUKUAN 3', months: 'JUL - SEPT', spend: '934,921.76', percent: 66.00, color: '#f59e0b' },
  { q: 'SUKUAN 4', months: 'OKT - DIS', spend: '1,412,462.53', percent: 99.71, color: '#22c55e' },
];

export const KEWANGAN_BUDGET = [
  { id: 1, kategori: 'BAYARAN ELAUN', perihal: 'E. Kasut', agihan: '20000.00', belanja: '0.00' },
  { id: 2, kategori: 'BAYARAN ELAUN', perihal: 'E. Makan', agihan: '215860.00', belanja: '0.00' },
  { id: 3, kategori: 'BAYARAN ELAUN', perihal: 'E. Pakaian', agihan: '80000.00', belanja: '0.00' },
  { id: 4, kategori: 'BAYARAN ELAUN', perihal: 'E. Perjalanan', agihan: '55000.00', belanja: '130.00' },
  { id: 5, kategori: 'BAYARAN ELAUN', perihal: 'E. Tugas Operasi', agihan: '240000.00', belanja: '39284.40' },
  { id: 6, kategori: 'BAYARAN ELAUN', perihal: 'E. Tugas P/Kewangan', agihan: '670000.00', belanja: '60676.00' },
  { id: 7, kategori: 'KUMPULAN WANG AMANAH', perihal: 'Op Tranche', agihan: '311760.00', belanja: '130000.00' },
  { id: 8, kategori: 'KUMPULAN WANG AMANAH', perihal: 'Tugas Hakiki OP', agihan: '4200.00', belanja: '0.00' },
  { id: 9, kategori: 'KUMPULAN WANG AMANAH', perihal: 'Kursus & Latihan', agihan: '13000.00', belanja: '0.00' },
  { id: 10, kategori: 'KUMPULAN WANG AMANAH', perihal: 'Kecemasan & Bencana', agihan: '33600.00', belanja: '0.00' },
  { id: 11, kategori: 'LAIN-LAIN', perihal: 'E. Memangku', agihan: '10131.00', belanja: '0.00' },
  { id: 12, kategori: 'LAIN-LAIN', perihal: 'B. Selenggara', agihan: '55274.00', belanja: '0.00' }
];

export const CATEGORIES = [
  { name: 'Pengurusan', count: 3, color: '#a855f7' },
  { name: 'Chameleon', count: 3, color: '#f97316' },
  { name: 'Operasi', count: 22, color: '#0ea5e9' },
  { name: 'MyASPA', count: 439, color: '#1e40af' },
];

export const COMMUNITY_PROGRAMS = [
  { id: 'TUSPA', label: 'SK Pekan Satu', detail: '30 Orang (19L, 11P)', color: '#f59e0b' },
  { id: 'TUSPA', label: 'SK Pantai', detail: '18 Orang (12L, 6P)', color: '#f59e0b' },
  { id: 'KASPA', label: 'SMA MAIWP', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'KASPA', label: 'SMK Lajau', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'KASPA', label: 'SMK Mutiara', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'KASPA', label: 'SMK Pantai', detail: 'Sekolah Menengah (Aktif)', color: '#ea580c' },
  { id: 'KASPA', label: 'SMK Rancha-Rancha', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'KASPA', label: 'SMK Taman Perumahan Bedaun', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'KASPA', label: 'SM Sains', detail: 'Sekolah Menengah', color: '#ea580c' },
  { id: 'PISPA', label: 'Institut Latihan Perindustrian (ILP) Labuan', detail: '34 Orang (2025)', color: '#10b981' },
  { id: 'PISPA', label: 'Kolej Matrikulasi Labuan (KML)', detail: 'Tidak Aktif', color: '#10b981' },
  { id: 'SISPA', label: 'UMS Kampus Antarabangsa Labuan', detail: '88 Orang (2025)', color: '#059669' },
  { id: 'CDA', label: 'Tiara Hotel', detail: '32 Orang', color: '#0284c7' },
  { id: 'CDA', label: 'RTM W.P. Labuan', detail: '16 Orang', color: '#0284c7' },
];

export const LATIHAN_ROADMAP = [
  { id: 1, title: 'Kursus Asas SISPA Sem 1 / Latihan Lanjutan Sem 3 & 5', date: '25 & 26 Jan', pax: 152, status: 'Selesai', color: '#22c55e', note: 'Sasaran: SISPA' },
  { id: 2, title: 'Kursus Asas Pertahanan Awam', date: '8 & 9 Feb', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: Orang Awam' },
  { id: 3, title: 'Karnival APM Peringkat APM WP Labuan', date: '22 Feb', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 4, title: 'Majlis Berbuka Puasa / Tazkirah', date: '12 Mac', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: Kakitangan/MYASPA' },
  { id: 5, title: 'Kursus Asas (PSPA) JBS Labuan', date: '12 & 13 Apr', pax: 21, status: 'Selesai', color: '#22c55e', note: 'Sasaran: JBS' },
  { id: 6, title: 'Sesi Townhall Dan Majlis Sambutan Hari Raya', date: '13 Apr', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 7, title: 'Latihan Setempat / Pengendalian Bot / Baywatch', date: '19 Apr', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 8, title: 'Temuduga Kenaikan Pangkat', date: '23-24 Apr', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 9, title: 'LISC 2025', date: '25-27 Apr', pax: 40, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 10, title: 'Latihan Pemantapan MYASPA (O,P&C)', date: '10 & 11 Mei', pax: 45, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA (O,P & C)' },
  { id: 11, title: 'Kursus FRLS Level 1', date: '26-30 Mei', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA (O.P & C)' },
  { id: 12, title: 'Kursus Jurulatih Asas Pertahanan Awam', date: '9-14 Jun', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA (O,P & C)' },
  { id: 13, title: 'Kursus Pegawai Tidak Bertauliah (PTB)', date: '13-18 Jun', pax: 30, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 14, title: 'Latihan Bulanan', date: '20 Jun', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 15, title: 'Latihan A&D', date: '20-22 Jun', pax: 90, status: 'Selesai', color: '#22c55e', note: 'Sasaran: SISPA' },
  { id: 16, title: 'Borneo Flora Festival @Labuan 2025', date: '26-30 Jun', pax: 30, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 17, title: 'Latihan Pengukuhan Pasukan', date: '2-3 Jul', pax: 12, status: 'Selesai', color: '#22c55e', note: 'Sasaran: Staf Tetap' },
  { id: 18, title: 'Latihan Refresher Selam Scuba', date: '9-10 Jul', pax: 20, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 19, title: 'Latihan Antara Agensi (Pengurusan Rabbies)', date: '18-19 Jul', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA & Agensi' },
  { id: 20, title: 'Kursus Asas Siri 4', date: '23-24 Jul', pax: 50, status: 'Selesai', color: '#22c55e', note: 'Sasaran: PISPA' },
  { id: 21, title: 'Sesi Townhall', date: '13 Ogos', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 22, title: 'Latihan Bulanan (Menyelamat Di Air)', date: '14 Ogos', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 23, title: 'Latihan Menyelamat Air Deras (Papar)', date: '25-28 Sep', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA O.P.C' },
  { id: 24, title: 'Pengendalian Boat & Menyelamat Di Air', date: '11 & 12 Okt', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 25, title: 'Pengurusan Bencana & Pusat Pemindahan', date: '25 Okt', pax: 60, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
  { id: 26, title: 'Penutupan Latihan', date: '8 Nov', pax: 80, status: 'Selesai', color: '#22c55e', note: 'Sasaran: MYASPA' },
];

export const LOGISTIK_SEA = [
  { type: 'Bot Getah / Fiberglass', model: "Inflatable 4M (14') - 40HP 2 Stroke", qty: 1, status: 'Baik' },
  { type: 'Bot Getah / Fiberglass', model: "Amphibious Sealegs 7.1M (23')", qty: 1, status: 'Baik' },
  { type: 'Bot Aluminium', model: "Aluminium 5.4M (17') - 60HP 4 Stroke", qty: 2, status: 'Baik' },
  { type: 'Bot Aluminium', model: "Aluminium 14'", qty: 2, status: 'Baik' },
  { type: 'Fibreglass', model: "Fibreglass 14' - 15HP", qty: 5, status: 'Baik' },
];

export const LOGISTIK_LAND = [
  { type: 'Kenderaan 4x4', model: 'Toyota Double Cab 2.5 MT', reg: 'WUS 538', status: 'Baik' },
  { type: 'Kenderaan 4x4', model: 'Toyota Hilux D/C 2.4 E AT', reg: 'MALAYSIA 1370', status: 'Baik' },
  { type: 'Kenderaan 4x4', model: 'Ford Everest', reg: 'LC 2191', status: 'Baik' },
  { type: 'Lori', model: 'MTB 170 Haicom Perkasa 3 Ton', reg: 'WHQ 2617', status: 'Baik' },
  { type: 'Ambulans', model: 'Hiace Window Van', reg: 'W4225D', status: 'Baik' },
  { type: 'Motosikal', model: 'Modenas Kriss AN110F', reg: 'WLJ 6704', status: 'Baik' },
  { type: 'Motosikal', model: 'Modenas Kriss MJ110', reg: 'VLJ 9240', status: 'Baik' },
  { type: 'Motosikal', model: 'Modenas Kriss MJ110', reg: 'VLJ 9232', status: 'Baik' },
];

export const ORG_CHART = {
  head: { 
    title: "PEGAWAI PERTAHANAN AWAM WP LABUAN", 
    role: "PEGAWAI PERTAHANAN AWAM KP9", 
    name: "MEJ. (PA)  WAN MOHD JABIR BIN WAN MOHD BADRUDIN" 
  },
  subHead: { 
    title: "PENOLONG PEGAWAI PERTAHANAN AWAM WP LABUAN", 
    role: "PENOLONG PEGAWAI PERTAHANAN AWAM KP5", 
    name: "" 
  },
  branches: [
    {
      title: "BAHAGIAN PENGURUSAN ANGKATAN LATIHAN DAN OPERASI",
      leader: { role: "PEMBANTU PERTAHANAN AWAM KP2 (TBK2) KP3", name: "LT. (PA) MARINUS BIN MATHIUS" },
      units: [
        { label: "BAHAGIAN PENGURUSAN LATIHAN", role: "PEGAWAI PERTAHANAN AWAM (KP1)", name: "LT.M. (PA) MOHD ANIQ AMZAR BIN KAHAR", color: "#0033cc" },
        { label: "BAHAGIAN PENGURUSAN OPERASI & SEKRETARIAT", role: "PEMBANTU PERTAHANAN AWAM KP1", name: "KOSONG", color: "#f97316" },
        { label: "BAHAGIAN DOKUMENTASI", role: "PEMBANTU PERTAHANAN AWAM KP1 (KONTRAK)", name: "KOSONG", color: "#f97316" },
        { label: "BAHAGIAN PENGURUSAN SEKRETARIAT/PRO", role: "PEMBANTU PERTAHANAN AWAM KP1 (KONTRAK)", name: "DAYANG NURSYAFIKA BINTI AWANG LIMON", color: "#0033cc" }
      ]
    },
    {
      title: "BAHAGIAN KHIDMAT PENGURUSAN",
      leader: { role: "PEMBANTU TADBIR (PERKERANIAN/OPERASI) N2", name: "PN. NORHANA BINTI SABUDIN" },
      units: [
        { label: "UNIT PENTADBIRAN", role: "PEMBANTU TADBIR (P/O) N1", name: "CIK FATIN OTHMAN", color: "#0033cc" },
        { label: "UNIT KEWANGAN", role: "PEMBANTU TADBIR (KEW) W1", name: "EN. AHMAD SAH BIN SANGKA", color: "#0033cc" }
      ],
      supportStaff: [
        { role: "PEMBANTU KHIDMAT AM H1 (PEMANDU)", name: "EN. AG. JALI BIN AG. ALI" },
        { role: "PEMBANTU KHIDMAT AM H1", name: "EN. MOHD RIZUAN BIN ABDULLAH" },
        { role: "PEMBANTU KHIDMAT AM H1", name: "PN. NORA JAMES" },
        { role: "PEMBANTU KHIDMAT AM H1", name: "EN. MOHD RASHID BIN TAHIR" }
      ]
    }
  ]
};

export const PENTADBIRAN_ACTIVITIES = [
  { category: "Kursus & Latihan", items: [
    { title: "Kursus Asas Guru TUSPA/KASPA", date: "27-28 Sept", status: "26 Peserta" },
    { title: "Latihan Asas PISPA ILP Labuan", date: "15-16 Nov", status: "34 Tamat" },
    { title: "Taklimat First Aider (Maritim)", date: "16 Dis", status: "25 Peserta" }
  ]},
  { category: "Majlis & Kebajikan", items: [
    { title: "Majlis Apresiasi & Pangkat", date: "02 Okt", status: "31 Penerima" },
    { title: "Majlis Himpunan Setia 2025", date: "28 Nov", status: "44 Anggota" },
    { title: "Program PKM Beret JKM", date: "14 Okt", status: "8 Pelatih" }
  ]},
  { category: "Status Sijil", items: [
    { title: "LKPA Penyelamat Pantai", status: "Semakan PPAD", color: "#f97316" },
    { title: "Kursus Kejurulatihan Asas", status: "Telah Diedar", color: "#22c55e" },
    { title: "Latihan Sispa Siri 2/2025", status: "38 Peserta", color: "#0ea5e9" }
  ]}
];

export const MERS_SUMMARY = {
  year: "2026",
  totalJan: 95,
  totalFeb: 81,
  topCaseId: "KMU",
  topCaseLabel: "Menangkap Ular",
  topCaseTotal: 76
};

export const MERS_MONTHLY_TREND = [
  { month: 'Jan', total: 95 },
  { month: 'Feb', total: 81 }
];

export const MERS_CASE_BREAKDOWN = [
  { id: 'KMU', label: 'Menangkap Ular', jan: 42, feb: 34, total: 76, color: '#f59e0b' },
  { id: 'MSS', label: 'Sarang Serangga', jan: 10, feb: 14, total: 24, color: '#ea580c' },
  { id: 'SKT', label: 'Kes Sakit / Perubatan', jan: 11, feb: 7, total: 18, color: '#ef4444' },
  { id: 'KJR', label: 'Kemalangan Jalan Raya', jan: 20, feb: 16, total: 36, color: '#3b82f6' },
  { id: 'LLK', label: 'Lain-Lain Kes', jan: 12, feb: 10, total: 22, color: '#64748b' },
  { id: 'NIL', label: 'Bomba / Lemas / Bunuh Diri', jan: 0, feb: 0, total: 0, color: '#e2e8f0' }
];