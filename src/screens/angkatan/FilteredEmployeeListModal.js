import React from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, Modal, Image, Platform } from 'react-native';
import { X, User, ChevronLeft, ChevronRight, Users, Download } from 'lucide-react-native';
import ExcelJS from 'exceljs';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { cleanEscapedText } from '../../utils/textCleanup';
import HoverTip from '../../components/HoverTip';
import { FIELD_SECTIONS } from './employeeFieldGroups';

const STATUS_STYLES = {
  AKTIF: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a' },
  SIMPANAN: { bg: 'rgba(37,99,235,0.12)', color: '#2563eb' },
  BERSARA: { bg: 'rgba(245,158,11,0.14)', color: '#b45309' },
  MENINGGAL: { bg: 'rgba(31,41,55,0.12)', color: '#1f2937' },
  'SENARAI HITAM': { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' },
};
const getStatusStyle = (status) => STATUS_STYLES[String(status || '').trim().toUpperCase()] || { bg: PALETTE.surface, color: PALETTE.textMutedDark };

export default function FilteredEmployeeListModal({
  visible, title, totalCount, employees, allEmployees, page, setPage, totalPages, onClose, onSelectEmployee,
}) {
  const handleDownloadExcel = async () => {
    const list = allEmployees || employees;
    const maklumatPeribadiFields = FIELD_SECTIONS.find((s) => s.title === 'Maklumat Peribadi')?.fields || [];

    // Champs date bruts (ISO YYYY-MM-DD en base) — écrits comme vraies dates
    // Excel (pas du texte) pour que les formules "tempoh" ci-dessous fonctionnent.
    const DATE_KEYS = new Set([
      'tarikh_terima_pangkat_terkini', 'tarikh_menyertai_apm', 'tarikh_aktif_kad',
      'tarikh_tamat_kad', 'tarikh_tamat_insuran', 'tarikh_tamat_perkeso',
    ]);

    const parseIsoDate = (value) => {
      if (!value || typeof value !== 'string') return null;
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return null;
      const [, y, m, d] = match;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    };

    const colIndexOf = (key) => maklumatPeribadiFields.findIndex((f) => f.key === key);

    // Colonnes de texte long — restent alignées à gauche plutôt que centrées
    const LEFT_ALIGN_KEYS = new Set(['nama', 'contact', 'alamat_email', 'alamat_tempat_tinggal', 'senarai_kursus', 'senarai_penganugerahan']);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Senarai Anggota');
    const lastCol = Math.max(1, maklumatPeribadiFields.length);

    // Une seule cellule TODAY() cachée, référencée par toutes les formules "tempoh"
    // ci-dessous — évite des centaines d'appels TODAY() volatils séparés qui
    // ralentissent/gèlent le recalcul (observé notamment sur Excel Online).
    const todayHelperCol = lastCol + 2;
    const todayCell = worksheet.getCell(1, todayHelperCol);
    todayCell.value = { formula: 'TODAY()', result: new Date() };
    todayCell.numFmt = 'dd/mm/yyyy';
    worksheet.getColumn(todayHelperCol).hidden = true;
    const todayCellRef = `$${worksheet.getColumn(todayHelperCol).letter}$1`;

    // Colonnes "tempoh" calculées par formule Excel (recalcule à chaque ouverture)
    // plutôt qu'une valeur figée au moment de l'export — référencent la cellule
    // TODAY() unique ci-dessus plutôt que d'appeler TODAY() individuellement.
    const TEMPOH_FORMULAS = {
      tempoh_baki_aktif_kad_hari: { fromKey: 'tarikh_tamat_kad', build: (ref) => `${ref}-${todayCellRef}` },
      tempoh_baki_aktif_insuran_hari: { fromKey: 'tarikh_tamat_insuran', build: (ref) => `${ref}-${todayCellRef}` },
      tempoh_baki_caruman_perkeso_hari: { fromKey: 'tarikh_tamat_perkeso', build: (ref) => `${ref}-${todayCellRef}` },
      tempoh_berkhidmat: { fromKey: 'tarikh_menyertai_apm', build: (ref) => `(${todayCellRef}-${ref})/365.25` },
    };

    // Titre — fusionné, à gauche, en gras (couleur explicite : "automatic" peut
    // s'afficher blanc sur blanc selon le thème/mode d'affichage d'Excel).
    worksheet.getRow(1).height = 26;
    worksheet.mergeCells(1, 1, 1, lastCol);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title || 'Senarai Anggota';
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    titleCell.font = { bold: true, size: 18, color: { argb: 'FF000000' } };

    // Méta (date de génération + total) — fusionné, à gauche
    worksheet.getRow(2).height = 18;
    worksheet.mergeCells(2, 1, 2, lastCol);
    const metaCell = worksheet.getCell(2, 1);
    metaCell.value = `Dijana pada: ${new Date().toLocaleString('ms-MY')} — Jumlah: ${list.length} anggota`;
    metaCell.alignment = { horizontal: 'left', vertical: 'middle' };
    metaCell.font = { italic: true, size: 12, color: { argb: 'FF666666' } };

    // Ligne 3 = vide (espacement)

    // En-têtes de colonnes — ligne 4
    const HEADER_ROW = 4;
    maklumatPeribadiFields.forEach((f, i) => {
      const cell = worksheet.getCell(HEADER_ROW, i + 1);
      cell.value = f.label;
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: LEFT_ALIGN_KEYS.has(f.key) ? 'left' : 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: TEMPOH_FORMULAS[f.key] ? 'FFFFF9C4' : 'FFD9D9D9' },
      };
    });

    // Lignes de données
    list.forEach((e, rowIdx) => {
      const rowNum = HEADER_ROW + 1 + rowIdx;
      maklumatPeribadiFields.forEach((f, colIdx) => {
        const cell = worksheet.getCell(rowNum, colIdx + 1);
        cell.font = { color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: LEFT_ALIGN_KEYS.has(f.key) ? 'left' : 'center', vertical: 'middle' };

        if (DATE_KEYS.has(f.key)) {
          const parsed = parseIsoDate(e[f.key]);
          if (parsed) { cell.value = parsed; cell.numFmt = 'dd/mm/yyyy'; }
          else cell.value = e[f.key] || '-';
          return;
        }

        if (TEMPOH_FORMULAS[f.key]) {
          const { fromKey, build } = TEMPOH_FORMULAS[f.key];
          const fromColIdx = colIndexOf(fromKey);
          const fromDate = parseIsoDate(e[fromKey]);
          if (!fromDate || fromColIdx === -1) {
            cell.value = '-';
            return;
          }
          const fromCell = worksheet.getCell(rowNum, fromColIdx + 1);
          // Valeur mise en cache (calculée côté JS) affichée avant qu'Excel ne
          // recalcule la formule lui-même à l'ouverture du fichier.
          const today = new Date();
          const cached = f.key === 'tempoh_berkhidmat'
            ? (today.getTime() - fromDate.getTime()) / 86400000 / 365.25
            : Math.round((fromDate.getTime() - today.getTime()) / 86400000);
          cell.value = { formula: build(fromCell.address), result: Math.round(cached * 100) / 100 };
          if (f.key === 'tempoh_berkhidmat') cell.numFmt = '0.00';
          return;
        }

        // SheetJS/ExcelJS ne peuvent pas stocker un vrai \r dans une cellule XML —
        // on le retire nous-mêmes (le \n suffit pour un retour à la ligne dans Excel).
        const cleaned = cleanEscapedText(e[f.key]).replace(/\r/g, '');
        cell.value = cleaned === '' ? '-' : cleaned;
        // Active le retour à la ligne pour les cellules multi-lignes (ex: plusieurs
        // numéros de téléphone) — sinon Excel affiche tout sur une seule ligne visuelle
        // malgré les \n réels dans la valeur.
        if (cleaned.includes('\n')) {
          cell.alignment = { ...cell.alignment, wrapText: true };
        }
      });
    });

    // Largeur minimale forcée pour certaines colonnes où le calcul automatique
    // (libellé/valeurs) coupe encore le texte à l'affichage.
    const MIN_WIDTH_OVERRIDES = { jantina: 14 };

    // Largeur des colonnes, basée sur le libellé et les valeurs réellement écrites.
    // Pas de plafond maximum — on préfère une colonne large à des données coupées.
    // Pour les cellules multi-lignes (wrapText), on se base sur la ligne la plus
    // longue, pas la longueur totale (sinon une liste de 5 cours donnerait une
    // colonne absurdement large alors que chaque ligne s'affiche sur sa propre ligne).
    maklumatPeribadiFields.forEach((f, i) => {
      let longest = f.label.length;
      list.forEach((_, rowIdx) => {
        const cell = worksheet.getCell(HEADER_ROW + 1 + rowIdx, i + 1);
        const text = cell.value?.result !== undefined ? String(cell.value.result) : String(cell.value ?? '');
        const longestLine = text.includes('\n')
          ? Math.max(...text.split('\n').map((line) => line.length))
          : text.length;
        longest = Math.max(longest, longestLine);
      });
      // Marge proportionnelle (pas juste fixe) — le texte en MAJUSCULES (courant
      // dans ces données) est visuellement plus large que l'estimation par
      // nombre de caractères ne le suppose.
      const computed = Math.max(Math.ceil(longest * 1.2) + 4, 10);
      worksheet.getColumn(i + 1).width = Math.max(computed, MIN_WIDTH_OVERRIDES[f.key] || 0);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const safeFileName = (title || 'senarai_anggota').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: '80%', maxWidth: 700 }]}>
          <View style={[styles.modalHeader, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600', marginTop: 2 }}>
                {totalCount ?? employees.length} anggota
              </Text>
            </View>
            {Platform.OS === 'web' && (totalCount ?? employees.length) > 0 && (
              <HoverTip label="Muat turun senarai sebagai Excel">
                <TouchableOpacity
                  onPress={handleDownloadExcel}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PALETTE.softOrangeBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                >
                  <Download size={16} color={PALETTE.orange} />
                </TouchableOpacity>
              </HoverTip>
            )}
            <HoverTip label="Tutup">
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </HoverTip>
          </View>

          {employees.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 10 }}>
              <Users size={30} color={PALETTE.cardLightBorder} />
              <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' }}>Tiada anggota dijumpai.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={[styles.modalBody, { gap: 10 }]}>
              {employees.map((emp) => {
                const statusStyle = getStatusStyle(emp.status_keaktifan);
                return (
                  <Pressable
                    key={emp.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14,
                      backgroundColor: '#fff', borderWidth: 1, borderColor: PALETTE.cardLightBorder,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
                    }}
                    onPress={() => onSelectEmployee(emp)}
                  >
                    {emp.photo_url ? (
                      <Image source={{ uri: emp.photo_url }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                    ) : (
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <User size={22} color={PALETTE.textMutedDark} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: PALETTE.textDark, marginBottom: 4 }} numberOfLines={1}>
                        {emp.nama}
                      </Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: PALETTE.softOrangeBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.orange }}>{emp.pangkat}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: statusStyle.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: statusStyle.color }}>{emp.status_keaktifan || '-'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 14, paddingBottom: 16 }}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: page === 1 ? PALETTE.surface : PALETTE.softOrangeBg, opacity: page === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={17} color={PALETTE.orange} />
              </TouchableOpacity>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark }}>{page} / {totalPages}</Text>
              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: page === totalPages ? PALETTE.surface : PALETTE.softOrangeBg, opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                <ChevronRight size={17} color={PALETTE.orange} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}