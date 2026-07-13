// src/screens/PublicNg999Form.js
import React, { useState, createElement } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { ShieldAlert, Lock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { CATEGORY_OPTIONS } from '../constants/operasiConstants';
import ModalSelectField from '../components/ModalSelectField';

// Code d'accès partagé — protection légère côté client seulement (voir note).
const ACCESS_CODE = 'NG999APM';

const lightTheme = {
  background: '#f8fafc', card: '#fff', text: '#0f172a',
  textSecondary: '#64748b', border: '#e2e8f0', accent: '#1E3A8A',
};

export default function PublicNg999Form() {
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const [kategoriKes, setKategoriKes] = useState('');
  const [tarikh, setTarikh] = useState('');
  const [jumlahKes, setJumlahKes] = useState('1');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // fonction à exécuter si confirmé

  const handleUnlock = () => {
    if (codeInput.trim() === ACCESS_CODE) {
      setUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const insertRecord = async (amount) => {
    setSubmitting(true);
    const { error } = await supabaseSandbox
      .from('laporan_ng999')
      .insert([{ kategori_kes: kategoriKes, tarikh, jumlah_kes: amount }]);
    setSubmitting(false);

    if (error) {
      Alert.alert('Ralat', 'Gagal menghantar laporan. Sila cuba lagi.');
      return;
    }

    setSubmitted(true);
    setKategoriKes('');
    setTarikh('');
    setJumlahKes('1');
  };

  const mergeIntoExisting = async (existingId, existingJumlah, amount) => {
    setSubmitting(true);
    const { error } = await supabaseSandbox
      .from('laporan_ng999')
      .update({ jumlah_kes: existingJumlah + amount })
      .eq('id', existingId);
    setSubmitting(false);

    if (error) {
      Alert.alert('Ralat', 'Gagal mengemaskini laporan. Sila cuba lagi.');
      return;
    }

    setSubmitted(true);
    setKategoriKes('');
    setTarikh('');
    setJumlahKes('1');
  };

  const handleSubmit = async () => {
    if (!kategoriKes || !tarikh || !jumlahKes) {
      Alert.alert('Ralat', 'Sila lengkapkan semua maklumat.');
      return;
    }
    const amount = parseInt(jumlahKes, 10);
    if (isNaN(amount) || amount < 1) {
      Alert.alert('Ralat', 'Jumlah kes mesti nombor sah lebih daripada 0.');
      return;
    }

    setSubmitting(true);
    const { data: existing, error: checkError } = await supabaseSandbox
      .from('laporan_ng999')
      .select('id, jumlah_kes')
      .eq('kategori_kes', kategoriKes)
      .eq('tarikh', tarikh)
      .limit(1)
      .maybeSingle();
    setSubmitting(false);

    if (!checkError && existing) {
      const currentTotal = existing.jumlah_kes || 1;
      const message = `Kes "${kategoriKes}" untuk tarikh ${tarikh} sudah wujud dengan jumlah ${currentTotal} kes. Jumlah baharu (${amount}) akan ditambah pada rekod sedia ada, menjadikan jumlah keseluruhan ${currentTotal + amount} kes.`;
      setConfirmMessage(message);
      setPendingAction(() => () => mergeIntoExisting(existing.id, currentTotal, amount));
      setConfirmVisible(true);
      return;
    }

    await insertRecord(amount);
  };

  const handleConfirmYes = async () => {
    setConfirmVisible(false);
    if (pendingAction) await pendingAction();
    setPendingAction(null);
  };

  const handleConfirmNo = () => {
    setConfirmVisible(false);
    setPendingAction(null);
  };

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Lock size={40} color="#1E3A8A" />
          <Text style={styles.title}>Kod Akses Diperlukan</Text>
          <Text style={styles.subtitle}>Sila masukkan kod akses untuk melapor kes NG999.</Text>
          <TextInput
            style={[styles.input, codeError && { borderColor: '#ef4444' }]}
            placeholder="Kod Akses"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={codeInput}
            onChangeText={(t) => { setCodeInput(t); setCodeError(false); }}
          />
          {codeError && <Text style={styles.errorText}>Kod akses salah.</Text>}
          <TouchableOpacity style={styles.submitBtn} onPress={handleUnlock}>
            <Text style={styles.submitBtnText}>Sahkan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <CheckCircle size={48} color="#22c55e" />
          <Text style={styles.title}>Laporan Berjaya Dihantar</Text>
          <Text style={styles.subtitle}>Terima kasih. Kes anda telah direkodkan.</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitted(false)}>
            <Text style={styles.submitBtnText}>Lapor Kes Lain</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ShieldAlert size={40} color="#1E3A8A" />
        <Text style={styles.title}>Lapor Kes NG999</Text>
        <Text style={styles.subtitle}>APM W.P. Labuan</Text>

        <View style={{ width: '100%', marginTop: 20, zIndex: 2 }}>
          <ModalSelectField
            theme={lightTheme}
            label="Kategori Kes"
            value={kategoriKes}
            placeholder="Pilih Kategori..."
            options={CATEGORY_OPTIONS}
            isOpen={categoryOpen}
            onToggle={() => setCategoryOpen(!categoryOpen)}
            onSelect={(opt) => { setKategoriKes(opt); setCategoryOpen(false); }}
            stackIndex={2000}
          />
        </View>

        <View style={{ width: '100%', marginTop: 14 }}>
          <Text style={styles.label}>Tarikh Kejadian</Text>
          {Platform.OS === 'web' ? (
            createElement('input', {
              type: 'date',
              value: tarikh,
              onChange: (e) => setTarikh(e.target.value),
              style: {
                width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0',
                backgroundColor: '#fff', color: '#0f172a', fontSize: 14, boxSizing: 'border-box',
              },
            })
          ) : (
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={tarikh}
              onChangeText={setTarikh}
            />
          )}
        </View>

        <View style={{ width: '100%', marginTop: 14 }}>
          <Text style={styles.label}>Jumlah Kes</Text>
          <TextInput
            style={styles.input}
            placeholder="Cth: 1"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={jumlahKes}
            onChangeText={(t) => setJumlahKes(t.replace(/[^0-9]/g, ''))}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { marginTop: 24 }, (submitting || categoryOpen) && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting || categoryOpen}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Hantar Laporan</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={handleConfirmNo}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <AlertCircle size={36} color="#f97316" />
            <Text style={styles.confirmTitle}>Kes Sudah Wujud</Text>
            <Text style={styles.confirmMessage}>{confirmMessage}</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity style={styles.confirmBtnCancel} onPress={handleConfirmNo}>
                <Text style={styles.confirmBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtnOk} onPress={handleConfirmYes}>
                <Text style={styles.confirmBtnOkText}>Ya, Gabungkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  input: { width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#fff' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 6, alignSelf: 'flex-start' },
  submitBtn: { backgroundColor: '#1E3A8A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 16, width: '100%', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 10 },
  confirmMessage: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 19 },
  confirmBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  confirmBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  confirmBtnCancelText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  confirmBtnOk: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1E3A8A', alignItems: 'center' },
  confirmBtnOkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});