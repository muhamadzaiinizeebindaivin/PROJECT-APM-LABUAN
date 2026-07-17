import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

export default function HeroSection({ isEditing, pageData, updateField }) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.glow} />
      {isEditing ? (
        <>
          <TextInput
            style={[styles.input, styles.titleInput]}
            value={pageData.welcomeTitle}
            onChangeText={(text) => updateField('welcomeTitle', text)}
            multiline
          />
          <TextInput
            style={[styles.input, styles.subtitleInput]}
            value={pageData.welcomeSubtitle}
            onChangeText={(text) => updateField('welcomeSubtitle', text)}
            multiline
          />
        </>
      ) : (
        <>
          <Text style={styles.kicker}>SEDIAOPS</Text>
          <Text style={styles.title}>{pageData.welcomeTitle}</Text>
          <Text style={styles.subtitle}>{pageData.welcomeSubtitle}</Text>
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
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.cardLightBorder,
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
    color: PALETTE.textDark,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 12,
  },
  subtitle: { fontSize: 14, color: PALETTE.textMutedDark, lineHeight: 21, fontWeight: '500' },
  input: {
    borderWidth: 1.5,
    borderColor: PALETTE.inkBorder,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: PALETTE.white,
  },
  titleInput: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  subtitleInput: { fontSize: 13 },
});