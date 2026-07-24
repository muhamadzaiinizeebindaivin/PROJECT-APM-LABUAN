import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Save } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

const DEFAULT_TITLE = 'ANGKATAN PERTAHANAN AWAM MALAYSIA (APM) W.P LABUAN';
const DEFAULT_SUBTITLE = 'Pejabat Pertahanan Awam Daerah Wilayah Persekutuan Labuan.\n"Sedia, Pantas, Berintegriti"';

export default function HeroSection({ isEditing, pageData, updateField, onSave, saving }) {
  const title = pageData?.welcomeTitle ?? DEFAULT_TITLE;
  const subtitle = pageData?.welcomeSubtitle ?? DEFAULT_SUBTITLE;
  const [formError, setFormError] = useState(null);

  const handleSave = async () => {
    if (!title.trim() || !subtitle.trim()) {
      setFormError('Tajuk dan sari kata tidak boleh kosong.');
      return;
    }
    setFormError(null);
    await onSave();
  };

  return (
    <View style={styles.heroCard}>
      <View style={styles.glow} />
      <Text style={styles.kicker}>SEDIAOPS</Text>

      {isEditing ? (
        <>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(text) => updateField('welcomeTitle', text)}
            placeholder="Tajuk utama"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TextInput
            style={styles.subtitleInput}
            value={subtitle}
            onChangeText={(text) => updateField('welcomeSubtitle', text)}
            multiline
            placeholder="Sari kata"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save size={14} color="#fff" />
                <Text style={styles.saveBtnText}>Simpan</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 20,
    marginBottom: 16,
    padding: 28,
    borderRadius: 24,
    backgroundColor: PALETTE.ink,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: PALETTE.orange,
    opacity: 0.25,
    top: -110, right: -80,
  },
  kicker: {
    color: PALETTE.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: PALETTE.white,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 12,
  },
  subtitle: { fontSize: 14, color: PALETTE.mutedLight, lineHeight: 21, fontWeight: '500' },

  titleInput: {
    fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    padding: 10, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  subtitleInput: {
    fontSize: 14, color: '#fff', lineHeight: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    padding: 10, minHeight: 60, textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, backgroundColor: PALETTE.orange, paddingVertical: 10, borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  formError: { fontSize: 12, color: '#fca5a5', textAlign: 'center', marginTop: 12 },
});