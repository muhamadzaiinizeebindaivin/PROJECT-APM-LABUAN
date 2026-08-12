import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { X, Upload, CheckCircle } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

export default function ExcelImportModal({ visible, onClose, importHook, onImportComplete, onSaveImportMeta }) {
  const { parsing, parsedRows, unmatchedHeaders, pickAndParseFile, reset, pickedFile } = importHook;
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [importPhase, setImportPhase] = React.useState('rows'); // 'rows' | 'file' | 'refresh'

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setImporting(true);
      setImportPhase('rows');
      setProgress({ done: 0, total: parsedRows.length });

      // Un seul upsert groupé au lieu d'un aller-retour réseau par employé —
      // Supabase accepte un tableau de lignes en un seul appel, bien plus
      // rapide que 500+ requêtes séquentielles.
      // Postgres refuse d'appliquer ON CONFLICT DO UPDATE deux fois à la même
      // ligne DANS le même batch — donc si deux lignes Excel partagent le même
      // ic_no (doublon), tout le batch échoue avec l'erreur 21000. On déduplique
      // par ic_no en gardant la DERNIÈRE occurrence, exactement comme le faisait
      // l'ancienne boucle séquentielle (chaque upsert écrasait le précédent).
      const byIc = new Map();
      parsedRows
        .map((r) => r.employee)
        .filter((e) => !!e.ic_no)
        .forEach((e) => byIc.set(e.ic_no, e));
      const employeesToImport = Array.from(byIc.values());

      const CHUNK_SIZE = 200;
      for (let i = 0; i < employeesToImport.length; i += CHUNK_SIZE) {
        const chunk = employeesToImport.slice(i, i + CHUNK_SIZE);
        const { error: empError } = await supabaseSandbox
          .from('angkatan_employees')
          .upsert(chunk, { onConflict: 'ic_no' });

        if (empError) throw empError;

        setProgress((p) => ({ ...p, done: Math.min(p.done + chunk.length, parsedRows.length) }));
      }

      // Fichier stocké séparément (bucket privé, seul le plus récent est gardé —
      // écrasé à chaque import) — un échec ici n'annule pas l'import des rekod.
      // onSaveImportMeta (saveSummaryExtra) rafraîchit déjà toute la liste des
      // employés en interne — on ne rappelle onImportComplete (= le même
      // fetchEmployees) que si ce chemin n'a pas été emprunté, pour éviter un
      // double rechargement complet de la table juste avant la fermeture.
      let alreadyRefreshed = false;
      if (pickedFile) {
        try {
          setImportPhase('file');
          const fileResponse = await fetch(pickedFile.uri);
          const blob = await fileResponse.blob();
          const { error: uploadError } = await supabaseSandbox.storage
            .from('angkatan-imports')
            .upload('data_keseluruhan_anggota_daerah.xlsx', blob, {
              upsert: true,
              contentType: pickedFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
          if (uploadError) {
            console.error('Excel storage upload error:', uploadError);
          } else {
            setImportPhase('refresh');
            await onSaveImportMeta?.({
              latest_import_filename: pickedFile.name,
              latest_import_at: new Date().toISOString(),
            });
            alreadyRefreshed = true;
          }
        } catch (uploadErr) {
          console.error('Excel storage upload error:', uploadErr);
        }
      }

      Alert.alert('Berjaya', `${parsedRows.length} rekod berjaya diimport.`);
      reset();
      if (!alreadyRefreshed) onImportComplete();
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
                Pratonton (10 baris pertama, semua medan):
              </Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {parsedRows.slice(0, 10).map((row, i) => (
                  <View key={i} style={[styles.previewRow, { paddingBottom: 14 }]}>
                    <Text style={{ color: PALETTE.textDark, fontWeight: '800', fontSize: 13, marginBottom: 6 }}>
                      {row.employee.nama || '(nama tiada)'}
                    </Text>
                    {Object.entries(row.employee)
                      .map(([key, value]) => {
                        const isEmpty = value === null || value === '' || value === false || value === undefined;
                        return (
                          <View key={key} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                            <Text style={{ color: PALETTE.textMutedDark, fontSize: 11, flex: 1 }}>{key}</Text>
                            <Text style={{ color: isEmpty ? '#dc2626' : PALETTE.textDark, fontSize: 11, fontWeight: '600', flex: 1, fontStyle: isEmpty ? 'italic' : 'normal' }}>
                              {isEmpty ? '(kosong)' : String(value)}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                ))}
              </ScrollView>

              {importing && (
                <Text style={{ color: PALETTE.textMutedDark, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                  {importPhase === 'rows' && `Mengimport ${progress.done}/${progress.total}...`}
                  {importPhase === 'file' && 'Memuat naik fail Excel...'}
                  {importPhase === 'refresh' && 'Mengemaskini paparan...'}
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