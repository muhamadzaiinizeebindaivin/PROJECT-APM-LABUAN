// src/screens/sekretariat/peta/BencanaCompleteModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

const buildForm = (item) => ({
  jenis_bencana: item.jenis_bencana || '', lokasi: item.lokasi || '',
  jumlah_kir: item.jumlah_kir?.toString() || '', jumlah_mangsa: item.jumlah_mangsa?.toString() || '',
  jumlah_rumah_terjejas: item.jumlah_rumah_terjejas != null ? String(item.jumlah_rumah_terjejas) : '',
  pps: item.pps || '', description: item.description || '',
});

// "Selesai" — clôture d'un titik bencana actif (item = le point, null = fermé)
export default function BencanaCompleteModal({ item, onSave, onClose }) {
  const [completeForm, setCompleteForm] = useState({ jenis_bencana: '', lokasi: '', jumlah_kir: '', jumlah_mangsa: '', pps: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Pré-remplit le formulaire quand un nouveau point est ouvert
  const [prevItem, setPrevItem] = useState(null);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) setCompleteForm(buildForm(item));
  }

  const submit = async () => {
    if (!item) return;
    setSaving(true);
    await onSave(item, completeForm);
    setSaving(false);
  };

  return (
    <Modal visible={item !== null} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%', maxHeight: '90%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <Text style={sekretariatStyles.modalTitle}>Lengkapkan Titik Bencana</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 640 }} contentContainerStyle={sekretariatStyles.modalForm}>
            <Text style={sekretariatStyles.inputLabel}>Jenis Bencana</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Banjir Kilat"
              placeholderTextColor={PALETTE.textMutedDark}
              value={completeForm.jenis_bencana}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, jenis_bencana: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Lokasi</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Kampung Bebuloh"
              placeholderTextColor={PALETTE.textMutedDark}
              value={completeForm.lokasi}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, lokasi: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah KIR</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 4"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={completeForm.jumlah_kir}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, jumlah_kir: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Mangsa</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 12"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={completeForm.jumlah_mangsa}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, jumlah_mangsa: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Rumah Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 5"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="number-pad"
              value={completeForm.jumlah_rumah_terjejas}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, jumlah_rumah_terjejas: t.replace(/[^0-9]/g, '') }))}
            />
            <Text style={sekretariatStyles.inputLabel}>PPS</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Dewan Serbaguna Kampung Bebuloh"
              placeholderTextColor={PALETTE.textMutedDark}
              value={completeForm.pps}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, pps: t }))}
            />
            <Text style={sekretariatStyles.inputLabel}>Catatan</Text>
            <TextInput
              style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Catatan tambahan"
              placeholderTextColor={PALETTE.textMutedDark}
              multiline
              value={completeForm.description}
              onChangeText={(t) => setCompleteForm((f) => ({ ...f, description: t }))}
            />
            <TouchableOpacity style={sekretariatStyles.saveButton} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan & Tandakan Selesai</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
