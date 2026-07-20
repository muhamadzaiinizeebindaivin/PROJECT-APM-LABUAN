import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CertEditModal({ visible, isNew, certForm, setCertForm, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Sijil</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nama Sijil</Text>
            <TextInput
              style={styles.modalInput}
              value={certForm.nom_certificat}
              onChangeText={(t) => setCertForm({ ...certForm, nom_certificat: t })}
              placeholder="Cth: Sijil Pertolongan Cemas"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Pautan Google Drive</Text>
            <TextInput
              style={styles.modalInput}
              value={certForm.google_drive_link}
              onChangeText={(t) => setCertForm({ ...certForm, google_drive_link: t })}
              placeholder="https://drive.google.com/..."
              placeholderTextColor={PALETTE.textMutedDark}
              autoCapitalize="none"
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