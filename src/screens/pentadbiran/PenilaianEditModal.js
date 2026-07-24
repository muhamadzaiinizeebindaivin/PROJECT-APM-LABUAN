import React, { createElement } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

const dateInputWebStyle = {
  borderWidth: 1,
  borderColor: PALETTE.cardLightBorder,
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  backgroundColor: '#fafafa',
  color: PALETTE.textDark,
  marginBottom: 10,
  fontFamily: 'inherit',
  outlineStyle: 'none',
  outlineWidth: 0,
};

export default function PenilaianEditModal({ visible, isNew, draft, setDraft, onSave, onDelete, onClose, error }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Penilaian' : 'Ubah Penilaian'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Tarikh</Text>
            {Platform.OS === 'web' ? (
              createElement('input', {
                type: 'date',
                value: draft.tarikh || '',
                onChange: (e) => setDraft((prev) => ({ ...prev, tarikh: e.target.value })),
                style: dateInputWebStyle,
              })
            ) : (
              <TextInput
                style={styles.modalInput}
                value={draft.tarikh}
                onChangeText={(text) => setDraft((prev) => ({ ...prev, tarikh: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={PALETTE.textMutedDark}
              />
            )}

            <Text style={styles.inputLabel}>Agensi</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
              value={draft.agensi}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, agensi: text }))}
              multiline
              placeholder="Nama agensi"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Tajuk Penilaian</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
              value={draft.tajukPenilaian}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, tajukPenilaian: text }))}
              multiline
              placeholder="Penerangan ujian yang dijalankan"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            {!!error && (
              <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 14, marginBottom: 12 }}>{error}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: error ? 0 : 10 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 0 }]}
                onPress={onSave}
              >
                <Check size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}