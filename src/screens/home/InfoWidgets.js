import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Phone, Mail, Building2, Save } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { FONTS } from '../../styles/tacticalTheme';

const WIDGETS = [
  { key: 'addressPejabat', label: 'ALAMAT PEJABAT APM LABUAN', accent: PALETTE.orange, accentSoft: 'rgba(249, 115, 22, 0.10)' },
  { key: 'addressPkod', label: 'ALAMAT PUSAT KAWALAN OPERASI DAERAH (PKOD)', accent: PALETTE.blue, accentSoft: 'rgba(29, 78, 216, 0.08)' },
];

function FieldBox({ Icon, label, value, isEditing, onChangeText, multiline, placeholder, accent, wide }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.fieldBox, wide && styles.fieldBoxWide]}>
      <View style={styles.fieldBoxHeader}>
        <View style={[styles.fieldIcon, { backgroundColor: `${accent}1A` }]}>
          <Icon size={15} color={accent} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            focused && [styles.inputFocused, { borderColor: accent }],
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={PALETTE.textMutedDark}
        />
      ) : (
        <Text style={styles.fieldValue} numberOfLines={multiline ? 6 : 3}>{value || '—'}</Text>
      )}
    </View>
  );
}

function WidgetCard({ children, hovered, onHoverIn, onHoverOut }) {
  return (
    <View
      style={[styles.widget, hovered && styles.widgetHovered]}
      {...(Platform.OS === 'web' ? { onMouseEnter: onHoverIn, onMouseLeave: onHoverOut } : {})}
    >
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.widgetTint} />
      {children}
    </View>
  );
}

export default function InfoWidgets({ isEditing, pageData, updateField, onSave, saving, savingSection }) {
  const [formErrors, setFormErrors] = useState({});
  const [hoveredKey, setHoveredKey] = useState(null);

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
          <WidgetCard
            key={key}
            hovered={hoveredKey === key}
            onHoverIn={() => setHoveredKey(key)}
            onHoverOut={() => setHoveredKey(null)}
          >
            <MapPin size={140} color={accent} style={styles.watermark} />

            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentSoft }]}>
                <MapPin size={18} color={accent} />
              </View>
              <Text style={[styles.label, { color: accent }]}>{label}</Text>
            </View>

            <View style={styles.grid}>
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
            </View>

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
                      <Save size={16} color="#fff" />
                      <Text style={styles.saveBtnText}>Simpan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </WidgetCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column', gap: 18 },
  widget: {
    padding: 32,
    paddingLeft: 34,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#c9825a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
    ...Platform.select({ web: { transition: 'transform 200ms ease, box-shadow 200ms ease' }, default: {} }),
  },
  widgetHovered: {
    transform: [{ scale: 1.015 }],
    ...Platform.select({ web: { boxShadow: '0 16px 40px rgba(201, 130, 90, 0.18)' }, default: {} }),
  },
  widgetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  watermark: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    opacity: 0.06,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  iconBadge: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  label: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 0.5,
    flex: 1,
    flexShrink: 1,
    textTransform: 'uppercase',
    lineHeight: 18,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fieldBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  fieldBoxWide: { flexBasis: '100%' },

  fieldBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  fieldIcon: {
    width: 24, height: 24, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: PALETTE.textMutedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: PALETTE.textDark,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
    color: PALETTE.textDark,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 56, textAlignVertical: 'top' },
  inputFocused: {
    ...Platform.select({ web: { boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.18)' }, default: {} }),
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 13, borderRadius: 12,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  saveBtnText: { color: '#fff', fontFamily: FONTS.bodyMedium, fontSize: 14 },
  formError: { fontFamily: FONTS.body, fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 14 },
});