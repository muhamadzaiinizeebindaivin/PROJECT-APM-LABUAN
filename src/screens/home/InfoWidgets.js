import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MapPin, Phone, Mail, Building2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

const WIDGETS = [
  { key: 'addressPejabat', label: 'ALAMAT PEJABAT APM LABUAN', accent: PALETTE.orange, accentSoft: 'rgba(249, 115, 22, 0.10)' },
  { key: 'addressPkod', label: 'ALAMAT PUSAT KAWALAN OPERASI DAERAH (PKOD)', accent: PALETTE.blue, accentSoft: 'rgba(29, 78, 216, 0.08)' },
];

function FieldRow({ Icon, label, value, isEditing, onChangeText, multiline, placeholder, accent }) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.fieldIcon, { backgroundColor: `${accent}1A` }]}>
        <Icon size={11} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
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
          <Text style={styles.fieldValue}>{value || '—'}</Text>
        )}
      </View>
    </View>
  );
}

export default function InfoWidgets({ isEditing, pageData, updateField }) {
  return (
    <View style={styles.column}>
      {WIDGETS.map(({ key, label, accent, accentSoft }) => {
        const data = pageData[key] || {};
        const update = (field, text) => updateField(key, { ...data, [field]: text });

        return (
          <View key={key} style={styles.widget}>
            <MapPin size={100} color={accent} style={styles.watermark} />

            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentSoft }]}>
                <MapPin size={14} color={accent} />
              </View>
              <Text style={[styles.label, { color: accent }]}>{label}</Text>
            </View>

            <View style={styles.body}>
              <FieldRow
                Icon={Building2}
                label="Nama Organisasi"
                value={data.orgName}
                isEditing={isEditing}
                onChangeText={(text) => update('orgName', text)}
                multiline
                placeholder="Nama organisasi / jabatan"
                accent={accent}
              />
              <FieldRow
                Icon={MapPin}
                label="Alamat"
                value={data.address}
                isEditing={isEditing}
                onChangeText={(text) => update('address', text)}
                multiline
                placeholder="Alamat penuh"
                accent={accent}
              />
              <FieldRow
                Icon={Phone}
                label="No. Telefon"
                value={data.phone}
                isEditing={isEditing}
                onChangeText={(text) => update('phone', text)}
                placeholder="cth. 087-425155"
                accent={accent}
              />
              <FieldRow
                Icon={Mail}
                label="E-mel"
                value={data.email}
                isEditing={isEditing}
                onChangeText={(text) => update('email', text)}
                placeholder="cth. nama@civildefence.gov.my"
                accent={accent}
              />
              {(isEditing || !!data.note) && (
                <FieldRow
                  Icon={MapPin}
                  label="Catatan"
                  value={data.note}
                  isEditing={isEditing}
                  onChangeText={(text) => update('note', text)}
                  placeholder="cth. Operasi 24/7 (pilihan)"
                  accent={accent}
                />
              )}
            </View>
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
  watermark: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    opacity: 0.06,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
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

  body: { gap: 8 },
  fieldRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  fieldIcon: {
    width: 20, height: 20, borderRadius: 6, marginTop: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textMutedDark,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 12,
    color: PALETTE.textDark,
    lineHeight: 15.5,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
    borderRadius: 8,
    padding: 9,
    backgroundColor: '#fafafa',
    color: PALETTE.textDark,
    fontSize: 13,
  },
  inputMultiline: { minHeight: 50, textAlignVertical: 'top' },
});