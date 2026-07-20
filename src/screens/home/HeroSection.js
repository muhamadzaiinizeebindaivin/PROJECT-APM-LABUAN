import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE } from '../../constants/palette';

const WELCOME_TITLE = 'ANGKATAN PERTAHANAN AWAM MALAYSIA (APM) W.P LABUAN';
const WELCOME_SUBTITLE = 'Pejabat Pertahanan Awam Daerah Wilayah Persekutuan Labuan.\n"Sedia, Pantas, Berintegriti"';

export default function HeroSection() {
  return (
    <View style={styles.heroCard}>
      <View style={styles.glow} />
      <Text style={styles.kicker}>SEDIAOPS</Text>
      <Text style={styles.title}>{WELCOME_TITLE}</Text>
      <Text style={styles.subtitle}>{WELCOME_SUBTITLE}</Text>
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
});