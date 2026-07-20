import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';

export default function SummaryEditModal({ visible, draft, setDraft, onSave, onClose, saving }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kemaskini Peruntukan Tahunan</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Tajuk</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.title}
              onChangeText={(t) => setDraft((p) => ({ ...p, title: t }))}
              placeholder="Cth: Tahun Kewangan 2026"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Peruntukan (RM)</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.total}
              onChangeText={(t) => setDraft((p) => ({ ...p, total: t }))}
              placeholder="Cth: 333552.48"
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Check size={16} color="#fff" />}
              <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}