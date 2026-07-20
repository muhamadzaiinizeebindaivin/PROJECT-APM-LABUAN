import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CategoryEditModal({ visible, isNew, categoryForm, setCategoryForm, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Penjawatan</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nama</Text>
            <TextInput
              style={styles.modalInput}
              value={categoryForm.name}
              onChangeText={(t) => setCategoryForm({ ...categoryForm, name: t })}
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Bilangan</Text>
            <TextInput
              style={styles.modalInput}
              value={String(categoryForm.count)}
              onChangeText={(t) => setCategoryForm({ ...categoryForm, count: t })}
              keyboardType="numeric"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Warna (Hex)</Text>
            <TextInput
              style={styles.modalInput}
              value={categoryForm.color}
              onChangeText={(t) => setCategoryForm({ ...categoryForm, color: t })}
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