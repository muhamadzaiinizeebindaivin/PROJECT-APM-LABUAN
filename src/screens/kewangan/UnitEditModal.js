import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';

export default function UnitEditModal({ visible, isNew, draft, setDraft, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Kakitangan' : 'Ubah Kakitangan'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nama</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.name}
              onChangeText={(t) => setDraft((p) => ({ ...p, name: t }))}
              placeholder="Cth: En. Ahmad Bin Sangka (Gred W2)"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Peranan</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.role}
              onChangeText={(t) => setDraft((p) => ({ ...p, role: t }))}
              placeholder="Cth: Sektor Kewangan"
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