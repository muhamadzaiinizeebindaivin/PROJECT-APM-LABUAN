import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Save } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { FONTS } from '../../styles/tacticalTheme';

const DEFAULT_TITLE = 'ANGKATAN PERTAHANAN AWAM MALAYSIA (APM) W.P LABUAN';
const DEFAULT_SUBTITLE = 'Pejabat Pertahanan Awam Daerah Wilayah Persekutuan Labuan.\n"Sedia, Pantas, Berintegriti"';

export default function HeroSection({ isEditing, pageData, updateField, onSave, saving, isSavingThis }) {
  const title = pageData?.welcomeTitle ?? DEFAULT_TITLE;
  const subtitle = pageData?.welcomeSubtitle ?? DEFAULT_SUBTITLE;
  const [formError, setFormError] = useState(null);
  const [focusedField, setFocusedField] = useState(null); // 'title' | 'subtitle' | null

  const handleSave = async () => {
    if (!title.trim() || !subtitle.trim()) {
      setFormError('Tajuk dan sari kata tidak boleh kosong.');
      return;
    }
    setFormError(null);
    await onSave('hero');
  };

  return (
    <View style={styles.heroCard}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
      <View style={styles.glow} />
      <Text style={styles.kicker}>SEDIAOPS</Text>

      {isEditing ? (
        <>
          <TextInput
            style={[styles.titleInput, focusedField === 'title' && styles.inputFocused]}
            value={title}
            onChangeText={(text) => updateField('welcomeTitle', text)}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            placeholder="Tajuk utama"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TextInput
            style={[styles.subtitleInput, focusedField === 'subtitle' && styles.inputFocused]}
            value={subtitle}
            onChangeText={(text) => updateField('welcomeSubtitle', text)}
            onFocus={() => setFocusedField('subtitle')}
            onBlur={() => setFocusedField(null)}
            multiline
            placeholder="Sari kata"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
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
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 14, 0.72)',
  },
  glow: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: PALETTE.orange,
    opacity: 0.5,
    top: -110, right: -80,
    ...Platform.select({ web: { filter: 'blur(50px)' }, default: {} }),
  },
  kicker: {
    color: PALETTE.orange,
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: PALETTE.white,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 12,
  },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, color: PALETTE.mutedLight, lineHeight: 21 },

  titleInput: {
    fontFamily: FONTS.displayBold, fontSize: 18, color: '#fff', letterSpacing: -0.3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    padding: 10, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  subtitleInput: {
    fontFamily: FONTS.body, fontSize: 14, color: '#fff', lineHeight: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    padding: 10, minHeight: 60, textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputFocused: {
    borderColor: PALETTE.orange,
    ...Platform.select({ web: { boxShadow: `0 0 0 3px ${PALETTE.orangeGlow}` }, default: {} }),
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, backgroundColor: PALETTE.orange, paddingVertical: 10, borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  saveBtnText: { color: '#fff', fontFamily: FONTS.bodyMedium, fontSize: 13 },
  formError: { fontFamily: FONTS.body, fontSize: 12, color: '#fca5a5', textAlign: 'center', marginTop: 12 },
});