import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldCheck, User, Truck, Building2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';

export default function AuthGate({
  onDriverLogin,
  onAgencyLogin,
  onGuestLogin,
  onLoginPress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.glowOrange} />
      <View style={styles.glowRed} />

      <View style={styles.content}>
        <Text style={styles.kicker}>SEDIAOPS • APM W.P LABUAN</Text>

        <Text style={styles.heroTitle}>
          Sedia Bertindak{'\n'}
          <Text style={styles.heroAccent}>Untuk Semua</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Responden pertama dalam situasi kecemasan dan bencana.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.pillPrimary} onPress={onLoginPress}>
            <ShieldCheck size={18} color="#fff" />
            <Text style={styles.pillPrimaryText}>Log Masuk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pillOutline} onPress={onGuestLogin}>
            <User size={18} color="#fff" />
            <Text style={styles.pillOutlineText}>Tetamu Awam</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onDriverLogin}>
            <Truck size={16} color={PALETTE.mutedLight} />
            <Text style={styles.secondaryText}>Pemandu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onAgencyLogin}>
            <Building2 size={16} color={PALETTE.mutedLight} />
            <Text style={styles.secondaryText}>Agensi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.ink, overflow: 'hidden' },
  glowOrange: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: PALETTE.orange,
    opacity: 0.22,
    top: -140,
    right: -120,
  },
  glowRed: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#dc2626',
    opacity: 0.16,
    bottom: -120,
    left: -140,
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  kicker: {
    color: PALETTE.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: PALETTE.white,
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 18,
  },
  heroAccent: { color: PALETTE.orange, fontStyle: 'italic' },
  heroSubtitle: {
    fontSize: 15,
    color: PALETTE.mutedLight,
    lineHeight: 22,
    marginBottom: 36,
    maxWidth: 340,
  },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.orange,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  pillPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pillOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PALETTE.inkBorder,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  pillOutlineText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryRow: { flexDirection: 'row', gap: 20 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondaryText: { color: PALETTE.mutedLight, fontSize: 13, fontWeight: '600' },
});