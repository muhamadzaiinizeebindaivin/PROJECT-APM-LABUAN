// src/screens/jawatankuasa/DashboardHeader.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { CMD } from './commandPalette';

const LOGO_URL = 'https://kceeewyadcskivtmilyf.supabase.co/storage/v1/object/public/logo/apm_labuan.png';

export default function DashboardHeader() {
  return (
    <View style={styles.wrap}>
      <View style={styles.logoCircle}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.kickerRow}>
        <ShieldCheck size={12} color={CMD.green} />
        <Text style={styles.kicker}>SISTEM RASMI APM</Text>
      </View>
      <Text style={styles.title}>Sekretariat</Text>
      <Text style={styles.subtitle}>Jawatankuasa Pengurusan Bencana Daerah Labuan</Text>
      <Text style={styles.description}>
        Pemantauan bencana, pergerakan agensi dan pusat pemindahan sementara (PPS) Daerah Labuan dalam satu paparan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 16 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: CMD.cardSoft,
    borderWidth: 1, borderColor: CMD.cardBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logo: { width: 44, height: 44 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  kicker: { color: CMD.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: CMD.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: CMD.text, fontSize: 14, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  description: { color: CMD.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center', maxWidth: 520, lineHeight: 18 },
});
