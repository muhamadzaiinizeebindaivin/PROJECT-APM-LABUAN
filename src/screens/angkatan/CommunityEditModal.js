import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Check, AlertCircle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA', 'CDA'];
const CATEGORY_COLORS = {
  TUSPA: '#3b82f6',
  KASPA: '#22c55e',
  PISPA: '#8b5cf6',
  SISPA: '#ef4444',
  CDA: '#14b8a6',
};

export default function CommunityEditModal({ visible, isNew, communityForm, setCommunityForm, onSave, onClose, error, isSaving }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Program Komuniti' : 'Kemaskini Program Komuniti'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const catColor = CATEGORY_COLORS[cat];
                const isActive = communityForm.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
                      isActive
                        ? { backgroundColor: catColor, borderColor: catColor }
                        : { backgroundColor: PALETTE.surface, borderColor: PALETTE.cardLightBorder },
                    ]}
                    onPress={() => setCommunityForm({ ...communityForm, category: cat })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? '#fff' : PALETTE.textMutedDark }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Tempat</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              value={communityForm.tempat}
              onChangeText={(t) => setCommunityForm({ ...communityForm, tempat: t })}
              placeholder="Cth: Kampung Sungai Lada"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Keterangan</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
              value={communityForm.detail}
              onChangeText={(t) => setCommunityForm({ ...communityForm, detail: t })}
              placeholder="Butiran ringkas program..."
              placeholderTextColor={PALETTE.textMutedDark}
              multiline
            />

            {error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <AlertCircle size={16} color="#dc2626" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626', flex: 1 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, isSaving && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={isSaving}
            >
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}