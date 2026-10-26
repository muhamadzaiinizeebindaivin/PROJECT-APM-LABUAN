// src/screens/sekretariat/hotspot/HotspotFormModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

// Ajout / modification d'un point hotspot
export default function HotspotFormModal({ visible, mode, form, setForm, categories, loading, onSave, onClose }) {
  // ---- Champ koordonnées combiné (format Google Maps: "lat, lng") ----
  const [coordsText, setCoordsText] = useState('');
  useEffect(() => {
    if (visible) {
      setCoordsText(
        form.latitude && form.longitude
          ? `${form.latitude}, ${form.longitude}`
          : ''
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCoordsChange = (raw) => {
    const cleaned = raw.replace(/[^0-9.\-,\s]/g, '');
    setCoordsText(cleaned);
    const parts = cleaned.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setForm({ ...form, latitude: parts[0], longitude: parts[1] });
      }
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 860 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{mode === 'add' ? 'Tambah Hotspot' : 'Kemaskini Hotspot'}</Text>
            <TouchableOpacity onPress={() => onClose()}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            <Text style={styles.inputLabel}>Kategori Hotspot</Text>
            <View style={[styles.categoryBtn, styles.categoryBtnActive, { alignSelf: 'flex-start' }]}>
              <Text style={[styles.categoryBtnText, styles.categoryBtnTextActive]}>
                {categories.find(c => c.key === form.category)?.label || form.category}
              </Text>
            </View>
            <Text style={styles.inputLabel}>No. Rujukan</Text>
            <TextInput style={styles.input} placeholder="Cth: 1, 2, 3,..." value={form.ref_no} onChangeText={(t) => setForm({ ...form, ref_no: t })} />
            <Text style={styles.inputLabel}>Lokasi Utama</Text>
            <TextInput style={styles.input} placeholder="Cth: Sg. Kinabenua" value={form.river} onChangeText={(t) => setForm({ ...form, river: t })} />
            <Text style={styles.inputLabel}>Kawasan Terjejas</Text>
            <TextInput style={styles.input} placeholder="Cth: Kg Rancha Rancha" value={form.area} onChangeText={(t) => setForm({ ...form, area: t })} />
            <Text style={styles.inputLabel}>Koordinat (Latitud, Longitud)</Text>
            <Text style={{ fontSize: 11, fontStyle: 'italic', color: PALETTE.textMutedDark, marginTop: -8, marginBottom: 6 }}>
              Salin terus dari Google Maps (klik lokasi pada peta, tampal di sini)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Cth: 5.263464499491023, 115.22960127925502"
              value={coordsText}
              onChangeText={handleCoordsChange}
            />
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              {loading ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Hotspot</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
