// src/screens/jawatankuasa/PpsStatusDonut.js
import React, { createElement } from 'react';
import { View, Text, Platform, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import Card from './Card';
import { CMD, isPpsOk } from './commandPalette';

const SIZE = 120;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

// Liste d'un groupe de PPS (OK ou Tidak OK)
function PpsGroup({ title, items, color, softColor, Icon, showIssue }) {
  return (
    <View style={styles.group}>
      <View style={[styles.groupHeader, { backgroundColor: softColor }]}>
        <Icon size={14} color={color} />
        <Text style={[styles.groupTitle, { color }]}>{title}</Text>
        <Text style={[styles.groupCount, { color }]}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>Tiada.</Text>
      ) : (
        <ScrollView style={styles.groupList} nestedScrollEnabled>
          {items.map((p, i) => (
            <View key={p.id} style={[styles.ppsRow, i > 0 && styles.ppsRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ppsName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.ppsMeta}>
                  Zon {p.zone || '-'}{p.capacity ? ` · ${p.capacity} pax` : ''}
                </Text>
                {showIssue && !!p.status && (
                  <Text style={styles.ppsIssue} numberOfLines={2}>{p.status.trim()}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function PpsStatusDonut({ ppsList }) {
  const okList = ppsList.filter(isPpsOk);
  const notOkList = ppsList.filter((p) => !isPpsOk(p));
  const total = ppsList.length;
  const ok = okList.length;
  const notOk = notOkList.length;
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

      {/* Senarai : Tidak OK d'abord (le plus important), puis OK */}
      <View style={styles.groups}>
        <PpsGroup title="Tidak OK" items={notOkList} color={CMD.red} softColor={CMD.redSoft} Icon={XCircle} showIssue />
        <PpsGroup title="OK (sedia)" items={okList} color={CMD.green} softColor={CMD.greenSoft} Icon={CheckCircle2} />
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
  groups: { marginTop: 16, gap: 12 },
  group: { borderWidth: 1, borderColor: CMD.cardBorder, borderRadius: 12, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  groupTitle: { flex: 1, fontSize: 12, fontWeight: '800' },
  groupCount: { fontSize: 12, fontWeight: '900' },
  groupList: { maxHeight: 180 },
  ppsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  ppsRowBorder: { borderTopWidth: 1, borderTopColor: CMD.cardBorder },
  ppsName: { color: CMD.text, fontSize: 12, fontWeight: '700' },
  ppsMeta: { color: CMD.textMuted, fontSize: 11, marginTop: 1 },
  ppsIssue: { color: CMD.red, fontSize: 11, marginTop: 3, fontWeight: '600' },
  empty: { color: CMD.textMuted, fontSize: 11, fontStyle: 'italic', paddingHorizontal: 12, paddingVertical: 8 },
});
