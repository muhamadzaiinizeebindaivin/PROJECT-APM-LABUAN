// src/screens/latihan/LatihanFormModal.js
import React, { useState, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { X, CalendarDays } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { SASARAN_OPTIONS, statusMeta } from './latihanConstants';
import { appStyles as shared } from '../../styles/appStyles';
import { latihanStyles as styles } from './latihanStyles';

// Safe Require for Native Only
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker');
    if (DateTimePicker && DateTimePicker.default) DateTimePicker = DateTimePicker.default;
  } catch (e) {
    console.log('DateTimePicker loading skipped on Web');
  }
}

const webDateInputStyle = {
  padding: '12px', borderRadius: '10px', border: '1px solid ' + PALETTE.cardLightBorder,
  width: '100%', boxSizing: 'border-box', fontSize: '14px', outline: 'none', cursor: 'pointer',
  backgroundColor: '#fafafa', color: PALETTE.textDark,
};

const STATUS_OPTIONS = ['Berjaya', 'Akan Diadakan', 'Tidak Berjaya'];

export default function LatihanFormModal({ visible, onClose, editingId, formData, setFormData, onSave, error }) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const selectFormStatus = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const toggleSasaran = (option) => {
    setFormData(prev => ({
      ...prev,
      sasaran: prev.sasaran.includes(option) ? prev.sasaran.filter(item => item !== option) : [...prev.sasaran, option],
    }));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={shared.modalOverlay}>
        <View style={shared.modalContainer}>
          <View style={shared.modalHeader}>
            <Text style={shared.modalTitle}>{editingId ? 'Kemaskini Latihan' : 'Tambah Latihan Baru'}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={shared.inputLabel}>Tajuk Latihan</Text>
            <TextInput style={shared.input} placeholder="Cth: Kursus Asas Pertahanan Awam" placeholderTextColor={PALETTE.textMutedDark} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} />

            <View style={shared.row}>
              <View style={shared.halfCol}>
                <Text style={shared.inputLabel}>Tarikh Mula</Text>
                {Platform.OS === 'web' ? (
                  createElement('input', {
                    type: 'date', value: formData.start_date ? formData.start_date.toISOString().split('T')[0] : '',
                    onChange: (e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value) : null }),
                    style: webDateInputStyle,
                  })
                ) : (
                  <View>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                      <CalendarDays size={16} color={PALETTE.textMutedDark} />
                      <Text style={styles.dateBtnText}>{formData.start_date ? formData.start_date.toLocaleDateString('ms-MY') : 'Pilih tarikh'}</Text>
                    </TouchableOpacity>
                    {showStartPicker && DateTimePicker ? (
                      <DateTimePicker value={formData.start_date || new Date()} mode="date" display="default" onChange={(event, date) => { setShowStartPicker(false); if (date) setFormData({ ...formData, start_date: date, end_date: (formData.end_date && date < formData.end_date) ? formData.end_date : date }); }} />
                    ) : null}
                  </View>
                )}
              </View>

              <View style={shared.halfCol}>
                <Text style={shared.inputLabel}>Tarikh Tamat</Text>
                {Platform.OS === 'web' ? (
                  createElement('input', {
                    type: 'date', min: formData.start_date ? formData.start_date.toISOString().split('T')[0] : undefined, value: formData.end_date ? formData.end_date.toISOString().split('T')[0] : '',
                    onChange: (e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : null }),
                    style: webDateInputStyle,
                  })
                ) : (
                  <View>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                      <CalendarDays size={16} color={PALETTE.textMutedDark} />
                      <Text style={styles.dateBtnText}>{formData.end_date ? formData.end_date.toLocaleDateString('ms-MY') : 'Pilih tarikh'}</Text>
                    </TouchableOpacity>
                    {showEndPicker && DateTimePicker ? (
                      <DateTimePicker value={formData.end_date || formData.start_date || new Date()} mode="date" display="default" minimumDate={formData.start_date || undefined} onChange={(event, date) => { setShowEndPicker(false); if (date) setFormData({ ...formData, end_date: date }); }} />
                    ) : null}
                  </View>
                )}
              </View>
            </View>

            <Text style={shared.inputLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {STATUS_OPTIONS.map((status) => {
                const meta = statusMeta(status);
                const isSelected = formData.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => selectFormStatus(status)}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      paddingVertical: 12, borderRadius: 10,
                      borderWidth: 1.5, borderColor: isSelected ? meta.color : PALETTE.cardLightBorder,
                      backgroundColor: isSelected ? meta.soft : '#fafafa',
                    }}
                  >
                    <meta.Icon size={14} color={isSelected ? meta.color : PALETTE.textMutedDark} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? meta.color : PALETTE.textMutedDark }}>{status}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={shared.inputLabel}>Jumlah Peserta (Pax)</Text>
            <TextInput style={shared.input} placeholder="Cth: 50" placeholderTextColor={PALETTE.textMutedDark} keyboardType="numeric" value={formData.pax} onChangeText={(text) => setFormData({ ...formData, pax: text })} />

            <Text style={shared.inputLabel}>Kumpulan Sasaran (Boleh pilih lebih dari satu)</Text>
            <View style={shared.categoryWrap}>
              {SASARAN_OPTIONS.map((option) => {
                const isSelected = formData.sasaran.includes(option);
                return (
                  <TouchableOpacity key={option} style={[shared.categoryBtn, isSelected ? shared.categoryBtnActive : null]} onPress={() => toggleSasaran(option)}>
                    <Text style={[shared.categoryBtnText, isSelected ? shared.categoryBtnTextActive : null]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!error && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginBottom: 12 }}>{error}</Text>}
            <TouchableOpacity style={shared.saveButton} onPress={onSave}>
              <Text style={shared.saveButtonText}>Simpan Latihan</Text>
            </TouchableOpacity>
            <View style={{ height: 10 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}