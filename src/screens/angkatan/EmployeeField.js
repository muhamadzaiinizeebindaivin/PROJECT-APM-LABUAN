import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';
import { formatICNumber, computeDaysRemaining, formatDateMY } from './employeeFieldGroups';

export default function EmployeeField({ field: f, form, setForm, isEditing, activeDatePickerField, setActiveDatePickerField }) {
  const value = form[f.key];

  // Toujours calculé, jamais éditable — même en mode édition
  if (f.type === 'computed_days') {
    const days = computeDaysRemaining(form[f.fromDateKey]);
    const displayValue = days === null ? '-' : `${days} hari${days < 0 ? ' (tamat tempoh)' : ''}`;
    return (
      <FieldWrapper label={f.label}>
        <View style={styles.fieldReadOnlyBox}>
          <Text style={[styles.fieldValue, days !== null && days < 0 && { color: '#dc2626', fontWeight: '800' }]}>
            {displayValue}
          </Text>
        </View>
      </FieldWrapper>
    );
  }

  if (!isEditing) {
    if (f.type === 'multiline_list') {
      const trimmed = String(value || '').trim();
      if (trimmed === '') return <FieldWrapper label={f.label}><View style={styles.fieldReadOnlyBox}><Text style={styles.fieldValue}>-</Text></View></FieldWrapper>;
      const lines = String(value).split(/\r?\n|(?<=^|\s)(?=\d{1,2}\)\s)/g).map((l) => l.replace(/^\d{1,2}\)\s*/, '').trim()).filter(Boolean);
      return (
        <FieldWrapper label={f.label}>
          <View style={styles.fieldReadOnlyBox}>
            {lines.map((line, i) => <Text key={i} style={[styles.fieldListItem, i === lines.length - 1 && { marginBottom: 0 }]}>• {line}</Text>)}
          </View>
        </FieldWrapper>
      );
    }
    return (
      <FieldWrapper label={f.label}>
        <View style={styles.fieldReadOnlyBox}>
          <Text style={styles.fieldValue}>
            {f.type === 'boolean' ? (value ? 'Ya' : 'Tidak') : (formatDateMY(value) || '-')}
          </Text>
        </View>
      </FieldWrapper>
    );
  }

  if (f.type === 'multiline_list') {
    return (
      <FieldWrapper label={f.label}>
        <TextInput
          style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
          value={String(value || '')}
          onChangeText={(t) => setForm({ ...form, [f.key]: t })}
          multiline
          placeholder="Satu item setiap baris"
          placeholderTextColor={PALETTE.textMutedDark}
        />
      </FieldWrapper>
    );
  }

  if (f.type === 'date') {
    if (Platform.OS === 'web') {
      return (
        <FieldWrapper label={f.label}>
          {React.createElement('input', {
            type: 'date',
            value: value || '',
            onChange: (e) => setForm({ ...form, [f.key]: e.target.value }),
            style: {
              borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12,
              fontSize: 14, backgroundColor: '#fafafa', color: PALETTE.textDark,
              border: `1px solid ${PALETTE.cardLightBorder}`, width: '100%', boxSizing: 'border-box',
            },
          })}
        </FieldWrapper>
      );
    }
    return (
      <FieldWrapper label={f.label}>
        <TouchableOpacity onPress={() => setActiveDatePickerField(f.key)} style={styles.modalInput}>
          <Text style={{ color: value ? PALETTE.textDark : PALETTE.textMutedDark }}>{value || 'Pilih tarikh'}</Text>
        </TouchableOpacity>
        {activeDatePickerField === f.key && (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setActiveDatePickerField(null);
              if (selectedDate) setForm({ ...form, [f.key]: selectedDate.toISOString().split('T')[0] });
            }}
          />
        )}
      </FieldWrapper>
    );
  }

  if (f.type === 'ic') {
    return (
      <FieldWrapper label={f.label}>
        <TextInput
          style={styles.modalInput}
          value={String(value || '')}
          onChangeText={(t) => setForm({ ...form, [f.key]: formatICNumber(t) })}
          keyboardType="numeric"
          maxLength={14}
        />
      </FieldWrapper>
    );
  }

  if (f.type === 'jantina_picker') {
    return (
      <FieldWrapper label={f.label}>
        <View style={styles.pickerRow}>
          {['Lelaki', 'Perempuan'].map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setForm({ ...form, jantina: opt })}
              style={[styles.pickerChip, value === opt && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerChipText, value === opt && styles.pickerChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldWrapper>
    );
  }

  if (f.type === 'boolean') {
    return (
      <FieldWrapper label={f.label}>
        <View style={styles.pickerRow}>
          {[{ label: 'Tidak', val: false }, { label: 'Ya', val: true }].map((opt) => (
            <TouchableOpacity
              key={opt.label}
              onPress={() => setForm({ ...form, [f.key]: opt.val })}
              style={[
                styles.pickerChip,
                value === opt.val && { backgroundColor: opt.val ? '#dc2626' : PALETTE.orange, borderColor: opt.val ? '#dc2626' : PALETTE.orange },
              ]}
            >
              <Text style={[styles.pickerChipText, value === opt.val && styles.pickerChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper label={f.label}>
      <TextInput
        style={styles.modalInput}
        value={String(value || '')}
        onChangeText={(t) => setForm({ ...form, [f.key]: t })}
      />
    </FieldWrapper>
  );
}

function FieldWrapper({ label, children }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}