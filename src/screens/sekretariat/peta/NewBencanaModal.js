// src/screens/sekretariat/peta/NewBencanaModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import ModalSelectField from '../../../components/ModalSelectField';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { CATEGORY_ICON_OPTIONS, CATEGORY_COLORS } from './petaUtils';

// Étape 2b : formulaire d'un point libre, une fois l'emplacement choisi
// (via PilihLokasiModal ou clic sur la carte). Permet aussi de créer une
// nouvelle catégorie à la volée ("Lain-lain").
export default function NewBencanaModal({ visible, theme, placement, hotspotCategories, addHotspotCategory, saveBencana, onClose }) {
  const [newHotspotCategory, setNewHotspotCategory] = useState('');
  const [newHotspotCategoryOpen, setNewHotspotCategoryOpen] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [customCategoryColor, setCustomCategoryColor] = useState('#1D4E89');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('MapPin');
  const [bencanaDescription, setBencanaDescription] = useState('');
  const [bencanaLokasi, setBencanaLokasi] = useState('');
  const [bencanaPps, setBencanaPps] = useState('');
  const [bencanaJumlahKir, setBencanaJumlahKir] = useState('');
  const [bencanaJumlahMangsa, setBencanaJumlahMangsa] = useState('');
  const [bencanaJumlahRumahTerjejas, setBencanaJumlahRumahTerjejas] = useState('');
  const [bencanaFormError, setBencanaFormError] = useState(null);
  const [savingBencana, setSavingBencana] = useState(false);

  // Repart d'un formulaire vide à chaque fermeture
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (!visible) {
      setNewHotspotCategory('');
      setCustomCategoryText('');
      setCustomCategoryColor('#1D4E89');
      setCustomCategoryIcon('MapPin');
      setBencanaDescription('');
      setBencanaLokasi('');
      setBencanaPps('');
      setBencanaJumlahKir('');
      setBencanaJumlahMangsa('');
      setBencanaJumlahRumahTerjejas('');
      setBencanaFormError(null);
    }
  }

  const handleSaveBencana = async () => {
    if (!placement) return;
    setBencanaFormError(null);

    const isCustom = newHotspotCategory === '__custom__';
    if (!newHotspotCategory || (isCustom && !customCategoryText.trim())) {
      setBencanaFormError(isCustom ? 'Sila taip kategori.' : 'Sila pilih kategori.');
      return;
    }

    setSavingBencana(true);
    let categoryKey = newHotspotCategory;

    if (isCustom) {
      const ok = await addHotspotCategory({
        label: customCategoryText.trim(), sub: '', color: customCategoryColor, prefix: 'ID', icon: customCategoryIcon,
      });
      if (!ok) { setSavingBencana(false); return; }
      // Même dérivation de clé que useHotspotCategories.addCategory
      categoryKey = customCategoryText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }

    // Point libre — pas lié à un hotspot (hotspots ne sert que de raccourci
    // pour pointer un lieu déjà connu, pas à enregistrer de nouvelles données).
    const categoryLabel = hotspotCategories.find((c) => c.key === categoryKey)?.label || (isCustom ? customCategoryText.trim() : categoryKey);
    const { error } = await saveBencana({
      category: categoryKey,
      description: bencanaDescription,
      latitude: placement.lat,
      longitude: placement.lng,
      hotspot_id: null,
      jenis_bencana: categoryLabel,
      lokasi: bencanaLokasi,
      pps: bencanaPps,
      jumlah_kir: bencanaJumlahKir,
      jumlah_mangsa: bencanaJumlahMangsa,
      jumlah_rumah_terjejas: bencanaJumlahRumahTerjejas,
    });
    setSavingBencana(false);
    if (!error) onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <Text style={sekretariatStyles.modalTitle}>Titik Baharu</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <View style={sekretariatStyles.modalForm}>
            <ModalSelectField
              theme={theme}
              label="Kategori *"
              value={
                newHotspotCategory === '__custom__'
                  ? 'Lain-lain'
                  : newHotspotCategory ? (hotspotCategories.find((c) => c.key === newHotspotCategory)?.label || newHotspotCategory) : ''
              }
              placeholder="Pilih kategori"
              options={[...hotspotCategories.map((c) => c.label), 'Lain-lain']}
              isOpen={newHotspotCategoryOpen}
              onToggle={() => setNewHotspotCategoryOpen((v) => !v)}
              onSelect={(label) => {
                if (label === 'Lain-lain') {
                  setNewHotspotCategory('__custom__');
                } else {
                  const match = hotspotCategories.find((c) => c.label === label);
                  setNewHotspotCategory(match ? match.key : '');
                  setCustomCategoryText('');
                }
                setNewHotspotCategoryOpen(false);
              }}
              stackIndex={500}
            />
            {newHotspotCategory === '__custom__' && (
              <View style={{ marginBottom: 14 }}>
                <Text style={sekretariatStyles.inputLabel}>Nama Kategori Baharu *</Text>
                <TextInput
                  style={sekretariatStyles.input}
                  placeholder="Cth: Ribut Petir"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={customCategoryText}
                  onChangeText={setCustomCategoryText}
                  autoFocus
                />
                <Text style={[sekretariatStyles.inputLabel, { marginTop: 10 }]}>Ikon</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  {CATEGORY_ICON_OPTIONS.map(({ key, Icon }) => {
                    const selected = customCategoryIcon === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setCustomCategoryIcon(key)}
                        style={{
                          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: selected ? customCategoryColor : '#f1f5f9',
                          borderWidth: selected ? 0 : 1, borderColor: '#e2e8f0',
                        }}
                      >
                        <Icon size={17} color={selected ? '#fff' : PALETTE.textMutedDark} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={sekretariatStyles.inputLabel}>Warna</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {CATEGORY_COLORS.map((color) => {
                    const selected = customCategoryColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setCustomCategoryColor(color)}
                        style={{
                          width: 30, height: 30, borderRadius: 15, backgroundColor: color,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: selected ? 3 : 0, borderColor: '#fff',
                          shadowColor: selected ? color : 'transparent', shadowOpacity: selected ? 0.5 : 0, shadowRadius: 4, elevation: selected ? 3 : 0,
                        }}
                      >
                        {selected && <Check size={14} color="#fff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            {bencanaFormError && (
              <Text style={{ color: PALETTE.danger || '#dc2626', fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
                {bencanaFormError}
              </Text>
            )}
            <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Kg Rancha-Rancha"
              placeholderTextColor={PALETTE.textMutedDark}
              value={bencanaLokasi}
              onChangeText={setBencanaLokasi}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah KIR</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 12"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="numeric"
              value={bencanaJumlahKir}
              onChangeText={(t) => setBencanaJumlahKir(t.replace(/[^0-9]/g, ''))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Mangsa</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 45"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="numeric"
              value={bencanaJumlahMangsa}
              onChangeText={(t) => setBencanaJumlahMangsa(t.replace(/[^0-9]/g, ''))}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Rumah Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 5"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="numeric"
              value={bencanaJumlahRumahTerjejas}
              onChangeText={(t) => setBencanaJumlahRumahTerjejas(t.replace(/[^0-9]/g, ''))}
            />
            <Text style={sekretariatStyles.inputLabel}>PPS</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Dewan Komuniti Kg X"
              placeholderTextColor={PALETTE.textMutedDark}
              value={bencanaPps}
              onChangeText={setBencanaPps}
            />
            <Text style={sekretariatStyles.inputLabel}>Catatan (pilihan)</Text>
            <TextInput
              style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Cth: Air naik setinggi 1 meter"
              placeholderTextColor={PALETTE.textMutedDark}
              multiline
              value={bencanaDescription}
              onChangeText={setBencanaDescription}
            />
            <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleSaveBencana} disabled={savingBencana}>
              {savingBencana ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan Titik</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
