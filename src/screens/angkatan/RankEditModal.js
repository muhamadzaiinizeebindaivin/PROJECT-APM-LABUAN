import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const FIELDS = [
  { key: 'rank', label: 'Peringkat', numeric: false },
  { key: 'ptb', label: 'PTB', numeric: true },
  { key: 'aktif', label: 'Aktif', numeric: true },
  { key: 'simpanan', label: 'Simpanan', numeric: true },
];

export default function RankEditModal({ visible, rankForm, setRankForm, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kemaskini Rekod Pangkat</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.modalBody}>
            {FIELDS.map((f) => (
              <View key={f.key}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rankForm[f.key]}
                  onChangeText={(t) => setRankForm({ ...rankForm, [f.key]: t })}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  placeholderTextColor={PALETTE.textMutedDark}
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