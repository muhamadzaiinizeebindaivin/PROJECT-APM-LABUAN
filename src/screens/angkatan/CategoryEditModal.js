import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const CATEGORY_COLORS = ['#1D4E89', '#F4762B', '#7c3aed', '#dc2626', '#16a34a', '#0891b2', '#d97706', '#db2777', '#123456', '#5C6773'];

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
            <Text style={styles.inputLabel}>Kata Kunci Carian (Excel)</Text>
            <TextInput
              style={styles.modalInput}
              value={categoryForm.myaspa_key || ''}
              onChangeText={(t) => setCategoryForm({ ...categoryForm, myaspa_key: t })}
              placeholder="Cth: MyASPA-P"
              placeholderTextColor={PALETTE.textMutedDark}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Warna</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {CATEGORY_COLORS.map((color) => {
                const selected = categoryForm.color === color;
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setCategoryForm({ ...categoryForm, color })}
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: color,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: selected ? 3 : 0, borderColor: '#fff',
                      shadowColor: selected ? color : 'transparent', shadowOpacity: selected ? 0.5 : 0, shadowRadius: 4, elevation: selected ? 3 : 0,
                    }}
                  >
                    {selected && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
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