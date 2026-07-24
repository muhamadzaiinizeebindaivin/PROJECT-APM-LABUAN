import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function PecahanUnitEditModal({ visible, isNew, draft, setDraft, onSave, onClose, isSaving, error }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Unit' : 'Ubah Unit'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nama Unit</Text>
            <TextInput
              style={styles.modalInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="cth. Unit Pentadbiran"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            {!!error && (
              <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 14, marginBottom: 12 }}>{error}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: error ? 0 : 10 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 0 }, isSaving && { opacity: 0.7 }]}
                onPress={onSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
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
      </View>
    </Modal>
  );
}