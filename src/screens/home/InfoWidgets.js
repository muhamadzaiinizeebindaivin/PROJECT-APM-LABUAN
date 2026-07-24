import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Phone, Mail, Building2, Save } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

const WIDGETS = [
  { key: 'addressPejabat', label: 'ALAMAT PEJABAT APM LABUAN', accent: PALETTE.orange, accentSoft: 'rgba(249, 115, 22, 0.10)' },
  { key: 'addressPkod', label: 'ALAMAT PUSAT KAWALAN OPERASI DAERAH (PKOD)', accent: PALETTE.blue, accentSoft: 'rgba(29, 78, 216, 0.08)' },
];

// Force l'affichage permanent de la scrollbar sur web (au lieu de n'apparaître
// qu'au survol), pour signaler clairement que le contenu est scrollable.
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('info-widgets-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'info-widgets-scrollbar-css';
  style.textContent = `
    .info-widgets-grid-scroll::-webkit-scrollbar { width: 6px; }
    .info-widgets-grid-scroll::-webkit-scrollbar-track { background: transparent; }
    .info-widgets-grid-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
    .info-widgets-grid-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
  `;
  document.head.appendChild(style);
}

function FieldBox({ Icon, label, value, isEditing, onChangeText, multiline, placeholder, accent, wide }) {
  return (
    <View style={[styles.fieldBox, wide && styles.fieldBoxWide]}>
      <View style={styles.fieldBoxHeader}>
        <View style={[styles.fieldIcon, { backgroundColor: `${accent}1A` }]}>
          <Icon size={11} color={accent} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={PALETTE.textMutedDark}
        />
      ) : (
        <Text style={styles.fieldValue} numberOfLines={multiline ? 4 : 2}>{value || '—'}</Text>
      )}
    </View>
  );
}

export default function InfoWidgets({ isEditing, pageData, updateField, onSave, saving, savingSection }) {
  const [formErrors, setFormErrors] = useState({});

  return (
    <View style={styles.column}>
      {WIDGETS.map(({ key, label, accent, accentSoft }) => {
        const data = pageData[key] || {};
        const update = (field, text) => updateField(key, { ...data, [field]: text });

        const isSavingThis = savingSection === key;

        const handleSave = async () => {
          if (!data.orgName?.trim() || !data.address?.trim() || !data.phone?.trim() || !data.email?.trim()) {
            setFormErrors((prev) => ({ ...prev, [key]: 'Semua medan (kecuali catatan) mesti diisi.' }));
            return;
          }
          setFormErrors((prev) => ({ ...prev, [key]: null }));
          await onSave(key);
        };

        return (
          <View key={key} style={styles.widget}>
            <MapPin size={100} color={accent} style={styles.watermark} />

            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentSoft }]}>
                <MapPin size={14} color={accent} />
              </View>
              <Text style={[styles.label, { color: accent }]}>{label}</Text>
            </View>

            <ScrollView
              style={styles.gridScroll}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={true}
              {...(Platform.OS === 'web' ? { className: 'info-widgets-grid-scroll' } : {})}
            >
              <FieldBox
                Icon={Building2}
                label="Nama Organisasi"
                value={data.orgName}
                isEditing={isEditing}
                onChangeText={(text) => update('orgName', text)}
                multiline
                wide
                placeholder="Nama organisasi / jabatan"
                accent={accent}
              />
              <FieldBox
                Icon={MapPin}
                label="Alamat"
                value={data.address}
                isEditing={isEditing}
                onChangeText={(text) => update('address', text)}
                multiline
                wide
                placeholder="Alamat penuh"
                accent={accent}
              />
              <FieldBox
                Icon={Phone}
                label="No. Telefon"
                value={data.phone}
                isEditing={isEditing}
                onChangeText={(text) => update('phone', text)}
                placeholder="cth. 087-425155"
                accent={accent}
              />
              <FieldBox
                Icon={Mail}
                label="E-mel"
                value={data.email}
                isEditing={isEditing}
                onChangeText={(text) => update('email', text)}
                placeholder="cth. nama@civildefence.gov.my"
                accent={accent}
              />
              {(isEditing || !!data.note) && (
                <FieldBox
                  Icon={MapPin}
                  label="Catatan"
                  value={data.note}
                  isEditing={isEditing}
                  onChangeText={(text) => update('note', text)}
                  wide
                  placeholder="cth. Operasi 24/7 (pilihan)"
                  accent={accent}
                />
              )}
            </ScrollView>

            {isEditing && (
              <>
                {!!formErrors[key] && <Text style={styles.formError}>{formErrors[key]}</Text>}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accent }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {isSavingThis ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Save size={14} color="#fff" />
                      <Text style={styles.saveBtnText}>Simpan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column', gap: 14, flex: 1 },
  widget: {
    flex: 1,
    padding: 22,
    paddingLeft: 24,
    borderRadius: 20,
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#c9825a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  gridScroll: { flex: 1, ...(Platform.OS === 'web' ? { overflowY: 'scroll' } : {}) },
  watermark: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    opacity: 0.06,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBadge: {
    width: 30, height: 30, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    flexShrink: 1,
    textTransform: 'uppercase',
    lineHeight: 14,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4, paddingRight: 10 },
  fieldBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: PALETTE.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
  },
  fieldBoxWide: { flexBasis: '100%' },

  fieldBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fieldIcon: {
    width: 18, height: 18, borderRadius: 5,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textMutedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 12,
    color: PALETTE.textDark,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    borderRadius: 6,
    padding: 6,
    backgroundColor: '#fafafa',
    color: PALETTE.textDark,
    fontSize: 12,
  },
  inputMultiline: { minHeight: 40, textAlignVertical: 'top' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 9, borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  formError: { fontSize: 11, color: '#dc2626', textAlign: 'center', marginTop: 10 },
});