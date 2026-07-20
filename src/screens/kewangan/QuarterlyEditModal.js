import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';
import MonthDropdown from './MonthDropdown';

function buildMonthsLabel(start, end) {
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

export default function QuarterlyEditModal({ visible, isNew, draft, setDraft, onSave, onClose }) {
  const selectStartMonth = (month) => {
    setDraft((p) => ({ ...p, bulanMula: month, months: buildMonthsLabel(month, p.bulanAkhir) }));
  };
  const selectEndMonth = (month) => {
    setDraft((p) => ({ ...p, bulanAkhir: month, months: buildMonthsLabel(p.bulanMula, month) }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Sukuan Baru' : 'Kemaskini Sukuan'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Sukuan</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.q}
              onChangeText={(t) => setDraft((p) => ({ ...p, q: t }))}
              placeholder="Cth: SUKUAN 5"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bulan Mula</Text>
                <MonthDropdown value={draft.bulanMula} onSelect={selectStartMonth} placeholder="Pilih bulan" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bulan Akhir</Text>
                <MonthDropdown value={draft.bulanAkhir} onSelect={selectEndMonth} placeholder="Pilih bulan" />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Jumlah Belanja Kumulatif (RM)</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.spend}
              onChangeText={(t) => setDraft((p) => ({ ...p, spend: t }))}
              placeholder="Cth: 1500000.00"
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <TouchableOpacity style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={onSave}>
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}