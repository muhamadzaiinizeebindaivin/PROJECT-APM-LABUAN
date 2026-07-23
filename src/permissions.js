const ALL_TABS = ['Utama', 'Pentadbiran', 'Kewangan', 'Angkatan', 'Latihan', 'Logistik', 'Operasi', 'Sekretariat'];

export const ROLE_PERMISSIONS = {
  admin: [...ALL_TABS, 'Pengurusan Akaun'],
  pentadbiran: ALL_TABS,
  kewangan: ALL_TABS,
  logistik: ALL_TABS,
  angkatan: ALL_TABS,
  sekretariat: ALL_TABS,
  latihan: ALL_TABS,
  operasi: ALL_TABS,
};

// Rôle "propriétaire" de chaque écran — sert à autoriser l'édition (pas juste l'affichage)
export const SECTION_OWNER = {
  Pentadbiran: 'pentadbiran',
  Kewangan: 'kewangan',
  Logistik: 'logistik',
  Angkatan: 'angkatan',
  Sekretariat: 'sekretariat',
  Latihan: 'latihan',
  Operasi: 'operasi',
};

// true si ce rôle a le droit de modifier les données de cette section
export const canEditSection = (userRole, sectionName) =>
  userRole === 'admin' || SECTION_OWNER[sectionName] === userRole;