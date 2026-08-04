import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Check, ChevronDown } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { CERT_CATEGORIES, CERT_NAME_OPTIONS } from './certificateCategories';

export default function CertEditModal({ visible, isNew, certForm, setCertForm, onSave, onClose }) {
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const nameOptions = CERT_NAME_OPTIONS[certForm.kategori] || [];
  const useNameDropdown = nameOptions.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah' : 'Kemaskini'} Sijil</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>Kategori</Text>
            <View style={styles.pickerRow}>
              {CERT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerChip, certForm.kategori === cat && styles.pickerChipActive]}
                  onPress={() => { setCertForm({ ...certForm, kategori: cat, nom_certificat: '' }); setNameDropdownOpen(false); }}
                >
                  <Text style={[styles.pickerChipText, certForm.kategori === cat && styles.pickerChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Nama Sijil</Text>
            {useNameDropdown ? (
              <View>
                <View style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center' }]}>
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: PALETTE.textDark, outlineStyle: 'none' }}
                    value={certForm.nom_certificat}
                    onChangeText={(t) => setCertForm({ ...certForm, nom_certificat: t })}
                    onFocus={() => setNameDropdownOpen(true)}
                    placeholder="Taip untuk cari atau pilih..."
                    placeholderTextColor={PALETTE.textMutedDark}
                  />
                  {!!certForm.nom_certificat && (
                    <TouchableOpacity onPress={() => setCertForm({ ...certForm, nom_certificat: '' })} style={{ paddingHorizontal: 6 }}>
                      <X size={15} color={PALETTE.textMutedDark} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setNameDropdownOpen((v) => !v)}>
                    <ChevronDown size={16} color={PALETTE.textMutedDark} style={{ transform: [{ rotate: nameDropdownOpen ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                </View>
                {nameDropdownOpen && !certForm.nom_certificat.toLowerCase().startsWith('lain-lain') && (() => {
                  const filtered = nameOptions.filter((opt) => opt.toLowerCase().includes((certForm.nom_certificat || '').toLowerCase()));
                  return (
                    <View style={{ borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, marginTop: 6, maxHeight: 220, overflow: 'hidden' }}>
                      <ScrollView nestedScrollEnabled>
                        {filtered.length > 0 && (
                          filtered.map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: certForm.nom_certificat === opt ? PALETTE.orangeSoft : '#fff' }}
                              onPress={() => { setCertForm({ ...certForm, nom_certificat: opt }); setNameDropdownOpen(false); }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '600', color: certForm.nom_certificat === opt ? PALETTE.orange : PALETTE.textDark }}>{opt}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                        <TouchableOpacity
                          style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' }}
                          onPress={() => { setCertForm({ ...certForm, nom_certificat: 'Lain-lain : ' }); setNameDropdownOpen(false); }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.textDark }}>Lain-lain</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={certForm.nom_certificat}
                onChangeText={(t) => setCertForm({ ...certForm, nom_certificat: t })}
                placeholder="Cth: Sijil Pertolongan Cemas"
                placeholderTextColor={PALETTE.textMutedDark}
              />
            )}

            <Text style={styles.inputLabel}>Pautan Google Drive</Text>
            <TextInput
              style={styles.modalInput}
              value={certForm.google_drive_link}
              onChangeText={(t) => setCertForm({ ...certForm, google_drive_link: t })}
              placeholder="https://drive.google.com/..."
              placeholderTextColor={PALETTE.textMutedDark}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}