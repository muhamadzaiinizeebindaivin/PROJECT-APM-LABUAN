import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Platform } from 'react-native';
import { X, Check, Car, Truck, Bike, Bus, Siren, Ship, Sailboat, Anchor, Waves } from 'lucide-react-native';

const showError = (message) => {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('Ralat', message);
};
import { PALETTE } from '../../constants/palette';
import { logistikStyles as styles } from './logistikStyles';

const TYPE_OPTIONS = {
  Darat: ['Kereta', '4x4', 'Van', 'Lori', 'Bas', 'Motosikal', 'Ambulans'],
  Laut: ['Bot', 'Bot Peronda', 'Bot Layar', 'Jet Ski', 'Tug Boat'],
};

const ICON_OPTIONS = [
  { key: 'car', label: 'Kereta', Icon: Car },
  { key: 'lori', label: 'Lori', Icon: Truck },
  { key: 'van', label: 'Van', Icon: Truck },
  { key: 'bas', label: 'Bas', Icon: Bus },
  { key: 'motor', label: 'Motosikal', Icon: Bike },
  { key: 'ambulans', label: 'Ambulans', Icon: Siren },
  { key: 'boat', label: 'Bot', Icon: Ship },
  { key: 'sailboat', label: 'Bot Layar', Icon: Sailboat },
  { key: 'jetski', label: 'Jet Ski', Icon: Waves },
  { key: 'anchor', label: 'Peralatan Laut', Icon: Anchor },
];
const STATUS_OPTIONS = ['Baik', 'Selenggara', 'Rosak'];
const DEFAULT_FORM = { category: 'Darat', type: 'Lori', model: '', reg: '', status: 'Baik', nota_selenggara: '', icon_key: 'lori' };

export default function AssetFormModal({ visible, onClose, editingAsset, onSave }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryMode, setCategoryMode] = useState('preset'); // 'preset' | 'custom'
  const [typeMode, setTypeMode] = useState('preset');
  const [customCategory, setCustomCategory] = useState('');
  const [customType, setCustomType] = useState('');

  const KNOWN_CATEGORIES = ['Darat', 'Laut'];

  useEffect(() => {
    if (!visible) return;
    if (editingAsset) {
      const isCustomCategory = !KNOWN_CATEGORIES.includes(editingAsset.category);
      const presetTypes = TYPE_OPTIONS[editingAsset.category] || [];
      const isCustomType = !presetTypes.includes(editingAsset.type);

      setFormData({
        category: editingAsset.category,
        type: editingAsset.type,
        model: editingAsset.model,
        reg: editingAsset.reg || '',
        status: editingAsset.status,
        nota_selenggara: editingAsset.nota_selenggara || '',
        icon_key: editingAsset.icon_key || 'car',
      });
      setCategoryMode(isCustomCategory ? 'custom' : 'preset');
      setCustomCategory(isCustomCategory ? editingAsset.category : '');
      setTypeMode(isCustomType ? 'custom' : 'preset');
      setCustomType(isCustomType ? editingAsset.type : '');
    } else {
      setFormData(DEFAULT_FORM);
      setCategoryMode('preset');
      setCustomCategory('');
      setTypeMode('preset');
      setCustomType('');
    }
  }, [visible, editingAsset]);

  const handleSave = async () => {
    if (!formData.model) return showError('Sila masukkan model aset.');
    if (categoryMode === 'custom' && !customCategory.trim()) {
      return showError('Sila masukkan nama kategori baharu.');
    }
    if (!formData.type || !formData.type.trim()) {
      return showError('Sila masukkan atau pilih jenis aset.');
    }
    if (formData.status === 'Selenggara' && !formData.nota_selenggara.trim()) {
      return showError('Sila masukkan catatan penyelenggaraan.');
    }

    setIsSaving(true);
    const payload = {
      category: formData.category,
      type: formData.type,
      model: formData.model,
      reg: formData.reg ? formData.reg.toUpperCase() : null,
      status: formData.status,
      nota_selenggara: formData.status === 'Selenggara' ? formData.nota_selenggara : null,
      icon_key: formData.icon_key,
    };

    const ok = await onSave(payload, editingAsset);
    setIsSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingAsset ? 'Kemaskini Logistik' : 'Tambah Logistik'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: categoryMode === 'custom' ? 10 : 16 }}>
              {KNOWN_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  disabled={!!editingAsset}
                  style={[styles.chip, (categoryMode === 'preset' && formData.category === cat) ? styles.chipActive : styles.chipInactive, !!editingAsset && { opacity: 0.5 }]}
                  onPress={() => {
                    setCategoryMode('preset');
                    setFormData({ ...formData, category: cat, type: TYPE_OPTIONS[cat][0] });
                    setTypeMode('preset');
                  }}
                >
                  <Text style={[styles.chipText, (categoryMode === 'preset' && formData.category === cat) && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                disabled={!!editingAsset}
                style={[styles.chip, categoryMode === 'custom' ? styles.chipActive : styles.chipInactive, !!editingAsset && { opacity: 0.5 }]}
                onPress={() => {
                  setCategoryMode('custom');
                  setTypeMode('custom');
                  setFormData({ ...formData, category: customCategory, type: '' });
                }}
              >
                <Text style={[styles.chipText, categoryMode === 'custom' && styles.chipTextActive]}>Lain-lain</Text>
              </TouchableOpacity>
            </View>

            {categoryMode === 'custom' && (
              <TextInput
                style={[styles.modalInput, { marginBottom: 16 }]}
                value={customCategory}
                onChangeText={(t) => { setCustomCategory(t); setFormData({ ...formData, category: t }); }}
                placeholder="Cth: Rescue, Udara..."
                placeholderTextColor={PALETTE.textMutedDark}
                editable={!editingAsset}
              />
            )}

            <Text style={styles.inputLabel}>Jenis</Text>
            {(() => {
              const presetTypes = TYPE_OPTIONS[formData.category] || [];
              if (presetTypes.length === 0) {
                // Catégorie personnalisée : pas de présets possibles, saisie directe
                return (
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 16 }]}
                    value={formData.type}
                    onChangeText={(t) => setFormData({ ...formData, type: t })}
                    placeholder="Cth: Drone, Jengkaut..."
                    placeholderTextColor={PALETTE.textMutedDark}
                  />
                );
              }
              return (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: typeMode === 'custom' ? 10 : 16 }}>
                    {presetTypes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, (typeMode === 'preset' && formData.type === t) ? styles.chipActive : styles.chipInactive]}
                        onPress={() => { setTypeMode('preset'); setFormData({ ...formData, type: t }); }}
                      >
                        <Text style={[styles.chipText, (typeMode === 'preset' && formData.type === t) && styles.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.chip, typeMode === 'custom' ? styles.chipActive : styles.chipInactive]}
                      onPress={() => { setTypeMode('custom'); setFormData({ ...formData, type: customType }); }}
                    >
                      <Text style={[styles.chipText, typeMode === 'custom' && styles.chipTextActive]}>Lain-lain</Text>
                    </TouchableOpacity>
                  </View>
                  {typeMode === 'custom' && (
                    <TextInput
                      style={[styles.modalInput, { marginBottom: 16 }]}
                      value={customType}
                      onChangeText={(t) => { setCustomType(t); setFormData({ ...formData, type: t }); }}
                      placeholder="Cth: Trak Bomba"
                      placeholderTextColor={PALETTE.textMutedDark}
                    />
                  )}
                </>
              );
            })()}

            <Text style={styles.inputLabel}>Model</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              value={formData.model}
              onChangeText={(t) => setFormData({ ...formData, model: t })}
              placeholder="Cth: Toyota Hilux"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Ikon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {ICON_OPTIONS.map((opt) => {
                const isActive = formData.icon_key === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, { flexDirection: 'row', alignItems: 'center', gap: 6 }, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setFormData({ ...formData, icon_key: opt.key })}
                  >
                    <opt.Icon size={14} color={isActive ? '#fff' : PALETTE.textMutedDark} />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>{formData.category === 'Darat' ? 'No. Pendaftaran' : 'No. Pendaftaran / Nama Bot (pilihan)'}</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              value={formData.reg}
              onChangeText={(t) => setFormData({ ...formData, reg: t })}
              placeholder={formData.category === 'Darat' ? 'Cth: WAA 1234' : 'Cth: PLB 007 / Serigala Laut'}
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, formData.status === status ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setFormData({ ...formData, status, nota_selenggara: status !== 'Selenggara' ? '' : formData.nota_selenggara })}
                >
                  <Text style={[styles.chipText, formData.status === status && styles.chipTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.status === 'Selenggara' && (
              <>
                <Text style={styles.inputLabel}>Catatan Penyelenggaraan</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={formData.nota_selenggara}
                  onChangeText={(t) => setFormData({ ...formData, nota_selenggara: t })}
                  multiline
                  placeholder="Nyatakan kerosakan atau butiran..."
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan Rekod'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}