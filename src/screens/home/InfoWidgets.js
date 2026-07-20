import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Eye, Target } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

const WIDGETS = [
  { key: 'visiText', label: 'PERANAN UTAMA', Icon: Eye },
  { key: 'misiText', label: 'KEMANUSIAAN', Icon: Target },
];

export default function InfoWidgets({ isEditing, pageData, updateField }) {
  return (
    <View style={styles.column}>
      {WIDGETS.map(({ key, label, Icon }) => (
        <View key={key} style={styles.widget}>
          <Icon size={18} color={PALETTE.orange} />
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={pageData[key]}
              onChangeText={(text) => updateField(key, text)}
              multiline
            />
          ) : (
            <Text style={styles.body}>{pageData[key]}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column', gap: 14, flex: 1, height: '100%' },
  widget: {
    flex: 1,
    padding: 18,
    borderRadius: 18,
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
  },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6, marginTop: 10, marginBottom: 6, color: PALETTE.textDark },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 21, color: PALETTE.textMutedDark },
  input: {
    borderWidth: 1.5,
    borderColor: PALETTE.cardLightBorder,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fafafa',
    color: PALETTE.textDark,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    outlineStyle: 'none',
    outlineWidth: 0,
  },
});