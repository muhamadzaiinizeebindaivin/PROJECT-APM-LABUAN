// src/constants/operasiConstants.js

export const CATEGORY_OPTIONS = [
  "KJR - Kemalangan Jalan Raya",
  "KMU - Kes Menangkap Ular",
  "MSS - Musnah Sarang Serangga",
  "ML - Mangsa Lemas",
  "SKT - Sakit",
  "KTK - Kemalangan Tempat Kerja",
  "MT - Mangsa Terperangkap",
  "KK - Kes Kebakaran",
  "KBD - Kes Bunuh Diri",
  "LLK - Lain-lain kes"
];

export const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CALAMITY_CATEGORIES = [
  { key: 'KJR', label: 'Kes Kemalangan Jalan Raya', color: '#ef4444' },
  { key: 'KM', label: 'Kes Menangkap Ular', color: '#f97316' },
  { key: 'MMS', label: 'Memusnah Sarang Serangga', color: '#eab308' },
  { key: 'KBD', label: 'Kes Bunuh Diri', color: '#64748b' },
  { key: 'KK', label: 'Khidmat Khas', color: '#a855f7' },
  { key: 'SKT', label: 'Sakit (Medikal/Trauma)', color: '#ec4899' },
  { key: 'KTK', label: 'Kemalangan Tempat Kerja', color: '#14b8a6' },
  { key: 'PT', label: 'Pokok Tumbang', color: '#84cc16' },
  { key: 'KBR', label: 'Kes Kebakaran', color: '#dc2626' },
  { key: 'ML', label: 'Mangsa Lemas', color: '#0ea5e9' },
  { key: 'LLK', label: 'Lain-lain Kes', color: '#94a3b8' },
  { key: 'KB', label: 'Kes Bergaduh', color: '#f43f5e' },
  { key: 'MHL', label: 'Menangkap Haiwan Liar', color: '#65a30d' },
  { key: 'MHP', label: 'Menangkap Haiwan Peliharaan', color: '#22c55e' },
  { key: 'MT', label: 'Mangsa Terperangkap', color: '#7c3aed' },
];

export const getCalamityMeta = (key) =>
  CALAMITY_CATEGORIES.find(c => c.key === key) || CALAMITY_CATEGORIES[10];

export const getCategoryColor = (id) => {
  const colors = {
    "KJR": "#ef4444", "KMU": "#f97316", "MSS": "#eab308", "ML": "#3b82f6",
    "SKT": "#a855f7", "KTK": "#ec4899", "MT": "#14b8a6", "KK": "#f43f5e",
    "KBD": "#64748b", "LLK": "#94a3b8"
  };
  return colors[id] || "#3b82f6";
};
