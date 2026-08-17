// src/utils/excelRowSync.js
import * as XLSX from 'xlsx';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { matchColumn, buildFieldColumnMap } from '../hooks/useExcelImport';

const EXCEL_BUCKET = 'angkatan-imports';
const EXCEL_FILENAME = 'data_keseluruhan_anggota_daerah.xlsx';

// Met à jour une seule ligne (identifiée par ic_no) dans le fichier Excel
// stocké, pour les champs fournis. Best-effort : ne lance jamais — un échec
// est juste loggé, l'approbation en base reste la source de vérité.
// Suppose que la colonne IC et les cellules de données ne sont pas fusionnées
// (cas normal pour une ligne par anggota — les fusions concernent l'en-tête).
export async function syncApprovedRowToExcel(icNo, updatedFields) {
  try {
    const { data: fileBlob, error: downloadError } = await supabaseSandbox.storage
      .from(EXCEL_BUCKET)
      .download(EXCEL_FILENAME);
    if (downloadError || !fileBlob) throw downloadError || new Error('Fail Excel tiada.');

    const arrayBuffer = await fileBlob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Même heuristique de détection de ligne d'en-tête que l'import.
    let headerRowIndex = 0;
    let bestMatchCount = -1;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const count = rows[i].filter((h) => matchColumn(h)).length;
      if (count > bestMatchCount) { bestMatchCount = count; headerRowIndex = i; }
    }
    const fieldColumnMap = buildFieldColumnMap(rows[headerRowIndex]);
    const icColIndex = fieldColumnMap.ic_no;
    if (icColIndex === undefined) throw new Error('Lajur IC tidak dijumpai dalam Excel.');

    let targetRowIndex = -1;
    for (let r = headerRowIndex + 2; r < rows.length; r++) {
      if (String(rows[r][icColIndex] || '').trim() === String(icNo).trim()) {
        targetRowIndex = r;
        break;
      }
    }
    if (targetRowIndex === -1) throw new Error(`Baris untuk IC ${icNo} tidak dijumpai dalam Excel.`);

    // Écrit chaque champ modifié en texte brut — évite de casser une formule,
    // au prix du formatage date natif Excel sur les cellules touchées.
    Object.entries(updatedFields).forEach(([field, value]) => {
      const colIndex = fieldColumnMap[field];
      if (colIndex === undefined) return;
      const cellAddr = XLSX.utils.encode_cell({ r: targetRowIndex, c: colIndex });
      sheet[cellAddr] = { t: 's', v: value === null || value === undefined ? '' : String(value) };
    });

    const outBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const outBlob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const { error: uploadError } = await supabaseSandbox.storage
      .from(EXCEL_BUCKET)
      .upload(EXCEL_FILENAME, outBlob, { upsert: true, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    if (uploadError) throw uploadError;

    return true;
  } catch (error) {
    console.error('Sync Excel error:', error);
    return false;
  }
}