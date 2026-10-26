// src/screens/sekretariat/peta/ExistingHotspotModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X, MapPin, ChevronLeft } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

// Étape 2a : Kategori → Hotspot → Keterangan, puis le titik bencana est posé
// directement sur les coordonnées du hotspot choisi.
export default function ExistingHotspotModal({ visible, hotspotList, hotspotCategories, saveBencana, onNotify, onBack, onClose }) {
  const [existingCategoryFilter, setExistingCategoryFilter] = useState(null);
  const [selectedExistingHotspot, setSelectedExistingHotspot] = useState(null);
  const [existingKeterangan, setExistingKeterangan] = useState('');
  const [existingLokasi, setExistingLokasi] = useState('');
  const [existingPps, setExistingPps] = useState('');
  const [existingJumlahKir, setExistingJumlahKir] = useState('');
  const [existingJumlahMangsa, setExistingJumlahMangsa] = useState('');
  const [existingJumlahRumahTerjejas, setExistingJumlahRumahTerjejas] = useState('');
  const [savingExistingHotspot, setSavingExistingHotspot] = useState(false);

  // Repart d'un formulaire vide à chaque fermeture complète du flux
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (!visible) {
      setExistingCategoryFilter(null);
      setSelectedExistingHotspot(null);
      setExistingKeterangan('');
      setExistingLokasi('');
      setExistingPps('');
      setExistingJumlahKir('');
      setExistingJumlahMangsa('');
      setExistingJumlahRumahTerjejas('');
    }
  }

  const handlePickExistingHotspot = (hotspot) => {
    if (hotspot.latitude == null || hotspot.longitude == null) return;
    setSelectedExistingHotspot(hotspot);
    setExistingLokasi(hotspot.area || '');
    setExistingPps('');
    setExistingJumlahKir('');
    setExistingJumlahMangsa('');
    setExistingJumlahRumahTerjejas('');
  };

  const confirmSaveExistingHotspot = async () => {
    if (!selectedExistingHotspot) return;
    setSavingExistingHotspot(true);
    const categoryLabel = hotspotCategories.find((c) => c.key === selectedExistingHotspot.category)?.label || selectedExistingHotspot.category;
    const { error } = await saveBencana({
      category: selectedExistingHotspot.category,
      description: existingKeterangan,
      latitude: selectedExistingHotspot.latitude,
      longitude: selectedExistingHotspot.longitude,
      hotspot_id: selectedExistingHotspot.id,
      jenis_bencana: categoryLabel,
      lokasi: existingLokasi,
      pps: existingPps,
      jumlah_kir: existingJumlahKir,
      jumlah_mangsa: existingJumlahMangsa,
      jumlah_rumah_terjejas: existingJumlahRumahTerjejas,
    });
    setSavingExistingHotspot(false);
    if (!error) {
      onNotify?.('success', 'Titik bencana ditambah.');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%', maxHeight: '90%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (selectedExistingHotspot) setSelectedExistingHotspot(null);
                else if (existingCategoryFilter) setExistingCategoryFilter(null);
                else onBack();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={20} color={PALETTE.textMutedDark} />
              <Text style={sekretariatStyles.modalTitle}>
                {selectedExistingHotspot ? 'Keterangan' : existingCategoryFilter ? 'Pilih Hotspot' : 'Pilih Kategori'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>

          {selectedExistingHotspot ? (
            <ScrollView style={{ maxHeight: 640 }} contentContainerStyle={sekretariatStyles.modalForm}>
              <Text style={sekretariatStyles.inputLabel}>Kategori *</Text>
              <View style={[sekretariatStyles.input, { justifyContent: 'center' }]}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>
                  {hotspotCategories.find((c) => c.key === selectedExistingHotspot.category)?.label || selectedExistingHotspot.category}
                </Text>
              </View>
              <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Kg Rancha-Rancha"
                placeholderTextColor={PALETTE.textMutedDark}
                value={existingLokasi}
                onChangeText={setExistingLokasi}
              />
              <Text style={sekretariatStyles.inputLabel}>Jumlah KIR</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: 12"
                placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="number-pad"
                value={existingJumlahKir}
                onChangeText={(t) => setExistingJumlahKir(t.replace(/[^0-9]/g, ''))}
              />
              <Text style={sekretariatStyles.inputLabel}>Jumlah Mangsa</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: 45"
                placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="number-pad"
                value={existingJumlahMangsa}
                onChangeText={(t) => setExistingJumlahMangsa(t.replace(/[^0-9]/g, ''))}
              />
              <Text style={sekretariatStyles.inputLabel}>Jumlah Rumah Terjejas</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: 5"
                placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="number-pad"
                value={existingJumlahRumahTerjejas}
                onChangeText={(t) => setExistingJumlahRumahTerjejas(t.replace(/[^0-9]/g, ''))}
              />
              <Text style={sekretariatStyles.inputLabel}>PPS</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Dewan Komuniti Kg X"
                placeholderTextColor={PALETTE.textMutedDark}
                value={existingPps}
                onChangeText={setExistingPps}
              />
              <Text style={sekretariatStyles.inputLabel}>Catatan (pilihan)</Text>
              <TextInput
                style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Cth: Air naik setinggi 1 meter"
                placeholderTextColor={PALETTE.textMutedDark}
                multiline
                value={existingKeterangan}
                onChangeText={setExistingKeterangan}
              />
              <TouchableOpacity style={sekretariatStyles.saveButton} onPress={confirmSaveExistingHotspot} disabled={savingExistingHotspot}>
                {savingExistingHotspot ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan Titik</Text>}
              </TouchableOpacity>
            </ScrollView>
          ) : existingCategoryFilter ? (
            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
              {hotspotList.filter((h) => h.category === existingCategoryFilter.key).length === 0 ? (
                <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
                  Tiada hotspot direkodkan untuk kategori ini.
                </Text>
              ) : hotspotList.filter((h) => h.category === existingCategoryFilter.key).map((h) => {
                const hasCoords = h.latitude != null && h.longitude != null;
                return (
                  <TouchableOpacity
                    key={h.id}
                    disabled={!hasCoords}
                    onPress={() => handlePickExistingHotspot(h)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
                      borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0',
                      backgroundColor: hasCoords ? '#fff' : '#f8fafc', opacity: hasCoords ? 1 : 0.6,
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} color={PALETTE.orange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>{h.river}, {h.area}</Text>
                      {!hasCoords && (
                        <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Tiada koordinat direkodkan</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
              {hotspotCategories.length === 0 ? (
                <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
                  Tiada kategori direkodkan lagi.
                </Text>
              ) : hotspotCategories.map((cat) => {
                const pointCount = hotspotList.filter((h) => h.category === cat.key).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setExistingCategoryFilter(cat)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
                      borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', backgroundColor: '#fff',
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${cat.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>{cat.label}</Text>
                      {!!cat.sub && <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: 1 }}>{cat.sub}</Text>}
                    </View>
                    <View style={{ backgroundColor: `${cat.color}18`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: cat.color }}>{pointCount}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
