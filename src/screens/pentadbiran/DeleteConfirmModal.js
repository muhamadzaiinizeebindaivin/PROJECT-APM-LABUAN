import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function DeleteConfirmModal({ visible, username, onCancel, onConfirm, deleting }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 400 }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 10, paddingTop: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.dangerIconCircle}><ShieldAlert size={22} color="#dc2626" /></View>
              <Text style={[styles.modalTitle, { color: '#dc2626', fontSize: 17 }]}>Pengesahan Padam</Text>
            </View>
          </View>
          <View style={[styles.modalBody, { paddingTop: 10 }]}>
            <Text style={styles.confirmText}>
              Adakah anda pasti mahu memadam akses untuk pengguna <Text style={{ fontWeight: 'bold' }}>'{username}'</Text>? Tindakan ini kekal dan tidak boleh dipulihkan.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={deleting}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={onConfirm} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ya, Padam</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}