import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function UserEditModal({ visible, onClose, username, setUsername, password, setPassword, onSave, saving }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kemaskini Akses Pengguna</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nama Pengguna / Username</Text>
            <TextInput style={styles.modalInput} value={username} onChangeText={setUsername} autoCapitalize="none" />
            <Text style={styles.inputLabel}>Kata Laluan Baru (Biarkan kosong jika tidak mahu tukar)</Text>
            <TextInput style={styles.modalInput} value={password} onChangeText={setPassword} secureTextEntry placeholder="Masukkan kata laluan baru..." />
            <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Kredensial</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}