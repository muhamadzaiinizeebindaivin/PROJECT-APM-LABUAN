// src/utils/excelRowSync.js
import ExcelJS from 'exceljs';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { matchColumn, buildFieldColumnMap } from '../hooks/useExcelImport';

const EXCEL_BUCKET = 'angkatan-imports';
const EXCEL_FILENAME = 'data_keseluruhan_anggota_daerah.xlsx';

// Met à jour une seule ligne (identifiée par ic_no) dans le fichier Excel
// stocké, pour les champs fournis. Best-effort : ne lance jamais — un échec
// est juste loggé, l'approbation en base reste la source de vérité.
// Suppose que la colonne IC et les cellules de données ne sont pas fusionnées
// (cas normal pour une ligne par anggota — les fusions concernent l'en-tête).
//
// Utilise exceljs (au lieu de xlsx) car il permet de ne modifier QUE la
// valeur d'une cellule, sans toucher à son style — xlsx remplaçait l'objet
// cellule entier, ce qui effaçait sa mise en forme (police, couleurs,
// bordures) à chaque kemaskini approuvé.
export async function syncApprovedRowToExcel(icNo, updatedFields) {
  try {
    const { data: fileBlob, error: downloadError } = await supabaseSandbox.storage
      .from(EXCEL_BUCKET)
      .download(EXCEL_FILENAME);
    if (downloadError || !fileBlob) throw downloadError || new Error('Fail Excel tiada.');

    const arrayBuffer = await fileBlob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // Convertit une ligne exceljs (1-indexée, avec un éventuel trou à
    // l'index 0) en tableau 0-indexé classique, pour réutiliser telles
    // quelles les heuristiques déjà écrites pour xlsx (matchColumn,
    // buildFieldColumnMap attendent un tableau 0-indexé).
    const rowToArray = (rowNumber) => {
      const row = worksheet.getRow(rowNumber);
      const arr = [];
      for (let c = 1; c <= worksheet.columnCount; c++) {
        arr[c - 1] = row.getCell(c).value;
      }
      return arr;
    };

    // Même heuristique de détection de ligne d'en-tête que l'import.
    // headerRowIndex reste 0-indexé (comme avec xlsx) ; on ajoute +1
    // uniquement au moment d'appeler worksheet.getRow (1-indexé).
    let headerRowIndex = 0;
    let bestMatchCount = -1;
    const maxScanRows = Math.min(15, worksheet.rowCount);
    for (let i = 0; i < maxScanRows; i++) {
      const rowArr = rowToArray(i + 1);
      const count = rowArr.filter((h) => matchColumn(h)).length;
      if (count > bestMatchCount) { bestMatchCount = count; headerRowIndex = i; }
    }
    const fieldColumnMap = buildFieldColumnMap(rowToArray(headerRowIndex + 1));
    const icColIndex = fieldColumnMap.ic_no;
    if (icColIndex === undefined) throw new Error('Lajur IC tidak dijumpai dalam Excel.');

    let targetRowIndex = -1;
    for (let r = headerRowIndex + 2; r < worksheet.rowCount; r++) {
      const cellValue = worksheet.getRow(r + 1).getCell(icColIndex + 1).value;
      if (String(cellValue ?? '').trim() === String(icNo).trim()) {
        targetRowIndex = r;
        break;
      }
    }
    if (targetRowIndex === -1) throw new Error(`Baris untuk IC ${icNo} tidak dijumpai dalam Excel.`);

    // Écrit chaque champ modifié en ne touchant QUE .value — le style existant
    // de la cellule (police, couleur, bordure, format) reste intact.
    const targetRow = worksheet.getRow(targetRowIndex + 1);
    Object.entries(updatedFields).forEach(([field, value]) => {
      const colIndex = fieldColumnMap[field];
      if (colIndex === undefined) return;
      const cell = targetRow.getCell(colIndex + 1);
      cell.value = value === null || value === undefined ? '' : String(value);
    });
    targetRow.commit();

    const outBuffer = await workbook.xlsx.writeBuffer();
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