// src/screens/sekretariat/hotspot/KejadianFormModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';
import { webDateInput } from './hotspotConstants';

// Ajout / modification / lecture d'un rekod kejadian
export default function KejadianFormModal({ visible, mode, form, setForm, isEditMode, loading, onSave, onClose }) {
  const [showTarikhPicker, setShowTarikhPicker] = useState(false);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 640 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{mode === 'add' ? 'Tambah Rekod' : (isEditMode ? 'Kemaskini Rekod' : 'Butiran Rekod')}</Text>
            <TouchableOpacity onPress={() => onClose()}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            <Text style={styles.inputLabel}>Tarikh</Text>
            {isEditMode ? (
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={form.tarikh}
                  onChange={(e) => setForm({ ...form, tarikh: e.target.value })}
                  style={webDateInput}
                />
              ) : (
                <>
                  <TouchableOpacity style={hotspotStyles.dateInputBtn} onPress={() => setShowTarikhPicker(true)}>
                    <Calendar size={16} color={PALETTE.textMutedDark} />
                    <Text style={[hotspotStyles.dateInputBtnText, !form.tarikh && { color: PALETTE.textMutedDark }]}>
                      {form.tarikh || 'Pilih tarikh'}
                    </Text>
                  </TouchableOpacity>
                  {showTarikhPicker ? (
                    <DateTimePicker
                      value={form.tarikh ? new Date(form.tarikh) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowTarikhPicker(false);
                        if (event.type === 'set' && selectedDate) {
                          const iso = selectedDate.toISOString().split('T')[0];
                          setForm({ ...form, tarikh: iso });
                        }
                      }}
                    />
                  ) : null}
                </>
              )
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.tarikh}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Kawasan Terjejas</Text>
            {isEditMode ? (
              <TextInput
                style={styles.input}
                placeholder="Cth: Kg Rancha-Rancha"
                value={form.lokasi}
                onChangeText={(t) => setForm({ ...form, lokasi: t })}
              />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.lokasi}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Jumlah KIR</Text>
            {isEditMode ? (
              <TextInput style={styles.input} placeholder="Cth: 12" keyboardType="numeric" value={form.jumlah_kir} onChangeText={(t) => setForm({ ...form, jumlah_kir: t.replace(/[^0-9]/g, '') })} />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.jumlah_kir}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Jumlah Mangsa</Text>
            {isEditMode ? (
              <TextInput style={styles.input} placeholder="Cth: 45" keyboardType="numeric" value={form.jumlah_mangsa} onChangeText={(t) => setForm({ ...form, jumlah_mangsa: t.replace(/[^0-9]/g, '') })} />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.jumlah_mangsa}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Jumlah Rumah Terjejas</Text>
            {isEditMode ? (
              <TextInput style={styles.input} placeholder="Cth: 5" keyboardType="numeric" value={form.jumlah_rumah_terjejas} onChangeText={(t) => setForm({ ...form, jumlah_rumah_terjejas: t.replace(/[^0-9]/g, '') })} />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.jumlah_rumah_terjejas}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>PPS</Text>
            {isEditMode ? (
              <TextInput style={styles.input} placeholder="Cth: Dewan Komuniti Kg X" value={form.pps} onChangeText={(t) => setForm({ ...form, pps: t })} />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.pps}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Catatan</Text>
            {isEditMode ? (
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Catatan tambahan" multiline value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
            ) : (
              <View style={{ backgroundColor: PALETTE.surface || '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, minHeight: 60 }}>
                <Text style={{ fontSize: 14, color: PALETTE.textDark }}>{form.description}</Text>
              </View>
            )}

            {isEditMode && (
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                {loading ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
              </TouchableOpacity>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
