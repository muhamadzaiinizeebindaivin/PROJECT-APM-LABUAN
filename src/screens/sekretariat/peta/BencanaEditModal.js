// src/screens/sekretariat/peta/BencanaEditModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

const buildForm = (item) => ({
  category: item.category || '', lokasi: item.lokasi || '', pps: item.pps || '', description: item.description || '',
  jumlah_kir: item.jumlah_kir != null ? String(item.jumlah_kir) : '',
  jumlah_mangsa: item.jumlah_mangsa != null ? String(item.jumlah_mangsa) : '',
  jumlah_rumah_terjejas: item.jumlah_rumah_terjejas != null ? String(item.jumlah_rumah_terjejas) : '',
});

// Modification d'un titik bencana actif (item = le point, null = fermé)
export default function BencanaEditModal({ item, onSave, onClose }) {
  const [editForm, setEditForm] = useState({ category: '', lokasi: '', pps: '', description: '', jumlah_kir: '', jumlah_mangsa: '', jumlah_rumah_terjejas: '' });
  const [saving, setSaving] = useState(false);

  // Pré-remplit le formulaire quand un nouveau point est ouvert
  const [prevItem, setPrevItem] = useState(null);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) setEditForm(buildForm(item));
  }

  const submit = async () => {
    if (!item) return;
    setSaving(true);
    await onSave(item, editForm);
    setSaving(false);
  };

  return (
    <Modal visible={item !== null} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%', maxHeight: '90%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <Text style={sekretariatStyles.modalTitle}>Kemaskini Titik Bencana</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 640 }} contentContainerStyle={sekretariatStyles.modalForm}>
            <Text style={sekretariatStyles.inputLabel}>Kategori</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Kategori"
              placeholderTextColor={PALETTE.textMutedDark}
              value={editForm.category}
              onChangeText={(t) => setEditForm((f) => ({ ...f, category: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Kg Rancha-Rancha"
              placeholderTextColor={PALETTE.textMutedDark}
              value={editForm.lokasi}
              onChangeText={(t) => setEditForm((f) => ({ ...f, lokasi: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah KIR</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 12"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={editForm.jumlah_kir}
              onChangeText={(t) => setEditForm((f) => ({ ...f, jumlah_kir: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Mangsa</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 45"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={editForm.jumlah_mangsa}
              onChangeText={(t) => setEditForm((f) => ({ ...f, jumlah_mangsa: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Rumah Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 5"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={editForm.jumlah_rumah_terjejas}
              onChangeText={(t) => setEditForm((f) => ({ ...f, jumlah_rumah_terjejas: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>PPS</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Dewan Serbaguna Kampung Bebuloh"
              placeholderTextColor={PALETTE.textMutedDark}
              value={editForm.pps}
              onChangeText={(t) => setEditForm((f) => ({ ...f, pps: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Catatan</Text>
            <TextInput
              style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Catatan tambahan"
              placeholderTextColor={PALETTE.textMutedDark}
              multiline
              value={editForm.description}
              onChangeText={(t) => setEditForm((f) => ({ ...f, description: t }))}
            />
            <TouchableOpacity style={sekretariatStyles.saveButton} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
