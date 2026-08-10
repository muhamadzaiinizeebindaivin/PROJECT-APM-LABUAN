import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

// Mapping complet basé sur les colonnes A-BV confirmées
const COLUMN_MATCHERS = [
  { field: 'negeri', patterns: ['NEGERI'] },
  { field: 'daerah', patterns: ['DAERAH'] },
  { field: 'no_anggota', patterns: ['NO ANGGOTA'] },
  { field: 'pangkat', patterns: ['PANGKAT'], exclude: ['KENAIKAN', 'TERKINI'] },
  { field: 'tarikh_terima_pangkat_terkini', patterns: ['TARIKH TERIMA PANGKAT'] },
  { field: 'nama', patterns: ['NAMA'], exclude: ['WARIS'] },
  { field: 'ic_no', patterns: ['NO KAD PENGENALAN'] },
  { field: 'umur', patterns: ['UMUR'] },
  { field: 'jantina', patterns: ['JANTINA'] },
  { field: 'contact', patterns: ['NO TELEFON'], exclude: ['WARIS'] },
  { field: 'alamat_email', patterns: ['ALAMAT EMAIL'] },
  { field: 'alamat_tempat_tinggal', patterns: ['ALAMAT TEMPAT TINGGAL'] },
  { field: 'jenis_darah', patterns: ['JENIS DARAH'] },
  { field: 'tarikh_menyertai_apm', patterns: ['TARIKH MENYERTAI APM'] },
  { field: 'tempoh_berkhidmat', patterns: ['TEMPOH BERKHIDMAT'] },
  { field: 'tarikh_aktif_kad', patterns: ['TARIKH AKTIF KAD'] },
  { field: 'tarikh_tamat_kad', patterns: ['TARIKH TAMAT KAD'] },
  { field: 'tempoh_baki_aktif_kad_hari', patterns: ['TEMPOH BAKI AKTIF KAD'] },
  { field: 'insuran_kelompok_individu', patterns: ['INSURAN', 'KELOMPOK'] },
  { field: 'insuran_aktif_tidak', patterns: ['INSURAN', 'AKTIF'], exclude: ['KELOMPOK', 'TAMAT', 'BAKI'] },
  { field: 'tarikh_tamat_insuran', patterns: ['TARIKH TAMAT INSURAN'] },
  { field: 'tempoh_baki_aktif_insuran_hari', patterns: ['TEMPOH BAKI AKTIF INSURAN'] },
  { field: 'perkeso_jabatan_individu', patterns: ['PERKESO', 'JABATAN'] },
  { field: 'perkeso_aktif_tidak', patterns: ['PERKESO', 'AKTIF'], exclude: ['JABATAN', 'TAMAT', 'BAKI'] },
  { field: 'tarikh_tamat_perkeso', patterns: ['TARIKH TAMAT PERKESO'] },
  { field: 'tempoh_baki_caruman_perkeso_hari', patterns: ['TEMPOH BAKI CARUMAN PERKESO'] },
  { field: 'status_myaspa', patterns: ['STATUS', 'MYASPA'] },
  { field: 'status_keaktifan', patterns: ['STATUS KEAKTIFAN'] },
  { field: 'tugas_hakiki', patterns: ['TUGAS HAKIKI'] },
  { field: 'akademik_tertinggi', patterns: ['AKADEMIK TERTINGGI'] },
  { field: 'senarai_kursus', patterns: ['SENARAI KURSUS'] },
  { field: 'senarai_penganugerahan', patterns: ['SENARAI PENGANUGERAHAN'] },
  { field: 'kompeni', patterns: ['KOMPENI'] },
  { field: 'no_rujukan_surat_lkpl', patterns: ['NO RUJUKAN SURAT', 'L/KPL'] },
  { field: 'tarikh_kenaikan_pangkat_lkpl', patterns: ['TARIKH KENAIKAN PANGKAT', 'L/KOP'] },
  { field: 'no_rujukan_surat_kpl', patterns: ['NO RUJUKAN SURAT KENAIKAN PANGKAT KPL'] },
  { field: 'tarikh_kenaikan_pangkat_kpl', patterns: ['TARIKH KENAIKAN PANGKAT KPL'] },
  { field: 'no_rujukan_surat_sjn', patterns: ['NO RUJUKAN SURAT KENAIKAN PANGKAT SJN'] },
  { field: 'tarikh_kenaikan_pangkat_sjn', patterns: ['TARIKH KENAIKAN PANGKAT SJN'] },
  { field: 'no_siri_watikah_pwi', patterns: ['NO SIRI WATIKAH PW I'], exclude: ['II'] },
  { field: 'tarikh_kenaikan_pangkat_pwi', patterns: ['TARIKH KENAIKAN PANGKAT PWI'] },
  { field: 'no_siri_watikah_pwii', patterns: ['NO SIRI WATIKAH PW II'] },
  { field: 'tarikh_kenaikan_pangkat_pwii', patterns: ['TARIKH KENAIKAN PANGKAT PW II'] },
  { field: 'no_siri_watikah_pelantikan_pertama', patterns: ['NO SIRI WATIKAH PELANTIKAN PERTAMA'] },
  { field: 'tarikh_pelantikan_pasukan_pertama', patterns: ['PELANTIKAN PEGAWAI PASUKAN PERTAMA'] },
  { field: 'tarikh_tamat_watikah_4', patterns: ['TARIKH TAMAT WATIKAH 4'] },
  { field: 'tempoh_aktif_watikah_4_hari', patterns: ['TEMPOH AKTIF WATIKAH 4'] },
  { field: 'sejarah_penyambungan_1', patterns: ['SEJARAH PENYAMBUNGAN 1'] },
  { field: 'tarikh_tamat_surat_penyambungan_1', patterns: ['TARIKH TAMAT SURAT PENYAMBUNGAN 1'] },
  { field: 'tempoh_aktif_watikah_5_hari', patterns: ['TEMPOH AKTIF WATIKAH', '5'] },
  { field: 'sejarah_penyambungan_2', patterns: ['SEJARAH PENYAMBUNGAN 2'] },
  { field: 'tarikh_tamat_surat_penyambungan_2', patterns: ['TARIKH TAMAT SURAT PENYAMBUNGAN 2'] },
  { field: 'tempoh_aktif_watikah_6_hari', patterns: ['TEMPOH AKTIF WATIKAH 6'] },
  { field: 'penyambungan_terkini', patterns: ['PENYAMBUNGAN TERKINI'] },
  { field: 'tarikh_tamat_surat_penyambungan_terkini', patterns: ['TARIKH TAMAT SURAT PENYAMBUNGAN 3'] },
  { field: 'tempoh_aktif_watikah_terkini_hari', patterns: ['TEMPOH AKTIF WATIKAH 7'] },
  { field: 'nama_waris', patterns: ['NAMA WARIS'] },
  { field: 'hubungan_waris', patterns: ['HUBUNGAN WARIS'] },
  { field: 'no_telefon_waris', patterns: ['NO TELEFON WARIS'] },
  { field: 'catatan', patterns: ['CATATAN'] },
];

// Colonnes de l'historique Pasukan 1/2/3 — extraites séparément vers angkatan_promotion_history
const PASUKAN_MATCHERS = [1, 2, 3].map((n) => ({
  pasukan_number: n,
  tarikh_tamat_watikah: [`TARIKH TAMAT WATIKAH ${n}`],
  tempoh_aktif_watikah_hari: [`TEMPOH AKTIF WATIKAH ${n}`],
  no_siri_watikah: [`NO SIRI WATIKAH KENAIKAN PANGKAT ${n}`],
  tarikh_kenaikan_pangkat: [`SEJARAH KENAIKAN PEGAWAI PASUKAN ${n}`],
}));

const INTEGER_FIELDS = [
  'umur', 'tempoh_baki_aktif_kad_hari', 'tempoh_baki_aktif_insuran_hari',
  'tempoh_baki_caruman_perkeso_hari', 'tempoh_aktif_watikah_4_hari', 'tempoh_aktif_watikah_terkini_hari',
  'tempoh_aktif_watikah_5_hari', 'tempoh_aktif_watikah_6_hari',
];

const DATE_FIELDS = [
  'tarikh_terima_pangkat_terkini', 'tarikh_menyertai_apm', 'tarikh_aktif_kad', 'tarikh_tamat_kad',
  'tarikh_tamat_insuran', 'tarikh_tamat_perkeso', 'tarikh_kenaikan_pangkat_lkpl',
  'tarikh_kenaikan_pangkat_kpl', 'tarikh_kenaikan_pangkat_sjn', 'tarikh_kenaikan_pangkat_pwi',
  'tarikh_kenaikan_pangkat_pwii', 'tarikh_pelantikan_pasukan_pertama', 'tarikh_tamat_watikah_4',
  'sejarah_penyambungan_1', 'tarikh_tamat_surat_penyambungan_1',
  'sejarah_penyambungan_2', 'tarikh_tamat_surat_penyambungan_2',
  'penyambungan_terkini', 'tarikh_tamat_surat_penyambungan_terkini',
];

const normalize = (str) => String(str || '').toUpperCase().replace(/\s+/g, ' ').trim();

const matchColumn = (header) => {
  const norm = normalize(header);
  for (const matcher of COLUMN_MATCHERS) {
    const included = matcher.patterns.every((p) => norm.includes(p));
    const excluded = (matcher.exclude || []).some((e) => norm.includes(e));
    if (included && !excluded) return { type: 'field', field: matcher.field };
  }
  for (const pasukan of PASUKAN_MATCHERS) {
    for (const key of ['tarikh_tamat_watikah', 'tempoh_aktif_watikah_hari', 'no_siri_watikah', 'tarikh_kenaikan_pangkat']) {
      if (pasukan[key].every((p) => norm.includes(normalize(p)))) {
        return { type: 'pasukan', pasukan_number: pasukan.pasukan_number, field: key };
      }
    }
  }
  return null;
};

const isValidDate = (y, m, d) => {
  y = parseInt(y, 10); m = parseInt(m, 10); d = parseInt(d, 10);
  if (!y || !m || !d) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Vérifie que la date "round-trip" correctement (rejette 30 février, 31 avril, etc.)
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const excelDateToISO = (value) => {
  if (!value) return null;
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date || !isValidDate(date.y, date.m, date.d)) return null;
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    if (!isValidDate(y, m, d)) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};

export function useExcelImport() {
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [pickedFile, setPickedFile] = useState(null);

  const pickAndParseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    try {
      setParsing(true);
      const file = result.assets[0];
      setPickedFile(file);
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      let headerRowIndex = 0;
      let bestMatchCount = -1;
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const matchCount = rows[i].filter((h) => matchColumn(h)).length;
        if (matchCount > bestMatchCount) {
          bestMatchCount = matchCount;
          headerRowIndex = i;
        }
      }

      const headerRow = rows[headerRowIndex];
      const dataRows = rows.slice(headerRowIndex + 1).filter((r) => r.some((cell) => String(cell).trim() !== ''));

      const columnMap = headerRow.map((h) => matchColumn(h));
      const unmatched = headerRow.filter((h, i) => !columnMap[i] && String(h).trim() !== '');
      setUnmatchedHeaders(unmatched);

      // DEBUG TEMPORAIRE — à retirer une fois le problème résolu
      console.log('=== DEBUG EXCEL IMPORT ===');
      console.log('headerRowIndex détecté:', headerRowIndex);
      console.log('Nombre de colonnes dans headerRow:', headerRow.length);
      console.log('headerRow complet:', JSON.stringify(headerRow));
      console.log('Nombre de colonnes dans dataRows[0]:', dataRows[0]?.length);
      console.log('dataRows[0] complet:', JSON.stringify(dataRows[0]));
      console.log('Colonne F (index 5) du headerRow:', headerRow[5]);
      console.log('Colonne F (index 5) du dataRows[0]:', dataRows[0]?.[5]);
      setDebugInfo({
        headerRowIndex,
        headerRowLength: headerRow.length,
        dataRow0Length: dataRows[0]?.length,
        headerRow: headerRow,
        dataRow0: dataRows[0],
      });
      console.log('=========================');

      const parsed = dataRows.map((row) => {
        const employee = {};
        const pasukanRows = {};

        row.forEach((cell, i) => {
          const match = columnMap[i];
          if (!match) return;
          const rawValue = String(cell).trim();

          if (match.type === 'field') {
            if (DATE_FIELDS.includes(match.field)) {
              employee[match.field] = excelDateToISO(cell);
            } else if (INTEGER_FIELDS.includes(match.field)) {
              const num = parseInt(rawValue, 10);
              employee[match.field] = Number.isFinite(num) ? num : null;
            } else if (match.field === 'status_keaktifan') {
              employee[match.field] = rawValue;
              if (/SENARAI HITAM/i.test(rawValue)) employee.senarai_hitam = true;
            } else {
              employee[match.field] = rawValue;
            }
          } else if (match.type === 'pasukan') {
            const n = match.pasukan_number;
            if (!pasukanRows[n]) pasukanRows[n] = { pasukan_number: n };
            if (match.field === 'tarikh_tamat_watikah' || match.field === 'tarikh_kenaikan_pangkat') {
              pasukanRows[n][match.field] = excelDateToISO(cell);
            } else if (match.field === 'tempoh_aktif_watikah_hari') {
              const num = parseInt(rawValue, 10);
              pasukanRows[n][match.field] = Number.isFinite(num) ? num : null;
            } else {
              pasukanRows[n][match.field] = rawValue;
            }
          }
        });

        const promotionHistory = Object.values(pasukanRows).filter((p) =>
          Object.keys(p).some((k) => k !== 'pasukan_number' && p[k])
        );

        return { employee, promotionHistory };
      });

      setParsedRows(parsed);
    } catch (error) {
      console.error('Excel parse error:', error);
      throw error;
    } finally {
      setParsing(false);
    }
  };

  const reset = () => {
    setParsedRows([]);
    setUnmatchedHeaders([]);
    setPickedFile(null);
  };

  return { parsing, parsedRows, unmatchedHeaders, pickAndParseFile, reset, debugInfo, pickedFile };
}