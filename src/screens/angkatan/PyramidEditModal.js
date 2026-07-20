import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function PyramidEditModal({ visible, isNew, pyramidForm, setPyramidForm, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Struktur Pangkat</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Pangkat</Text>
            <TextInput
              style={styles.modalInput}
              value={pyramidForm.rank}
              onChangeText={(t) => setPyramidForm({ ...pyramidForm, rank: t })}
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Jumlah</Text>
            <TextInput
              style={styles.modalInput}
              value={String(pyramidForm.total)}
              onChangeText={(t) => setPyramidForm({ ...pyramidForm, total: t })}
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Warna (Hex)</Text>
            <TextInput
              style={styles.modalInput}
              value={pyramidForm.color}
              onChangeText={(t) => setPyramidForm({ ...pyramidForm, color: t })}
              placeholder="#123456"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Turutan Paparan</Text>
            <TextInput
              style={styles.modalInput}
              value={String(pyramidForm.display_order)}
              onChangeText={(t) => setPyramidForm({ ...pyramidForm, display_order: t })}
              keyboardType="numeric"
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