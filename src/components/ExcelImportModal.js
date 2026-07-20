import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { X, Upload, CheckCircle } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

export default function ExcelImportModal({ visible, onClose, importHook, onImportComplete }) {
  const { parsing, parsedRows, unmatchedHeaders, pickAndParseFile, reset } = importHook;
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setImporting(true);
      setProgress({ done: 0, total: parsedRows.length });

      for (let i = 0; i < parsedRows.length; i++) {
        const { employee, promotionHistory } = parsedRows[i];
        if (!employee.ic_no) {
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          continue;
        }

        const { data: upserted, error: empError } = await supabaseSandbox
          .from('angkatan_employees')
          .upsert(employee, { onConflict: 'ic_no' })
          .select('id')
          .single();

        if (empError) throw empError;

        if (promotionHistory.length > 0 && upserted?.id) {
          await supabaseSandbox
            .from('angkatan_promotion_history')
            .delete()
            .eq('employee_id', upserted.id);

          const rowsToInsert = promotionHistory.map((p) => ({ ...p, employee_id: upserted.id }));
          const { error: histError } = await supabaseSandbox
            .from('angkatan_promotion_history')
            .insert(rowsToInsert);
          if (histError) throw histError;
        }

        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      Alert.alert('Berjaya', `${parsedRows.length} rekod berjaya diimport.`);
      reset();
      onImportComplete();
      onClose();
    } catch (error) {
      Alert.alert('Ralat Import', `${error.message} (baris ${progress.done + 1})`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Excel — Senarai Anggota</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <X size={22} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>

          {parsedRows.length === 0 ? (
            <TouchableOpacity style={styles.pickBtn} onPress={pickAndParseFile} disabled={parsing}>
              {parsing ? (
                <ActivityIndicator color={PALETTE.orange} />
              ) : (
                <>
                  <Upload size={20} color={PALETTE.orange} />
                  <Text style={{ color: PALETTE.orange, fontWeight: '700', marginLeft: 10 }}>Pilih Fail Excel</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.summaryBanner}>
                <CheckCircle size={16} color="#22c55e" />
                <Text style={{ color: '#16a34a', marginLeft: 8, fontWeight: '600' }}>
                  {parsedRows.length} rekod dikesan
                </Text>
              </View>

              {unmatchedHeaders.length > 0 && (
                <Text style={{ color: PALETTE.orange, fontSize: 12, marginBottom: 10 }}>
                  Lajur tidak dikenali (diabaikan): {unmatchedHeaders.join(', ')}
                </Text>
              )}

              <Text style={{ color: PALETTE.textMutedDark, fontSize: 12, marginBottom: 10 }}>
                Pratonton (5 baris pertama):
              </Text>
              <ScrollView style={{ maxHeight: 280 }}>
                {parsedRows.slice(0, 5).map((row, i) => (
                  <View key={i} style={styles.previewRow}>
                    <Text style={{ color: PALETTE.textDark, fontWeight: '700' }}>{row.employee.nama || '(nama tiada)'}</Text>
                    <Text style={{ color: PALETTE.textMutedDark, fontSize: 12 }}>
                      IC: {row.employee.ic_no || '-'} | Pangkat: {row.employee.pangkat || '-'}
                    </Text>
                    {row.promotionHistory.length > 0 && (
                      <Text style={{ color: PALETTE.orange, fontSize: 11, marginTop: 4 }}>
                        {row.promotionHistory.length} rekod sejarah pasukan
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              {importing && (
                <Text style={{ color: PALETTE.textMutedDark, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                  Mengimport {progress.done}/{progress.total}...
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity onPress={reset} style={styles.cancelBtn} disabled={importing}>
                  <Text style={{ color: PALETTE.textDark }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmImport} disabled={importing} style={styles.confirmBtn}>
                  {importing ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Import {parsedRows.length} Rekod</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: {
    width: '90%', maxWidth: 600, padding: 24, borderRadius: 20, maxHeight: '85%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 30,
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, borderColor: PALETTE.orange,
  },
  summaryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, marginBottom: 10 },
  previewRow: { paddingVertical: 10, borderBottomWidth: 1, borderColor: PALETTE.cardLightBorder },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: PALETTE.surface },
  confirmBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: PALETTE.orange },
});