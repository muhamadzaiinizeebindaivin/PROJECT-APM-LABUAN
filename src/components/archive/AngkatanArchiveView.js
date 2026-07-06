// src/components/archive/AngkatanArchiveView.js
//
// Version "lecture seule" de AngkatanScreen.js — reprend les mêmes styles et
// la même structure visuelle (cartes, taburan jantina, tableau pangkat,
// program komuniti, piramid struktur) que l'écran original, alimentée par
// les données archivées d'une sauvegarde.
//
// Note : le graphique "Trend Aktif (2021-2025)" de l'écran original utilise
// une constante statique (DATA.MEMBERSHIP_TREND dans data.js), pas une table
// Supabase — il n'est donc pas repris ici puisqu'il ne fait pas partie des
// données archivées.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users2, ShieldCheck, ListFilter } from 'lucide-react-native';

const StatusBox = ({ label, value, color }) => (
  <View style={styles.statusBox}>
    <Text style={[styles.statusValue, { color }]}>{value}</Text>
    <Text style={styles.statusLabel}>{label}</Text>
  </View>
);

export default function AngkatanArchiveView({ summary, categories = [], ranks = [], community = [], pyramid = [] }) {
  const s = summary || {};
  const sortedPyramid = [...pyramid].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const totalGender = (s.male_count || 0) + (s.female_count || 0);
  const malePercent = totalGender > 0 ? Math.round((s.male_count / totalGender) * 100) : 0;
  const femalePercent = totalGender > 0 ? Math.round((s.female_count / totalGender) * 100) : 0;

  return (
    <View style={styles.contentGrid}>
      {summary ? (
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.bigNumber}>{s.total_anggota}</Text>
            <Text style={styles.cardSub}>Jumlah Anggota</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{s.aktif_anggota} Aktif</Text>
            </View>
          </View>

          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Taburan Jantina</Text>
            <View style={styles.genderContainer}>
              <View style={styles.genderRow}>
                <View style={styles.genderIconCircle}><Users2 size={22} color="#3b82f6" /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.genderHeader}>
                    <Text style={styles.genderLabel}>Lelaki</Text>
                    <Text style={styles.genderValue}>{s.male_count}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${malePercent}%`, backgroundColor: '#3b82f6' }]} />
                  </View>
                </View>
              </View>

              <View style={styles.genderRow}>
                <View style={[styles.genderIconCircle, { backgroundColor: '#fdf2f8' }]}>
                  <Users2 size={22} color="#db2777" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.genderHeader}>
                    <Text style={styles.genderLabel}>Wanita</Text>
                    <Text style={styles.genderValue}>{s.female_count}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${femalePercent}%`, backgroundColor: '#db2777' }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {categories.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Penjawatan Utama</Text>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.listItem}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={styles.listItemLabel}>{cat.name}</Text>
              <Text style={styles.listItemValue}>{cat.count}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {summary ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={18} color="#f97316" />
            <Text style={[styles.cardTitle, { marginLeft: 8, marginBottom: 0 }]}>Status Anggota</Text>
          </View>
          <View style={styles.statusGrid}>
            <StatusBox label="Lulus Ujian" value={s.status_lulus} color="#3b82f6" />
            <StatusBox label="Lantikan Baru" value={s.status_lantikan} color="#f97316" />
            <StatusBox label="Simpanan" value={s.status_simpanan} color="#6366f1" />
            <StatusBox label="Aktif Penugasan" value={s.status_aktif} color="#22c55e" />
          </View>
        </View>
      ) : null}

      {ranks.length ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ListFilter size={18} color="#f97316" />
            <Text style={[styles.cardTitle, { marginLeft: 8, marginBottom: 0 }]}>Rekod Kenaikan Pangkat</Text>
          </View>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              {['PERINGKAT', 'LULUS', 'NAIK', 'KBP', 'PTB', 'AKTIF', 'SIMPANAN'].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {ranks.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { fontWeight: '700', textAlign: 'left', flex: 1.4 }]}>{item.rank}</Text>
                <Text style={styles.tableCell}>{item.lulus}</Text>
                <Text style={styles.tableCell}>{item.kenaikan}</Text>
                <Text style={styles.tableCell}>{item.kbp}</Text>
                <Text style={styles.tableCell}>{item.ptb}</Text>
                <Text style={[styles.tableCell, { color: '#22c55e', fontWeight: '700' }]}>{item.aktif}</Text>
                <Text style={[styles.tableCell, { color: '#f97316', fontWeight: '700' }]}>{item.simpanan}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {community.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program Komuniti (Pasukan APM)</Text>
          {community.map((prog) => (
            <View key={prog.id} style={styles.communityItem}>
              <View style={[styles.programBadge, { backgroundColor: prog.color }]}>
                <Text style={styles.programBadgeText}>{prog.category}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.communityLabel}>{prog.label}</Text>
                <Text style={styles.communityDetail}>{prog.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {sortedPyramid.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Struktur Pangkat & Keahlian</Text>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            {sortedPyramid.map((item, i) => (
              <View key={item.id} style={[styles.pyramidTier, { width: `${35 + i * 6}%`, backgroundColor: item.color }]}>
                <Text style={styles.pyramidText}>{item.rank} ({item.total})</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contentGrid: { gap: 16 },
  row: { flexDirection: 'row', gap: 16 },
  card: { padding: 18, borderRadius: 18, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  cardSub: { color: '#64748b', fontWeight: '600', fontSize: 12 },
  bigNumber: { fontSize: 40, fontWeight: '900', color: '#f97316', letterSpacing: -1 },
  activeBadge: { backgroundColor: '#22c55e15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  activeBadgeText: { color: '#22c55e', fontWeight: 'bold', fontSize: 12 },

  genderContainer: { gap: 14 },
  genderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genderIconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },
  genderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  genderLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  genderValue: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  progressBarBg: { height: 7, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  listItemLabel: { color: '#475569', flex: 1, fontSize: 13 },
  listItemValue: { color: '#0f172a', fontWeight: '700', fontSize: 13 },

  statusGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statusBox: { flex: 1, minWidth: 70, padding: 14, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center' },
  statusValue: { fontSize: 20, fontWeight: '900' },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 4, textAlign: 'center' },

  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  tableHeaderRow: { backgroundColor: '#f8fafc' },
  tableHeaderCell: { flex: 1, padding: 8, fontSize: 9, fontWeight: '900', color: '#334155', borderRightWidth: 1, borderColor: '#e2e8f0', textAlign: 'center' },
  tableCell: { flex: 1, padding: 8, fontSize: 11, color: '#475569', borderRightWidth: 1, borderColor: '#e2e8f0', textAlign: 'center' },

  communityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  programBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  programBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  communityLabel: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  communityDetail: { color: '#64748b', marginTop: 2, fontSize: 11 },

  pyramidTier: { height: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderRadius: 10 },
  pyramidText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
});
