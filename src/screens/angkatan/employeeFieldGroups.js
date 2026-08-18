export const EMPLOYEE_TABS = ['Identiti', 'Perkhidmatan', 'Insurans', 'Pangkat', 'Waris', 'Sijil'];

// Ordre unique, exactement celui des colonnes Excel — plus de sous-sections/onglets.
// Sijil (certificats) reste à part, toujours rendu en dernier séparément.
export const ALL_FIELDS = [
  { key: 'negeri', label: 'Negeri', type: 'text' },
  { key: 'daerah', label: 'Daerah', type: 'text' },
  { key: 'no_anggota', label: 'No. Anggota', type: 'text' },
  { key: 'pangkat', label: 'Pangkat', type: 'text' },
  { key: 'tarikh_terima_pangkat_terkini', label: 'Tarikh Terima Pangkat Terkini', type: 'text' },
  { key: 'nama', label: 'Nama', type: 'text' },
  { key: 'ic_no', label: 'Nombor Kad Pengenalan', type: 'ic' },
  { key: 'umur', label: 'Umur', type: 'text' },
  { key: 'jantina', label: 'Jantina', type: 'jantina_picker' },
  { key: 'contact', label: 'No. Telefon', type: 'multiline_list' },
  { key: 'alamat_email', label: 'Alamat E-mel', type: 'multiline_list' },
  { key: 'alamat_tempat_tinggal', label: 'Alamat Tempat Tinggal', type: 'text' },
  { key: 'jenis_darah', label: 'Jenis Darah', type: 'text' },
  { key: 'tarikh_menyertai_apm', label: 'Tarikh Menyertai APM', type: 'date' },
  { key: 'tempoh_berkhidmat', label: 'Tempoh Berkhidmat (Tahun)', type: 'computed_years', fromDateKey: 'tarikh_menyertai_apm' },
  { key: 'tarikh_aktif_kad', label: 'Tarikh Aktif Kad', type: 'date' },
  { key: 'tarikh_tamat_kad', label: 'Tarikh Tamat Kad', type: 'date' },
  { key: 'tempoh_baki_aktif_kad_hari', label: 'Tempoh Baki Aktif Kad (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_kad' },
  { key: 'insuran_kelompok_individu', label: 'Insuran (Kelompok/Individu)', type: 'text' },
  { key: 'insuran_aktif_tidak', label: 'Insuran (Aktif/Tidak)', type: 'text' },
  { key: 'tarikh_tamat_insuran', label: 'Tarikh Tamat Insuran', type: 'date' },
  { key: 'tempoh_baki_aktif_insuran_hari', label: 'Tempoh Baki Aktif Insuran (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_insuran' },
  { key: 'perkeso_jabatan_individu', label: 'Perkeso (Jabatan/Individu)', type: 'text' },
  { key: 'perkeso_aktif_tidak', label: 'Perkeso (Aktif/Tidak)', type: 'text' },
  { key: 'tarikh_tamat_perkeso', label: 'Tarikh Tamat Perkeso', type: 'date' },
  { key: 'tempoh_baki_caruman_perkeso_hari', label: 'Tempoh Baki Caruman Perkeso (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_perkeso' },
  { key: 'status_myaspa', label: 'Status MyASPA', type: 'text' },
  { key: 'status_keaktifan', label: 'Status Keaktifan', type: 'text' },
  
  { key: 'tugas_hakiki', label: 'Tugas Hakiki', type: 'text' },
  { key: 'akademik_tertinggi', label: 'Akademik Tertinggi', type: 'text' },
  { key: 'senarai_kursus', label: 'Senarai Kursus', type: 'multiline_list' },
  { key: 'senarai_penganugerahan', label: 'Senarai Penganugerahan', type: 'multiline_list' },
  { key: 'kompeni', label: 'Kompeni', type: 'text' },
  { key: 'no_rujukan_surat_lkpl', label: 'No. Rujukan Surat L/KPL', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_lkpl', label: 'Tarikh Kenaikan Pangkat L/KPL', type: 'date' },
  { key: 'no_rujukan_surat_kpl', label: 'No. Rujukan Surat KPL', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_kpl', label: 'Tarikh Kenaikan Pangkat KPL', type: 'date' },
  { key: 'no_rujukan_surat_sjn', label: 'No. Rujukan Surat SJN', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_sjn', label: 'Tarikh Kenaikan Pangkat SJN', type: 'date' },
  { key: 'no_siri_watikah_pwi', label: 'No. Siri Watikah PW I', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_pwi', label: 'Tarikh Kenaikan Pangkat PWI', type: 'date' },
  { key: 'no_siri_watikah_pwii', label: 'No. Siri Watikah PW II', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_pwii', label: 'Tarikh Kenaikan Pangkat PW II', type: 'date' },
  { key: 'no_siri_watikah_pelantikan_pertama', label: 'No. Siri Watikah Pelantikan Pertama', type: 'text' },
  { key: 'tarikh_pelantikan_pasukan_pertama', label: 'Tarikh Pelantikan Pasukan Pertama', type: 'date' },
  { key: 'tarikh_tamat_watikah_1', label: 'Tarikh Tamat Watikah 1', type: 'date' },
  { key: 'tempoh_aktif_watikah_hari_1', label: 'Tempoh Aktif Watikah 1 (Hari)', type: 'text' },
  { key: 'no_siri_watikah_1', label: 'No. Siri Watikah Kenaikan Pangkat 1', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_1', label: 'Sejarah Kenaikan Pegawai Pasukan 1', type: 'date' },
  { key: 'tarikh_tamat_watikah_2', label: 'Tarikh Tamat Watikah 2', type: 'date' },
  { key: 'tempoh_aktif_watikah_hari_2', label: 'Tempoh Aktif Watikah 2 (Hari)', type: 'text' },
  { key: 'no_siri_watikah_2', label: 'No. Siri Watikah Kenaikan Pangkat 2', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_2', label: 'Sejarah Kenaikan Pegawai Pasukan 2', type: 'date' },
  { key: 'tarikh_tamat_watikah_3', label: 'Tarikh Tamat Watikah 3', type: 'date' },
  { key: 'tempoh_aktif_watikah_hari_3', label: 'Tempoh Aktif Watikah 3 (Hari)', type: 'text' },
  { key: 'no_siri_watikah_3', label: 'No. Siri Watikah Kenaikan Pangkat 3', type: 'text' },
  { key: 'tarikh_kenaikan_pangkat_3', label: 'Sejarah Kenaikan Pegawai Pasukan 3', type: 'date' },
  { key: 'tarikh_tamat_watikah_4', label: 'Tarikh Tamat Watikah 4', type: 'date' },
  { key: 'tempoh_aktif_watikah_4_hari', label: 'Tempoh Aktif Watikah 4 (Hari)', type: 'text' },
  { key: 'sejarah_penyambungan_1', label: 'Sejarah Penyambungan 1', type: 'date' },
  { key: 'tarikh_tamat_surat_penyambungan_1', label: 'Tarikh Tamat Surat Penyambungan 1', type: 'date' },
  { key: 'tempoh_aktif_watikah_5_hari', label: 'Tempoh Aktif Watikah 5 (Hari)', type: 'text' },
  { key: 'sejarah_penyambungan_2', label: 'Sejarah Penyambungan 2', type: 'date' },
  { key: 'tarikh_tamat_surat_penyambungan_2', label: 'Tarikh Tamat Surat Penyambungan 2', type: 'date' },
  { key: 'tempoh_aktif_watikah_6_hari', label: 'Tempoh Aktif Watikah 6 (Hari)', type: 'text' },
  { key: 'penyambungan_terkini', label: 'Penyambungan Terkini', type: 'date' },
  { key: 'tarikh_tamat_surat_penyambungan_terkini', label: 'Tarikh Tamat Surat Penyambungan 3', type: 'text' },
  { key: 'tempoh_aktif_watikah_terkini_hari', label: 'Tempoh Aktif Watikah 7 (Hari)', type: 'text' },
  { key: 'nama_waris', label: 'Nama Waris', type: 'text' },
  { key: 'hubungan_waris', label: 'Hubungan Waris', type: 'text' },
  { key: 'no_telefon_waris', label: 'No. Telefon Waris', type: 'text' },
  { key: 'catatan', label: 'Catatan', type: 'text' },
];

// Regroupement en sections avec en-têtes — même ordre exact que ALL_FIELDS
// (colonnes Excel), juste segmenté visuellement. Chaque section référence une
// plage de clés contiguë dans ALL_FIELDS.
const SECTION_BOUNDARIES = [
  { title: 'Maklumat Peribadi', startKey: 'negeri', endKey: 'kompeni' },
  { title: 'Lain-lain Pangkat', startKey: 'no_rujukan_surat_lkpl', endKey: 'tarikh_kenaikan_pangkat_pwii' },
  { title: 'Pegawai Pasukan', startKey: 'no_siri_watikah_pelantikan_pertama', endKey: 'tempoh_aktif_watikah_4_hari' },
  { title: 'Penyambungan', startKey: 'sejarah_penyambungan_1', endKey: 'tempoh_aktif_watikah_terkini_hari' },
  { title: 'Maklumat Waris', startKey: 'nama_waris', endKey: 'catatan' },
];

export const FIELD_SECTIONS = SECTION_BOUNDARIES.map(({ title, startKey, endKey }) => {
  const startIdx = ALL_FIELDS.findIndex((f) => f.key === startKey);
  const endIdx = ALL_FIELDS.findIndex((f) => f.key === endKey);
  return { title, fields: ALL_FIELDS.slice(startIdx, endIdx + 1) };
});

export const FIELD_GROUPS = {
  Identiti: [
    { key: 'negeri', label: 'Negeri', type: 'text' },
    { key: 'daerah', label: 'Daerah', type: 'text' },
    { key: 'no_anggota', label: 'No. Anggota', type: 'text' },
    { key: 'nama', label: 'Nama', type: 'text' },
    { key: 'ic_no', label: 'Nombor Kad Pengenalan', type: 'ic' },
    { key: 'umur', label: 'Umur', type: 'text' },
    { key: 'jantina', label: 'Jantina', type: 'jantina_picker' },
    { key: 'contact', label: 'No. Telefon', type: 'multiline_list' },
    { key: 'alamat_email', label: 'Alamat E-mel', type: 'multiline_list' },
    { key: 'alamat_tempat_tinggal', label: 'Alamat Tempat Tinggal', type: 'text' },
    { key: 'jenis_darah', label: 'Jenis Darah', type: 'text' },
  ],
  Perkhidmatan: [
    { key: 'pangkat', label: 'Pangkat', type: 'text' },
    
    { key: 'tarikh_terima_pangkat_terkini', label: 'Tarikh Terima Pangkat Terkini', type: 'text' },
    { key: 'tarikh_menyertai_apm', label: 'Tarikh Menyertai APM', type: 'date' },
    { key: 'tempoh_berkhidmat', label: 'Tempoh Berkhidmat (Tahun)', type: 'computed_years', fromDateKey: 'tarikh_menyertai_apm' },
    { key: 'status_myaspa', label: 'Status MyASPA', type: 'text' },
    { key: 'status_keaktifan', label: 'Status Keaktifan', type: 'text' },
    { key: 'tugas_hakiki', label: 'Tugas Hakiki', type: 'text' },
    { key: 'akademik_tertinggi', label: 'Akademik Tertinggi', type: 'text' },
    { key: 'senarai_kursus', label: 'Senarai Kursus', type: 'multiline_list' },
    { key: 'senarai_penganugerahan', label: 'Senarai Penganugerahan', type: 'multiline_list' },
    { key: 'kompeni', label: 'Kompeni', type: 'text' },
    
  ],
  Insurans: [
    { key: 'tarikh_aktif_kad', label: 'Tarikh Aktif Kad', type: 'date' },
    { key: 'tarikh_tamat_kad', label: 'Tarikh Tamat Kad', type: 'date' },
    { key: 'tempoh_baki_aktif_kad_hari', label: 'Tempoh Baki Aktif Kad (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_kad' },
    { key: 'insuran_kelompok_individu', label: 'Insuran (Kelompok/Individu)', type: 'text' },
    { key: 'insuran_aktif_tidak', label: 'Insuran (Aktif/Tidak)', type: 'text' },
    { key: 'tarikh_tamat_insuran', label: 'Tarikh Tamat Insuran', type: 'date' },
    { key: 'tempoh_baki_aktif_insuran_hari', label: 'Tempoh Baki Aktif Insuran (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_insuran' },
    { key: 'perkeso_jabatan_individu', label: 'Perkeso (Jabatan/Individu)', type: 'text' },
    { key: 'perkeso_aktif_tidak', label: 'Perkeso (Aktif/Tidak)', type: 'text' },
    { key: 'tarikh_tamat_perkeso', label: 'Tarikh Tamat Perkeso', type: 'date' },
    { key: 'tempoh_baki_caruman_perkeso_hari', label: 'Tempoh Baki Caruman Perkeso (Hari)', type: 'computed_days', fromDateKey: 'tarikh_tamat_perkeso' },
  ],
  Pangkat: [
    { key: 'no_rujukan_surat_lkpl', label: 'No. Rujukan Surat L/KPL', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_lkpl', label: 'Tarikh Kenaikan Pangkat L/KPL', type: 'date' },
    { key: 'no_rujukan_surat_kpl', label: 'No. Rujukan Surat KPL', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_kpl', label: 'Tarikh Kenaikan Pangkat KPL', type: 'date' },
    { key: 'no_rujukan_surat_sjn', label: 'No. Rujukan Surat SJN', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_sjn', label: 'Tarikh Kenaikan Pangkat SJN', type: 'date' },
    { key: 'no_siri_watikah_pwi', label: 'No. Siri Watikah PW I', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_pwi', label: 'Tarikh Kenaikan Pangkat PWI', type: 'date' },
    { key: 'no_siri_watikah_pwii', label: 'No. Siri Watikah PW II', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_pwii', label: 'Tarikh Kenaikan Pangkat PW II', type: 'date' },
    { key: 'no_siri_watikah_pelantikan_pertama', label: 'No. Siri Watikah Pelantikan Pertama', type: 'text' },
    { key: 'tarikh_pelantikan_pasukan_pertama', label: 'Tarikh Pelantikan Pasukan Pertama', type: 'date' },
    { key: 'tarikh_tamat_watikah_1', label: 'Tarikh Tamat Watikah 1', type: 'date' },
    { key: 'tempoh_aktif_watikah_hari_1', label: 'Tempoh Aktif Watikah 1 (Hari)', type: 'text' },
    { key: 'no_siri_watikah_1', label: 'No. Siri Watikah Kenaikan Pangkat 1', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_1', label: 'Sejarah Kenaikan Pegawai Pasukan 1', type: 'date' },
    { key: 'tarikh_tamat_watikah_2', label: 'Tarikh Tamat Watikah 2', type: 'date' },
    { key: 'tempoh_aktif_watikah_hari_2', label: 'Tempoh Aktif Watikah 2 (Hari)', type: 'text' },
    { key: 'no_siri_watikah_2', label: 'No. Siri Watikah Kenaikan Pangkat 2', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_2', label: 'Sejarah Kenaikan Pegawai Pasukan 2', type: 'date' },
    { key: 'tarikh_tamat_watikah_3', label: 'Tarikh Tamat Watikah 3', type: 'date' },
    { key: 'tempoh_aktif_watikah_hari_3', label: 'Tempoh Aktif Watikah 3 (Hari)', type: 'text' },
    { key: 'no_siri_watikah_3', label: 'No. Siri Watikah Kenaikan Pangkat 3', type: 'text' },
    { key: 'tarikh_kenaikan_pangkat_3', label: 'Sejarah Kenaikan Pegawai Pasukan 3', type: 'date' },
    { key: 'tarikh_tamat_watikah_4', label: 'Tarikh Tamat Watikah 4', type: 'date' },
    { key: 'tempoh_aktif_watikah_4_hari', label: 'Tempoh Aktif Watikah 4 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_1', label: 'Sejarah Penyambungan 1', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_1', label: 'Tarikh Tamat Surat Penyambungan 1', type: 'date' },
    { key: 'tempoh_aktif_watikah_5_hari', label: 'Tempoh Aktif Watikah 5 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_2', label: 'Sejarah Penyambungan 2', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_2', label: 'Tarikh Tamat Surat Penyambungan 2', type: 'date' },
    { key: 'tempoh_aktif_watikah_6_hari', label: 'Tempoh Aktif Watikah 6 (Hari)', type: 'text' },
    { key: 'penyambungan_terkini', label: 'Penyambungan Terkini', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_terkini', label: 'Tarikh Tamat Surat Penyambungan 3', type: 'text' },
    { key: 'tempoh_aktif_watikah_terkini_hari', label: 'Tempoh Aktif Watikah 7 (Hari)', type: 'text' },
  ],
  Waris: [
    { key: 'nama_waris', label: 'Nama Waris', type: 'text' },
    { key: 'hubungan_waris', label: 'Hubungan Waris', type: 'text' },
    { key: 'no_telefon_waris', label: 'No. Telefon Waris', type: 'text' },
    { key: 'catatan', label: 'Catatan', type: 'text' },
  ],
};

export const emptyEmployeeForm = () => {
  const obj = { id: null };
  const keys = new Set(['nama', 'ic_no', 'pangkat', 'jantina', 'contact', 'photo_url', 'senarai_hitam']);
  [1, 2, 3].forEach((n) => {
    keys.add(`no_siri_watikah_${n}`);
    keys.add(`tarikh_kenaikan_pangkat_${n}`);
    keys.add(`tarikh_tamat_watikah_${n}`);
    keys.add(`tempoh_aktif_watikah_hari_${n}`);
  });
  Object.values(FIELD_GROUPS).forEach((group) => group.forEach((f) => keys.add(f.key)));
  keys.forEach((k) => { obj[k] = k === 'senarai_hitam' ? false : ''; });
  return obj;
};

// Convertit une date ISO (YYYY-MM-DD) en format standard Malaysia (DD/MM/YYYY)
// pour l'affichage — laisse tel quel tout ce qui n'est pas une date ISO
// (texte libre comme "TIDAK BERKAITAN", plages composées, etc.)
export const formatDateMY = (value) => {
  if (!value || typeof value !== 'string') return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export const formatICNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  let formatted = digits;
  if (digits.length > 6) formatted = `${digits.slice(0, 6)}-${digits.slice(6)}`;
  if (digits.length > 8) formatted = `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  return formatted;
};

// Calcule le nombre de jours restants jusqu'à une date de tamat (négatif si déjà expiré)
export const computeDaysRemaining = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

// Calcule le nombre d'années complètes de service depuis une date de
// menyertai APM (tient compte du mois/jour, pas juste une soustraction
// d'année brute — ex: rejoint le 15 déc. 2020, aujourd'hui 1 déc. 2024 →
// 3 ans complets, pas 4).
export const computeYearsOfService = (dateStr) => {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - start.getFullYear();
  const hasNotHadAnniversaryYet =
    today.getMonth() < start.getMonth() ||
    (today.getMonth() === start.getMonth() && today.getDate() < start.getDate());
  if (hasNotHadAnniversaryYet) years -= 1;
  return years < 0 ? 0 : years;
};