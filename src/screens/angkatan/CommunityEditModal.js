import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, AlertCircle, Users } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { SCHOOL_CATEGORIES, CDA_CATEGORIES } from '../../hooks/useAngkatanCommunity';

const CATEGORIES = ['TUSPA', 'KASPA', 'PISPA', 'SISPA', 'CDA'];
const CDA_CODE_LABELS = {
  CDA01: 'CDA-ARD',
  CDA02: 'CDA-LOGS',
  CDA03: 'CDA-TRAINING',
  CDA04: 'CDA-SHELT',
  CDA05: 'CDA-GMECS',
  CDA06: 'CDA-MED',
  CDA07: 'CDA-PSS',
  CDA08: 'CDA-ERT (CDERT)',
  CDA09: 'CDA-COMM',
  CDA10: 'CDA-HUMSERV',
  CDA11: 'CDA-RESQ',
  CDA12: 'CDA-NATSC',
};
const CDA_CODE_OPTIONS = Array.from({ length: 12 }, (_, i) => `CDA${String(i + 1).padStart(2, '0')}`);
const CATEGORY_COLORS = {
  TUSPA: '#3b82f6',
  KASPA: '#22c55e',
  PISPA: '#8b5cf6',
  SISPA: '#ef4444',
  CDA: '#14b8a6',
};

export default function CommunityEditModal({ visible, isNew, communityForm, setCommunityForm, onSave, onClose, error, isSaving }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTempohPicker, setShowTempohPicker] = useState(false);
  const [showBerdaftarPicker, setShowBerdaftarPicker] = useState(false);
  const isSchool = SCHOOL_CATEGORIES.includes(communityForm.category);
  const isCda = CDA_CATEGORIES.includes(communityForm.category);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah Program Komuniti' : 'Kemaskini Program Komuniti'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const catColor = CATEGORY_COLORS[cat];
                const isActive = communityForm.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
                      isActive
                        ? { backgroundColor: catColor, borderColor: catColor }
                        : { backgroundColor: PALETTE.surface, borderColor: PALETTE.cardLightBorder },
                    ]}
                    onPress={() => setCommunityForm({ ...communityForm, category: cat })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isActive ? '#fff' : PALETTE.textMutedDark }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isSchool ? (
              <>
                <Text style={styles.inputLabel}>Nama Sekolah</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.nama_sekolah || ''}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, nama_sekolah: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Nombor Pendaftaran</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.no_pendaftaran || ''}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, no_pendaftaran: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Tarikh Penubuhan</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: communityForm.tarikh_penubuhan || '',
                    onChange: (e) => setCommunityForm({ ...communityForm, tarikh_penubuhan: e.target.value }),
                    style: {
                      borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
                      fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
                      border: `1px solid ${PALETTE.cardLightBorder}`, width: '100%', boxSizing: 'border-box',
                      marginBottom: 16,
                    },
                  })
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.modalInput, { marginBottom: 16 }]}>
                      <Text style={{ color: communityForm.tarikh_penubuhan ? PALETTE.textDark : PALETTE.textMutedDark }}>
                        {communityForm.tarikh_penubuhan || 'Pilih tarikh'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={communityForm.tarikh_penubuhan ? new Date(communityForm.tarikh_penubuhan) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) setCommunityForm({ ...communityForm, tarikh_penubuhan: selectedDate.toISOString().split('T')[0] });
                        }}
                      />
                    )}
                  </>
                )}

                {[
                  { gender: 'lelaki', label: 'Lelaki', tint: '#eff6ff', border: '#bfdbfe', accent: '#2563eb' },
                  { gender: 'perempuan', label: 'Perempuan', tint: '#fdf2f8', border: '#fbcfe8', accent: '#db2777' },
                ].map(({ gender, label, tint, border, accent }) => {
                  const total = ['melayu', 'cina', 'india', 'lain'].reduce(
                    (sum, k) => sum + (parseInt(communityForm[`${gender}_${k}`], 10) || 0), 0
                  );
                  return (
                    <View
                      key={gender}
                      style={{
                        backgroundColor: tint, borderWidth: 1.5, borderColor: border,
                        borderRadius: 14, padding: 14, marginBottom: 16,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Users size={15} color={accent} />
                          <Text style={{ fontSize: 14, fontWeight: '800', color: accent }}>{label}</Text>
                        </View>
                        <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: border }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: accent }}>Jumlah: {total}</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {[['melayu', 'Melayu'], ['cina', 'Cina'], ['india', 'India'], ['lain', 'Lain-lain']].map(([key, raceLabel]) => (
                          <View key={key} style={{ width: '47%' }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.textMutedDark, marginBottom: 4 }}>{raceLabel}</Text>
                            <TextInput
                              style={{
                                borderWidth: 1, borderColor: border, borderRadius: 10,
                                paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600',
                                backgroundColor: '#fff', color: PALETTE.textDark,
                              }}
                              value={String(communityForm[`${gender}_${key}`] ?? '')}
                              onChangeText={(t) => setCommunityForm({ ...communityForm, [`${gender}_${key}`]: t.replace(/[^0-9]/g, '') })}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={PALETTE.textMutedDark}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                <Text style={styles.inputLabel}>Keterangan (Tidak Wajib)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
                  value={communityForm.detail}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, detail: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                  multiline
                />
              </>
            ) : isCda ? (
              <>
                <Text style={styles.inputLabel}>Kod CDA</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('select', {
                    value: communityForm.kod_cda || '',
                    onChange: (e) => setCommunityForm({ ...communityForm, kod_cda: e.target.value }),
                    style: {
                      borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
                      fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
                      border: `1px solid ${PALETTE.cardLightBorder}`, width: '100%', boxSizing: 'border-box',
                      marginBottom: 16,
                    },
                  },
                    React.createElement('option', { value: '' }, 'Pilih kod CDA'),
                    ...CDA_CODE_OPTIONS.map((code) => React.createElement('option', { key: code, value: code }, CDA_CODE_LABELS[code] ? `${code} - ${CDA_CODE_LABELS[code]}` : code))
                  )
                ) : (
                  <View style={[styles.pickerRow, { marginBottom: 16 }]}>
                    {CDA_CODE_OPTIONS.map((code) => (
                      <TouchableOpacity
                        key={code}
                        onPress={() => setCommunityForm({ ...communityForm, kod_cda: code })}
                        style={[styles.pickerChip, communityForm.kod_cda === code && styles.pickerChipActive]}
                      >
                        <Text style={[styles.pickerChipText, communityForm.kod_cda === code && styles.pickerChipTextActive]}>
                          {CDA_CODE_LABELS[code] ? `${code} - ${CDA_CODE_LABELS[code]}` : code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.inputLabel}>Nombor Pendaftaran</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.no_pendaftaran || ''}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, no_pendaftaran: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Nama Pasukan</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.nama_pasukan || ''}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, nama_pasukan: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Nama Organisasi (Tidak Wajib)</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.nama_organisasi || ''}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, nama_organisasi: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Tempoh Sah Penubuhan</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: communityForm.tempoh_sah_penubuhan || '',
                    onChange: (e) => setCommunityForm({ ...communityForm, tempoh_sah_penubuhan: e.target.value }),
                    style: {
                      borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
                      fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
                      border: `1px solid ${PALETTE.cardLightBorder}`, width: '100%', boxSizing: 'border-box',
                      marginBottom: 16,
                    },
                  })
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setShowTempohPicker(true)} style={[styles.modalInput, { marginBottom: 16 }]}>
                      <Text style={{ color: communityForm.tempoh_sah_penubuhan ? PALETTE.textDark : PALETTE.textMutedDark }}>
                        {communityForm.tempoh_sah_penubuhan || 'Pilih tarikh'}
                      </Text>
                    </TouchableOpacity>
                    {showTempohPicker && (
                      <DateTimePicker
                        value={communityForm.tempoh_sah_penubuhan ? new Date(communityForm.tempoh_sah_penubuhan) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowTempohPicker(false);
                          if (selectedDate) setCommunityForm({ ...communityForm, tempoh_sah_penubuhan: selectedDate.toISOString().split('T')[0] });
                        }}
                      />
                    )}
                  </>
                )}

                <Text style={styles.inputLabel}>Tarikh Berdaftar</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: communityForm.tarikh_berdaftar || '',
                    onChange: (e) => setCommunityForm({ ...communityForm, tarikh_berdaftar: e.target.value }),
                    style: {
                      borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
                      fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
                      border: `1px solid ${PALETTE.cardLightBorder}`, width: '100%', boxSizing: 'border-box',
                      marginBottom: 16,
                    },
                  })
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setShowBerdaftarPicker(true)} style={[styles.modalInput, { marginBottom: 16 }]}>
                      <Text style={{ color: communityForm.tarikh_berdaftar ? PALETTE.textDark : PALETTE.textMutedDark }}>
                        {communityForm.tarikh_berdaftar || 'Pilih tarikh'}
                      </Text>
                    </TouchableOpacity>
                    {showBerdaftarPicker && (
                      <DateTimePicker
                        value={communityForm.tarikh_berdaftar ? new Date(communityForm.tarikh_berdaftar) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowBerdaftarPicker(false);
                          if (selectedDate) setCommunityForm({ ...communityForm, tarikh_berdaftar: selectedDate.toISOString().split('T')[0] });
                        }}
                      />
                    )}
                  </>
                )}

                <Text style={styles.inputLabel}>Keterangan (Tidak Wajib)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
                  value={communityForm.detail}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, detail: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                  multiline
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Tempat</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 16 }]}
                  value={communityForm.tempat}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, tempat: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                />

                <Text style={styles.inputLabel}>Keterangan</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
                  value={communityForm.detail}
                  onChangeText={(t) => setCommunityForm({ ...communityForm, detail: t })}
                  placeholderTextColor={PALETTE.textMutedDark}
                  multiline
                />
              </>
            )}

            {error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <AlertCircle size={16} color="#dc2626" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626', flex: 1 }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, isSaving && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={isSaving}
            >
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}