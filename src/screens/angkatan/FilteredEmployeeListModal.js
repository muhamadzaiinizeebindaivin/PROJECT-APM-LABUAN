import React from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, Modal, Image, Platform } from 'react-native';
import { X, User, ChevronLeft, ChevronRight, Users, Download } from 'lucide-react-native';
import * as XLSX from 'xlsx';
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
  const handleDownloadExcel = () => {
    const list = allEmployees || employees;
    const rawSample = list[0]?.senarai_kursus || '';
    console.log('RAW VALUE:', JSON.stringify(rawSample.slice(0, 80)));
    console.log('CHAR CODES:', [...rawSample.slice(0, 40)].map(c => c.charCodeAt(0)));
    console.log('CLEANED:', JSON.stringify(cleanEscapedText(rawSample).slice(0, 80)));
    const maklumatPeribadiFields = FIELD_SECTIONS.find((s) => s.title === 'Maklumat Peribadi')?.fields || [];

    const rows = list.map((e) => {
      const row = {};
      maklumatPeribadiFields.forEach((f) => {
        // SheetJS ne peut pas stocker un vrai \r dans une cellule XML — il l'échappe
        // en texte littéral "_x000D_" que Excel n'interprète pas comme un saut de ligne.
        // On retire donc le \r ici (le \n suffit pour un retour à la ligne dans Excel).
        const cleaned = cleanEscapedText(e[f.key]).replace(/\r/g, '');
        row[f.label] = cleaned === '' ? '-' : cleaned;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // Ajuste la largeur des colonnes au libellé le plus long (label vs valeurs)
    // pour éviter des colonnes tronquées à l'ouverture du fichier.
    worksheet['!cols'] = maklumatPeribadiFields.map((f) => {
      const longest = Math.max(
        f.label.length,
        ...rows.map((r) => String(r[f.label] ?? '').length)
      );
      return { wch: Math.min(Math.max(longest + 2, 10), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Senarai Anggota');

    const safeFileName = (title || 'senarai_anggota').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
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