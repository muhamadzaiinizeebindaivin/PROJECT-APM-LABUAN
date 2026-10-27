// src/screens/jawatankuasa/HotspotList.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './Card';
import { CMD } from './commandPalette';

const PREVIEW = 5;

// Tri par No. Rujukan : numériques d'abord, puis texte
const sortByRefNo = (a, b) => {
  const na = parseFloat(a.ref_no); const nb = parseFloat(b.ref_no);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  if (Number.isNaN(na) !== Number.isNaN(nb)) return Number.isNaN(na) ? 1 : -1;
  return String(a.ref_no || '').localeCompare(String(b.ref_no || ''));
};

export default function HotspotList({ hotspotList, hotspotCategories }) {
  const [expanded, setExpanded] = useState({});

  const groups = hotspotCategories
    .map((cat) => ({ cat, items: hotspotList.filter((h) => h.category === cat.key).sort(sortByRefNo) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card title="Senarai Hotspot" subtitle="Lokasi berisiko mengikut kategori">
      {groups.length === 0 ? (
        <Text style={styles.empty}>Tiada hotspot direkodkan.</Text>
      ) : groups.map(({ cat, items }) => {
        const isOpen = !!expanded[cat.key];
        const shown = isOpen ? items : items.slice(0, PREVIEW);
        return (
          <View key={cat.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.dot, { backgroundColor: cat.color || CMD.orange }]} />
              <Text style={styles.groupTitle}>{cat.label}</Text>
              <Text style={styles.groupCount}>{items.length} lokasi</Text>
            </View>
            {shown.map((h) => (
              <View key={h.id} style={styles.item}>
                <Text style={[styles.ref, { color: cat.color || CMD.orange }]}>{h.ref_no || '-'}</Text>
                <Text style={styles.itemText} numberOfLines={1}>
                  {[h.river, h.area].filter(Boolean).join(' — ') || '-'}
                </Text>
              </View>
            ))}
            {items.length > PREVIEW && (
              <TouchableOpacity onPress={() => setExpanded((e) => ({ ...e, [cat.key]: !isOpen }))}>
                <Text style={styles.more}>{isOpen ? 'Tunjuk kurang' : `+${items.length - PREVIEW} lagi`}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { color: CMD.textMuted, fontSize: 12 },
  group: { marginBottom: 14 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  groupTitle: { flex: 1, color: CMD.text, fontSize: 13, fontWeight: '800' },
  groupCount: { color: CMD.textMuted, fontSize: 11 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5, paddingLeft: 17 },
  ref: { width: 34, fontSize: 11, fontWeight: '800' },
  itemText: { flex: 1, color: CMD.textMuted, fontSize: 12 },
  more: { color: CMD.blue, fontSize: 12, fontWeight: '700', paddingLeft: 17, marginTop: 4 },
});
