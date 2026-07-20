import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CommunityEditModal({ visible, isNew, communityForm, setCommunityForm, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Program Komuniti</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <TextInput
              style={styles.modalInput}
              value={communityForm.category}
              onChangeText={(t) => setCommunityForm({ ...communityForm, category: t })}
              placeholder="Cth: PAP"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Label</Text>
            <TextInput
              style={styles.modalInput}
              value={communityForm.label}
              onChangeText={(t) => setCommunityForm({ ...communityForm, label: t })}
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Butiran</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              value={communityForm.detail}
              onChangeText={(t) => setCommunityForm({ ...communityForm, detail: t })}
              multiline
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Warna (Hex)</Text>
            <TextInput
              style={styles.modalInput}
              value={communityForm.color}
              onChangeText={(t) => setCommunityForm({ ...communityForm, color: t })}
              placeholder="#1D4E89"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}