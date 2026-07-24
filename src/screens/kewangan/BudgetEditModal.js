import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { X, Check, Plus, Trash2, FolderOpen } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';

export default function BudgetEditModal({ visible, isNew, kategori, setKategori, rows, setRows, existingCategories, onSave, onClose, error, isSaving }) {
  const [creatingNew, setCreatingNew] = useState(existingCategories.length === 0);

  const selectExisting = (cat) => {
    setCreatingNew(false);
    setKategori(cat);
  };

  const startNewCategory = () => {
    setCreatingNew(true);
    setKategori('');
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { perihal: '', agihan: '', belanja: '' }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Bajet Baru' : 'Kemaskini Bajet'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={styles.modalBody}>
            <View style={styles.categoryPickerHeader}>
              <FolderOpen size={14} color={PALETTE.orange} />
              <Text style={styles.categoryPickerLabel}>Kategori (Kod Objek)</Text>
            </View>

            {existingCategories.length > 0 && (
              <View style={styles.categoryChipRow}>
                {existingCategories.map((cat) => {
                  const selected = !creatingNew && kategori === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                      onPress={() => selectExisting(cat)}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.categoryChip, styles.categoryChipNew, creatingNew && styles.categoryChipSelected]}
                  onPress={startNewCategory}
                >
                  <Plus size={12} color={creatingNew ? PALETTE.orange : PALETTE.textMutedDark} />
                  <Text style={[styles.categoryChipText, creatingNew && styles.categoryChipTextSelected]}>Kategori Baru</Text>
                </TouchableOpacity>
              </View>
            )}

            {creatingNew && (
              <TextInput
                style={styles.modalInput}
                value={kategori}
                onChangeText={setKategori}
                placeholder="Cth: 27000"
                placeholderTextColor={PALETTE.textMutedDark}
                autoFocus={existingCategories.length > 0}
              />
            )}

            <Text style={[styles.inputLabel, { marginTop: 18 }]}>Perkara</Text>

            {rows.map((row, index) => {
              const agihanNum = parseFloat(row.agihan) || 0;
              const belanjaNum = parseFloat(row.belanja) || 0;
              const baki = agihanNum - belanjaNum;

              return (
                <View key={index} style={styles.multiRowBlock}>
                  <View style={styles.multiRowHeader}>
                    <Text style={styles.multiRowIndex}>Perkara {index + 1}</Text>
                    {rows.length > 1 && (
                      <TouchableOpacity style={styles.multiRowDeleteBtn} onPress={() => removeRow(index)}>
                        <Trash2 size={13} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    style={[styles.modalInput, { marginBottom: 10 }]}
                    value={row.perihal}
                    onChangeText={(t) => updateRow(index, 'perihal', t)}
                    placeholder="Perihal — Cth: E. Kasut"
                    placeholderTextColor={PALETTE.textMutedDark}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Agihan (RM)</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={row.agihan}
                        onChangeText={(t) => updateRow(index, 'agihan', t)}
                        placeholder="20000.00"
                        keyboardType="numeric"
                        placeholderTextColor={PALETTE.textMutedDark}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Belanja (RM)</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={row.belanja}
                        onChangeText={(t) => updateRow(index, 'belanja', t)}
                        placeholder="150.00"
                        keyboardType="numeric"
                        placeholderTextColor={PALETTE.textMutedDark}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Baki (RM)</Text>
                      <View style={[styles.modalInput, { justifyContent: 'center' }]}>
                        <Text style={{ color: PALETTE.textMutedDark, fontSize: 14 }}>{baki.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {isNew && (
              <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
                <Plus size={14} color={PALETTE.orange} />
                <Text style={styles.addRowBtnText}>Tambah Perkara Lain</Text>
              </TouchableOpacity>
            )}

            {!!error && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 10, marginBottom: 12 }}>{error}</Text>}
            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, isSaving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Simpan</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}