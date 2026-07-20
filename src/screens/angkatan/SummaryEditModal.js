import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const EXCLUDED_KEYS = ['id', 'total_anggota', 'aktif_anggota', 'male_count', 'female_count', 'status_lulus', 'status_lantikan', 'status_simpanan', 'status_aktif'];

export default function SummaryEditModal({ visible, summaryForm, setSummaryForm, onSave, onClose }) {
  const editableKeys = Object.keys(summaryForm).filter((k) => !EXCLUDED_KEYS.includes(k));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kemaskini Rumusan</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.modalBody}>
            {editableKeys.map((key) => (
              <View key={key}>
                <Text style={styles.inputLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(summaryForm[key] || '')}
                  onChangeText={(text) => setSummaryForm({ ...summaryForm, [key]: parseInt(text, 10) || 0 })}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}