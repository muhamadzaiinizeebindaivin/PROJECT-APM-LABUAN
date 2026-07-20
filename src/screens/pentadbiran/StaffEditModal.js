import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Trash2, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function StaffEditModal({ visible, isNew, draft, setDraft, onSave, onDelete, onClose }) {
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
              onChangeText={(text) => setDraft((prev) => ({ ...prev, name: text }))}
              placeholder="cth. Norhana binti Sabudin (Gred N2)"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Peranan</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.role}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, role: text }))}
              placeholder="cth. (Sumber Manusia)"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              {!isNew && (
                <TouchableOpacity style={styles.kpiModalDeleteBtn} onPress={onDelete}>
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={styles.kpiModalDeleteBtnText}>Padam</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 0 }]}
                onPress={onSave}
              >
                <Check size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}