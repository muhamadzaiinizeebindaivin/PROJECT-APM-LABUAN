import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { PYRAMID_COLORS } from '../../hooks/useAngkatanEmployees';

export default function PyramidEditModal({ visible, isNew, pyramidForm, setPyramidForm, onSave, onClose, error, isSaving }) {
  const handleRankChange = (t) => {
    // Kata kunci carian suit automatiquement le nom sauf si l'utilisateur l'a
    // déjà modifié manuellement pour qu'il diffère du nom affiché.
    const shouldAutofill = pyramidForm.match_keyword === undefined || pyramidForm.match_keyword === pyramidForm.rank;
    setPyramidForm({
      ...pyramidForm,
      rank: t,
      match_keyword: shouldAutofill ? t : pyramidForm.match_keyword,
    });
  };
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
              onChangeText={handleRankChange}
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Kata Kunci Carian (Excel)</Text>
            <TextInput
              style={styles.modalInput}
              value={pyramidForm.match_keyword ?? pyramidForm.rank}
              onChangeText={(t) => setPyramidForm({ ...pyramidForm, match_keyword: t })}
              placeholder="Cth: Waran"
              placeholderTextColor={PALETTE.textMutedDark}
            />
            <Text style={styles.inputLabel}>Warna</Text>
            {Platform.OS === 'web' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {React.createElement('input', {
                  type: 'color',
                  value: pyramidForm.color || '#123456',
                  onChange: (e) => setPyramidForm({ ...pyramidForm, color: e.target.value }),
                  style: { width: 52, height: 40, padding: 0, border: `1px solid ${PALETTE.cardLightBorder}`, borderRadius: 10, cursor: 'pointer', background: 'none' },
                })}
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  value={pyramidForm.color}
                  onChangeText={(t) => setPyramidForm({ ...pyramidForm, color: t })}
                  placeholder="#123456"
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {PYRAMID_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setPyramidForm({ ...pyramidForm, color: c })}
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                      borderWidth: pyramidForm.color === c ? 3 : 0, borderColor: PALETTE.textDark,
                    }}
                  />
                ))}
              </View>
            )}
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