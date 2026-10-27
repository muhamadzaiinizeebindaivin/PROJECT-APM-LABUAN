// src/screens/jawatankuasa/PpsStatusDonut.js
import React, { createElement } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import Card from './Card';
import { CMD } from './commandPalette';

const SIZE = 120;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export default function PpsStatusDonut({ ppsList }) {
  const total = ppsList.length;
  const ok = ppsList.filter((p) => p.status === 'OK').length;
  const notOk = total - ok;
  const okLength = total > 0 ? (C * ok) / total : 0;

  const rows = [
    { label: 'OK (sedia digunakan)', value: ok, color: CMD.green },
    { label: 'Tidak OK', value: notOk, color: CMD.red },
  ];

  return (
    <Card title="Status PPS" subtitle="Pusat pemindahan sementara Daerah Labuan">
      <View style={styles.row}>
        <View style={{ width: SIZE, height: SIZE }}>
          {Platform.OS === 'web' && createElement('svg', { width: SIZE, height: SIZE },
            createElement('circle', { cx: SIZE / 2, cy: SIZE / 2, r: R, fill: 'none', stroke: total > 0 ? CMD.red : CMD.cardBorder, strokeWidth: STROKE }),
            total > 0 && createElement('circle', {
              cx: SIZE / 2, cy: SIZE / 2, r: R, fill: 'none', stroke: CMD.green, strokeWidth: STROKE,
              strokeDasharray: `${okLength} ${C}`, transform: `rotate(-90 ${SIZE / 2} ${SIZE / 2})`,
            }),
          )}
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Text style={styles.total}>{total}</Text>
            <Text style={styles.totalLabel}>PPS</Text>
          </View>
        </View>

        <View style={{ flex: 1, gap: 12 }}>
          {rows.map((r) => (
            <View key={r.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: r.color }]} />
              <Text style={styles.legendText}>{r.label}</Text>
              <Text style={styles.legendValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  center: { alignItems: 'center', justifyContent: 'center' },
  total: { color: CMD.text, fontSize: 24, fontWeight: '900' },
  totalLabel: { color: CMD.textMuted, fontSize: 10, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { flex: 1, color: CMD.textMuted, fontSize: 12 },
  legendValue: { color: CMD.text, fontSize: 14, fontWeight: '800' },
});
