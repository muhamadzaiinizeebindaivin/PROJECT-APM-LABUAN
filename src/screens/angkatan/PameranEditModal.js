import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function PameranEditModal({ visible, isNew, pameranForm, setPameranForm, onSave, onClose, error, isSaving }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Pameran</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Agensi</Text>
            <TextInput
              style={styles.modalInput}
              value={pameranForm.agensi}
              onChangeText={(t) => setPameranForm({ ...pameranForm, agensi: t })}
              placeholder="Cth: APM Labuan"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Tajuk</Text>
            <TextInput
              style={styles.modalInput}
              value={pameranForm.tajuk}
              onChangeText={(t) => setPameranForm({ ...pameranForm, tajuk: t })}
              placeholder="Cth: Pameran Kesiapsiagaan Bencana"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Bilangan Pengunjung</Text>
            <TextInput
              style={styles.modalInput}
              value={String(pameranForm.bilangan_pengunjung)}
              onChangeText={(t) => setPameranForm({ ...pameranForm, bilangan_pengunjung: t.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            {!!error && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 12 }}>{error}</Text>}
            <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.7 }]} onPress={onSave} disabled={isSaving}>
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