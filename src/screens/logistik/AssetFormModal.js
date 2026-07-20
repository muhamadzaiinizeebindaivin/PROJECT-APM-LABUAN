import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { logistikStyles as styles } from './logistikStyles';

const ICON_OPTIONS = [
  { key: 'car', label: 'Kereta' },
  { key: 'lori', label: 'Lori' },
  { key: 'motor', label: 'Motosikal' },
  { key: 'ambulans', label: 'Ambulans' },
  { key: 'boat', label: 'Bot' },
];
const STATUS_OPTIONS = ['Baik', 'Selenggara', 'Rosak'];
const DEFAULT_FORM = { category: 'Darat', type: 'Lori', model: '', reg: '', qty: '1', status: 'Baik', nota_selenggara: '', icon_key: 'lori' };

export default function AssetFormModal({ visible, onClose, editingAsset, onSave }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingAsset) {
      setFormData({
        category: editingAsset.category,
        type: editingAsset.type,
        model: editingAsset.model,
        reg: editingAsset.reg || '',
        qty: editingAsset.qty !== null ? editingAsset.qty.toString() : '1',
        status: editingAsset.status,
        nota_selenggara: editingAsset.nota_selenggara || '',
        icon_key: editingAsset.icon_key || 'car',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [visible, editingAsset]);

  const handleSave = async () => {
    if (!formData.model) return Alert.alert('Ralat', 'Sila masukkan model aset.');
    if (formData.status === 'Selenggara' && !formData.nota_selenggara.trim()) {
      return Alert.alert('Ralat', 'Sila masukkan catatan penyelenggaraan.');
    }

    setIsSaving(true);
    const payload = {
      category: formData.category,
      type: formData.type,
      model: formData.model,
      status: formData.status,
      nota_selenggara: formData.status === 'Selenggara' ? formData.nota_selenggara : null,
      icon_key: formData.icon_key,
    };
    if (formData.category === 'Darat') {
      payload.reg = formData.reg.toUpperCase();
      payload.qty = null;
    } else {
      payload.qty = Number(formData.qty);
      payload.reg = null;
    }

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
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['Darat', 'Laut'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  disabled={!!editingAsset}
                  style={[styles.chip, formData.category === cat ? styles.chipActive : styles.chipInactive, !!editingAsset && formData.category !== cat && { opacity: 0.5 }]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text style={[styles.chipText, formData.category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Jenis (Cth: Lori, Bot, dll)</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              value={formData.type}
              onChangeText={(t) => setFormData({ ...formData, type: t })}
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Model</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: 16 }]}
              value={formData.model}
              onChangeText={(t) => setFormData({ ...formData, model: t })}
              placeholder="Cth: Toyota Hilux"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Ikon Peta</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {ICON_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, formData.icon_key === opt.key ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setFormData({ ...formData, icon_key: opt.key })}
                >
                  <Text style={[styles.chipText, formData.icon_key === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.category === 'Darat' ? (
              <>
                <Text style={styles.inputLabel}>No. Pendaftaran</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={formData.reg}
                  onChangeText={(t) => setFormData({ ...formData, reg: t })}
                  placeholder="Cth: WAA 1234"
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Kuantiti</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={formData.qty}
                  onChangeText={(t) => setFormData({ ...formData, qty: t })}
                  keyboardType="numeric"
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </>
            )}

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