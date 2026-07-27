import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';

function buildMonthsLabel(start, end) {
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

const SUKUAN_PRESETS = [
  { q: 'SUKUAN 1', bulanMula: 'Januari', bulanAkhir: 'Mac' },
  { q: 'SUKUAN 2', bulanMula: 'April', bulanAkhir: 'Jun' },
  { q: 'SUKUAN 3', bulanMula: 'Julai', bulanAkhir: 'September' },
  { q: 'SUKUAN 4', bulanMula: 'Oktober', bulanAkhir: 'Disember' },
];

export default function QuarterlyEditModal({ visible, isNew, draft, setDraft, onSave, onClose, error, isSaving }) {
  const applyPreset = (preset) => {
    setDraft((p) => ({
      ...p,
      q: preset.q,
      bulanMula: preset.bulanMula,
      bulanAkhir: preset.bulanAkhir,
      months: buildMonthsLabel(preset.bulanMula, preset.bulanAkhir),
    }));
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {SUKUAN_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.q}
                  style={{
                    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10,
                    borderWidth: 1.5, borderColor: draft.q === preset.q ? PALETTE.orange : PALETTE.cardLightBorder,
                    backgroundColor: draft.q === preset.q ? 'rgba(249, 115, 22, 0.10)' : '#fafafa',
                  }}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: draft.q === preset.q ? PALETTE.orange : PALETTE.textMutedDark }}>{preset.q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!draft.q && (
              <>
                <Text style={styles.inputLabel}>Tempoh</Text>
                <View style={styles.monthDropdownTrigger}>
                  <Text style={styles.monthDropdownText}>{draft.bulanMula} - {draft.bulanAkhir}</Text>
                </View>
              </>
            )}

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Jumlah Belanja Sukuan Ini (RM)</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.spend}
              onChangeText={(t) => setDraft((p) => ({ ...p, spend: t }))}
              placeholder="Cth: 150000.00"
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            {!!error && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 26, marginBottom: 12 }}>{error}</Text>}
            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, isSaving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Simpan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}