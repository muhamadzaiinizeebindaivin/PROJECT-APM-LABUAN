// src/screens/jawatankuasa/TrendMangsaChart.js
//
// Mangsa et keluarga (KIR) par mois sur une année. Courbes en SVG natif du navigateur
// (le projet n'a pas de bibliothèque de graphiques).
import React, { useState, createElement } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import Card from './Card';
import { CMD, BULAN_PENDEK } from './commandPalette';
import { PALETTE } from '../../constants/palette';

const H = 180;          // hauteur de la zone de tracé
const PAD = { top: 12, right: 12, bottom: 26, left: 34 };
const svg = createElement;

export default function TrendMangsaChart({ availableYears, monthlyTrend }) {
  const [year, setYear] = useState(availableYears[0] || new Date().getFullYear());
  const [width, setWidth] = useState(0);
  const months = monthlyTrend(year);
  const totalMangsa = months.reduce((s, m) => s + m.mangsa, 0);
  const totalKeluarga = months.reduce((s, m) => s + m.keluarga, 0);

  const maxVal = Math.max(1, ...months.map((m) => Math.max(m.mangsa, m.keluarga)));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (plotW * i) / 11;
  const y = (v) => PAD.top + plotH - (plotH * v) / maxVal;
  const linePath = (key) => months.map((m, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(m[key]).toFixed(1)}`).join(' ');
  const areaPath = `${linePath('mangsa')} L${x(11).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;
  const gridValues = [0, 0.5, 1].map((f) => Math.round(maxVal * f));

  const yearChips = (
    <View style={styles.chips}>
      {availableYears.slice(0, 4).map((y) => (
        <TouchableOpacity key={y} onPress={() => setYear(y)} style={[styles.chip, y === year && styles.chipActive]}>
          <Text style={[styles.chipText, y === year && styles.chipTextActive]}>{y}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Card title="Trend Mangsa" subtitle="Mangsa dan keluarga terjejas mengikut bulan" right={yearChips}>
      <View style={styles.totalRow}>
        <Text style={styles.total}>{totalMangsa}</Text>
        <Text style={styles.totalSub}>mangsa · {totalKeluarga} keluarga pada {year}</Text>
      </View>

      <View style={{ height: H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {Platform.OS === 'web' && width > 0 && svg('svg', { width, height: H },
          svg('defs', {},
            svg('linearGradient', { id: 'jkMangsaFill', x1: '0', y1: '0', x2: '0', y2: '1' },
              svg('stop', { offset: '0%', stopColor: CMD.blue, stopOpacity: 0.35 }),
              svg('stop', { offset: '100%', stopColor: CMD.blue, stopOpacity: 0 }),
            ),
          ),
          // lignes de repère + valeurs
          ...gridValues.map((v, i) => svg('g', { key: `g${i}` },
            svg('line', { x1: PAD.left, x2: PAD.left + plotW, y1: y(v), y2: y(v), stroke: CMD.cardBorder, strokeDasharray: '3 4' }),
            svg('text', { x: PAD.left - 6, y: y(v) + 4, fill: CMD.textFaint, fontSize: 10, textAnchor: 'end' }, String(v)),
          )),
          // mois
          ...BULAN_PENDEK.map((m, i) => svg('text', {
            key: `m${i}`, x: x(i), y: H - 8, fill: CMD.textFaint, fontSize: 10, textAnchor: 'middle',
          }, m)),
          svg('path', { d: areaPath, fill: 'url(#jkMangsaFill)' }),
          svg('path', { d: linePath('mangsa'), fill: 'none', stroke: CMD.blue, strokeWidth: 2.5, strokeLinejoin: 'round' }),
          svg('path', { d: linePath('keluarga'), fill: 'none', stroke: CMD.orange, strokeWidth: 2, strokeDasharray: '5 4', strokeLinejoin: 'round' }),
          ...months.map((m, i) => (m.mangsa > 0
            ? svg('circle', { key: `p${i}`, cx: x(i), cy: y(m.mangsa), r: 3.5, fill: CMD.blue, stroke: CMD.card, strokeWidth: 1.5 })
            : null)),
        )}
        {Platform.OS !== 'web' && <Text style={styles.totalSub}>Graf hanya tersedia pada versi web.</Text>}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: CMD.blue }]} /><Text style={styles.legendText}>Mangsa</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: CMD.orange }]} /><Text style={styles.legendText}>Keluarga (KIR)</Text></View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 4, backgroundColor: CMD.cardSoft, borderRadius: 999, padding: 3, borderWidth: 1, borderColor: CMD.cardBorder },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipActive: { backgroundColor: CMD.orange },
  chipText: { color: CMD.textMuted, fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: PALETTE.white },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 },
  total: { color: CMD.text, fontSize: 26, fontWeight: '900' },
  totalSub: { color: CMD.textMuted, fontSize: 12 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: CMD.textMuted, fontSize: 11 },
});
