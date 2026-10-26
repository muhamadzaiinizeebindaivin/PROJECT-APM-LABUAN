// src/screens/sekretariat/hotspot/CategoryFormModal.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';
import { ICONS, COLOR_CHOICES } from './hotspotConstants';

// Ajout / modification d'une catégorie de hotspot
export default function CategoryFormModal({ visible, isEditing, form, setForm, onSave, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Kemaskini Kategori' : 'Tambah Kategori'}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            <Text style={styles.inputLabel}>Nama Kategori *</Text>
            <TextInput style={styles.input} placeholder="Cth: HOTSPOT RIBUT" value={form.label} onChangeText={(t) => setForm({ ...form, label: t })} />
            <Text style={styles.inputLabel}>Keterangan</Text>
            <TextInput style={styles.input} placeholder="Cth: Kawasan berisiko ribut kencang" value={form.sub} onChangeText={(t) => setForm({ ...form, sub: t })} />

            <Text style={styles.inputLabel}>Ikon</Text>
            <View style={hotspotStyles.iconGrid}>
              {Object.entries(ICONS).map(([name, IconCmp]) => {
                const isSelected = form.icon === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      hotspotStyles.iconCell,
                      isSelected && { backgroundColor: form.color + '18', borderColor: form.color },
                    ]}
                    onPress={() => setForm({ ...form, icon: name })}
                  >
                    <IconCmp size={20} color={isSelected ? form.color : PALETTE.textMutedDark} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Warna</Text>
            <View style={hotspotStyles.colorRow}>
              {COLOR_CHOICES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[hotspotStyles.colorSwatch, { backgroundColor: c }, form.color === c && hotspotStyles.colorSwatchSelected]}
                  onPress={() => setForm({ ...form, color: c })}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>{isEditing ? 'Kemaskini Kategori' : 'Simpan Kategori'}</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
