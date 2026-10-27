// src/screens/jawatankuasa/LaporanTerkini.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText } from 'lucide-react-native';
import Card from './Card';
import { CMD, masaLalu } from './commandPalette';

export default function LaporanTerkini({ laporan }) {
  return (
    <Card title="Laporan Terkini" subtitle="Rekod bencana terkini yang diterima">
      {laporan.length === 0 ? (
        <Text style={styles.empty}>Tiada rekod buat masa ini.</Text>
      ) : laporan.map((l, i) => (
        <View key={l.id} style={[styles.row, i > 0 && styles.rowBorder]}>
          <View style={[styles.iconBox, { borderColor: (l.aktif ? CMD.orange : CMD.blue) + '55' }]}>
            <FileText size={14} color={l.aktif ? CMD.orange : CMD.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{l.tajuk.toUpperCase()}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {l.aktif ? 'Aktif' : 'Selesai'} · {l.kategori}
            </Text>
          </View>
          <Text style={styles.time}>{masaLalu(l.tarikh)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { color: CMD.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: CMD.cardBorder },
  iconBox: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CMD.cardSoft },
  title: { color: CMD.text, fontSize: 12, fontWeight: '800' },
  sub: { color: CMD.textMuted, fontSize: 11, marginTop: 2 },
  time: { color: CMD.textFaint, fontSize: 11 },
});
