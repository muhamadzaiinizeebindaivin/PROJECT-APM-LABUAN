// src/constants/operasiConstants.js

export const CATEGORY_OPTIONS = [
  "MSS - Musnah Sarang Serangga",
  "KJR - Kemalangan Jalan Raya",
  "KMU - Kes Menangkap Ular",
  "KBD - Kes Bunuh Diri",
  "KK - Kes Kebakaran",
  "SKT - Sakit (Medikal/Trauma)",
  "KTK - Kemalangan Tempat Kerja",
  "PT - Pokok Tumbang",
  "KBR - Kes Kebakaran",
  'ML - Mangsa Lemas',
  "KB - Kes Bergaduh",
  "MHL - Menangkap Haiwan Liar",
  "MHP - Menangkap Haiwan Peliharaan",
  "MT - Mangsa Terperangkap",
  "LLK - Lain-lain kes"
];

export const CALAMITY_CATEGORIES = [
  { key: 'KJR', label: 'Kes Kemalangan Jalan Raya', color: '#ef4444' },
  { key: 'SKT', label: 'Sakit (Medikal/Trauma)', color: '#ec4899' },
  { key: 'MSS', label: 'Memusnah Sarang Serangga', color: '#eab308' },
  { key: 'KTK', label: 'Kemalangan Tempat Kerja', color: '#14b8a6' },
  { key: 'KBD', label: 'Kes Bunuh Diri', color: '#64748b' },
  { key: 'KBR', label: 'Kes Kebakaran', color: '#dc2626' },
  { key: 'MT', label: 'Mangsa Terperangkap', color: '#7c3aed' },
  { key: 'ML', label: 'Mangsa Lemas', color: '#0ea5e9' },
  { key: 'KMU', label: 'Kes Menangkap Ular', color: '#f97316' },
  { key: 'LLK', label: 'Lain-lain Kes', color: '#94a3b8' },
  { key: 'KK', label: 'Khidmat Khas', color: '#a855f7' },
  { key: 'KB', label: 'Kes Bergaduh', color: '#f43f5e' },
  { key: 'MHP', label: 'Menangkap Haiwan Peliharaan', color: '#22c55e' },
  { key: 'MHL', label: 'Menangkap Haiwan Liar', color: '#65a30d' },
  { key: 'PT', label: 'Pokok Tumbang', color: '#84cc16' },
];

export const getCalamityMeta = (key) =>
  CALAMITY_CATEGORIES.find(c => c.key === key) || CALAMITY_CATEGORIES[10];

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const getCalamityLogoUrl = (key) =>
  key ? `${SUPABASE_URL}/storage/v1/object/public/logo/${key}.png` : null;

export const getCategoryColor = (id) => {
  const colors = {
    "KJR": "#ef4444", "KMU": "#f97316", "MSS": "#eab308", "ML": "#3b82f6",
    "SKT": "#a855f7", "KTK": "#ec4899", "MT": "#14b8a6", "KK": "#f43f5e",
    "KBD": "#64748b", "LLK": "#94a3b8"
  };
  return colors[id] || "#3b82f6";
};
