// src/screens/jawatankuasa/StatCards.js
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { AlertTriangle, Users, Home, Building2, MapPin, Truck } from 'lucide-react-native';
import { CMD } from './commandPalette';

export default function StatCards({ stats }) {
  const { width } = useWindowDimensions();
  const perRow = width < 480 ? 2 : width < 900 ? 3 : 6;

  const cards = [
    { label: 'Bencana Aktif', value: stats.bencanaAktif, Icon: AlertTriangle, color: CMD.red },
    { label: 'Mangsa', value: stats.mangsa, Icon: Users, color: CMD.blue },
    { label: 'Keluarga (KIR)', value: stats.keluarga, Icon: Home, color: CMD.orange },
    { label: 'PPS OK', value: `${stats.ppsOk}/${stats.ppsTotal}`, Icon: Building2, color: CMD.green },
    { label: 'Kawasan Terjejas', value: stats.kawasanTerjejas, Icon: MapPin, color: CMD.yellow },
    { label: 'Agensi di Lapangan', value: stats.agensiDiLapangan, Icon: Truck, color: CMD.blue },
  ];

  return (
    <View style={styles.grid}>
      {cards.map(({ label, value, Icon, color }) => (
        <View key={label} style={[styles.card, { width: `${100 / perRow}%` }]}>
          <View style={styles.inner}>
            <View style={[styles.iconBox, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Icon size={16} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label} numberOfLines={1}>{label.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  card: { padding: 5 },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CMD.card,
    borderRadius: 14, borderWidth: 1, borderColor: CMD.cardBorder, padding: 14,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value: { color: CMD.text, fontSize: 22, fontWeight: '900' },
  label: { color: CMD.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
});
