export const EMPLOYEE_TABS = ['Identiti', 'Perkhidmatan', 'Kad/Insurans', 'Pangkat', 'Watikah', 'Waris', 'Sijil'];

export const FIELD_GROUPS = {
  Identiti: [
    { key: 'nama', label: 'Nama', type: 'text' },
    { key: 'ic_no', label: 'No. IC', type: 'ic' },
    { key: 'jantina', label: 'Jantina', type: 'jantina_picker' },
    { key: 'umur', label: 'Umur', type: 'text' },
    { key: 'contact', label: 'No. Telefon', type: 'text' },
    { key: 'alamat_email', label: 'Alamat E-mel', type: 'text' },
    { key: 'alamat_tempat_tinggal', label: 'Alamat Tempat Tinggal', type: 'text' },
    { key: 'jenis_darah', label: 'Jenis Darah', type: 'text' },
    { key: 'negeri', label: 'Negeri', type: 'text' },
    { key: 'daerah', label: 'Daerah', type: 'text' },
    { key: 'no_anggota', label: 'No. Anggota', type: 'text' },
  ],
  Perkhidmatan: [
    { key: 'pangkat', label: 'Pangkat', type: 'text' },
    { key: 'tarikh_lantikan', label: 'Tarikh Lantikan', type: 'date' },
    { key: 'tarikh_terima_pangkat_terkini', label: 'Tarikh Terima Pangkat Terkini', type: 'date' },
    { key: 'tarikh_menyertai_apm', label: 'Tarikh Menyertai APM', type: 'date' },
    { key: 'tempoh_berkhidmat', label: 'Tempoh Berkhidmat (Tahun)', type: 'text' },
    { key: 'tugas_hakiki', label: 'Tugas Hakiki', type: 'text' },
    { key: 'kompeni', label: 'Kompeni', type: 'text' },
    { key: 'akademik_tertinggi', label: 'Akademik Tertinggi', type: 'multiline_list' },
    { key: 'senarai_kursus', label: 'Senarai Kursus', type: 'multiline_list' },
    { key: 'senarai_penganugerahan', label: 'Senarai Penganugerahan', type: 'text' },
    { key: 'status_myaspa', label: 'Status MyASPA', type: 'text' },
    { key: 'status_keaktifan', label: 'Status Keaktifan', type: 'text' },
    { key: 'senarai_hitam', label: 'Senarai Hitam', type: 'boolean' },
  ],
  'Kad/Insurans': [
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
  ],
  Watikah: [
    { key: 'no_siri_watikah_pelantikan_pertama', label: 'No. Siri Watikah Pelantikan Pertama', type: 'text' },
    { key: 'tarikh_pelantikan_pasukan_pertama', label: 'Tarikh Pelantikan Pasukan Pertama', type: 'date' },
    { key: 'tarikh_tamat_watikah_4', label: 'Tarikh Tamat Watikah 4', type: 'date' },
    { key: 'tempoh_aktif_watikah_4_hari', label: 'Tempoh Aktif Watikah 4 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_1', label: 'Sejarah Penyambungan 1', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_1', label: 'Tarikh Tamat Surat Penyambungan 1', type: 'date' },
    { key: 'tempoh_aktif_watikah_5_hari', label: 'Tempoh Aktif Watikah 5 (Hari)', type: 'text' },
    { key: 'sejarah_penyambungan_2', label: 'Sejarah Penyambungan 2', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_2', label: 'Tarikh Tamat Surat Penyambungan 2', type: 'date' },
    { key: 'tempoh_aktif_watikah_6_hari', label: 'Tempoh Aktif Watikah 6 (Hari)', type: 'text' },
    { key: 'penyambungan_terkini', label: 'Penyambungan Terkini', type: 'date' },
    { key: 'tarikh_tamat_surat_penyambungan_terkini', label: 'Tarikh Tamat Surat Penyambungan Terkini', type: 'date' },
    { key: 'tempoh_aktif_watikah_terkini_hari', label: 'Tempoh Aktif Watikah Terkini (Hari)', type: 'text' },
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
  const keys = new Set(['nama', 'ic_no', 'pangkat', 'jantina', 'tarikh_lantikan', 'contact', 'photo_url', 'senarai_hitam']);
  Object.values(FIELD_GROUPS).forEach((group) => group.forEach((f) => keys.add(f.key)));
  keys.forEach((k) => { obj[k] = k === 'senarai_hitam' ? false : ''; });
  return obj;
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