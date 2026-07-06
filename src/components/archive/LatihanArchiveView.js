// src/components/archive/LatihanArchiveView.js
//
// Version "lecture seule" de LatihanScreen.js — reprend les mêmes styles et
// la même structure visuelle (cartes stat, graphique mensuel, donut de
// statut, kumpulan sasaran, senarai latihan) que l'écran original, alimentée
// par les données archivées d'une sauvegarde. Pas de CRUD, pas de modals
// interactifs, pas d'animation (contenu statique pour un archive).

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Users, Calendar, Activity, CheckCircle2, Clock, XCircle, X } from 'lucide-react-native';

const MONTHS_LABEL = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];

const formatDisplayDate = (startStr, endStr) => {
  if (!startStr) return 'Tiada Tarikh';
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;
  if (start.getTime() === end.getTime() || !endStr) return `${start.getDate()} ${MONTHS_LABEL[start.getMonth()]} ${start.getFullYear()}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return `${start.getDate()} - ${end.getDate()} ${MONTHS_LABEL[start.getMonth()]} ${start.getFullYear()}`;
  return `${start.getDate()} ${MONTHS_LABEL[start.getMonth()]} - ${end.getDate()} ${MONTHS_LABEL[end.getMonth()]} ${end.getFullYear()}`;
};

export default function LatihanArchiveView({ rows = [] }) {
  const [senaraiModalVisible, setSenaraiModalVisible] = useState(false);
  const [pesertaModalVisible, setPesertaModalVisible] = useState(false);
  const [prestasiModalVisible, setPrestasiModalVisible] = useState(false);

  const stats = useMemo(() => {
    const totalEvents = rows.length;
    const totalPax = rows.reduce((acc, item) => acc + (parseInt(item.pax) || 0), 0);
    const completed = rows.filter((i) => i.status === 'Berjaya').length;
    const completionRate = totalEvents > 0 ? Math.round((completed / totalEvents) * 100) : 0;

    const monthlyCounts = new Array(12).fill(0);
    rows.forEach((item) => {
      if (item.start_date) {
        const m = new Date(item.start_date).getMonth();
        if (m >= 0 && m <= 11) monthlyCounts[m]++;
      }
    });

    const audienceGroups = {};
    rows.forEach((item) => {
      const sasarans = (item.note || 'Tiada Kumpulan Sasaran').split(',').map((s) => s.trim()).filter(Boolean);
      (sasarans.length ? sasarans : ['Tiada Kumpulan Sasaran']).forEach((key) => {
        audienceGroups[key] = (audienceGroups[key] || 0) + 1;
      });
    });

    return {
      totalEvents, totalPax, completed, completionRate,
      monthlyCounts, maxMonthVal: Math.max(...monthlyCounts, 1),
      audienceList: Object.keys(audienceGroups)
        .map((key) => ({ label: key, count: audienceGroups[key], percent: totalEvents > 0 ? Math.round((audienceGroups[key] / totalEvents) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [rows]);

  const getStatusIcon = (status) => {
    if (status === 'Berjaya') return <CheckCircle2 size={16} color="#22c55e" />;
    if (status === 'Akan Diadakan') return <Clock size={16} color="#eab308" />;
    return <XCircle size={16} color="#ef4444" />;
  };

  return (
    <View>
      <View style={styles.topRow}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#14b8a6' }]} activeOpacity={0.8} onPress={() => setPesertaModalVisible(true)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabelLight}>Total Peserta</Text>
            <View style={styles.iconBoxLight}><Users size={14} color="#14b8a6" /></View>
          </View>
          <Text style={styles.cardValueLight}>{stats.totalPax}</Text>
          <Text style={styles.cardLink}>Lihat Pecahan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#3b82f6' }]} activeOpacity={0.8} onPress={() => setSenaraiModalVisible(true)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabelLight}>Bil. Latihan</Text>
            <View style={styles.iconBoxLight}><Calendar size={14} color="#3b82f6" /></View>
          </View>
          <Text style={styles.cardValueLight}>{stats.totalEvents}</Text>
          <Text style={styles.cardLink}>Lihat Senarai</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#f97316' }]} activeOpacity={0.8} onPress={() => setPrestasiModalVisible(true)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabelLight}>Prestasi</Text>
            <View style={styles.iconBoxLight}><Activity size={14} color="#f97316" /></View>
          </View>
          <Text style={styles.cardValueLight}>{stats.completionRate}%</Text>
          <Text style={styles.cardLink}>{stats.completed} Berjaya</Text>
        </TouchableOpacity>
      </View>

      {/* Statistik Bulanan */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Statistik Bulanan</Text>
        <View style={styles.chartContainer}>
          {MONTHS_LABEL.map((m, i) => {
            const height = (stats.monthlyCounts[i] / stats.maxMonthVal) * 90;
            return (
              <View key={i} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: Math.max(height, 4), backgroundColor: stats.monthlyCounts[i] > 0 ? '#3b82f6' : '#e2e8f0' }]} />
                </View>
                <Text style={styles.barLabel}>{m}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Kumpulan Sasaran */}
      {stats.audienceList.length ? (
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Kumpulan Sasaran</Text>
          {stats.audienceList.map((item, index) => (
            <View key={index} style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.progressPercent}>{item.percent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.percent}%`, backgroundColor: index % 2 === 0 ? '#3b82f6' : '#14b8a6' }]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* --- MODAL: SENARAI LATIHAN --- */}
      <Modal visible={senaraiModalVisible} animationType="fade" transparent onRequestClose={() => setSenaraiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Senarai Latihan</Text>
              <TouchableOpacity onPress={() => setSenaraiModalVisible(false)}><X size={22} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {rows.length === 0 ? (
                <Text style={styles.emptyText}>Tiada data latihan.</Text>
              ) : (
                rows.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={{ width: 78 }}>
                      <Text style={styles.listDate}>{formatDisplayDate(item.start_date, item.end_date)}</Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 8 }}>
                      <Text style={styles.listTitle}>{item.title}</Text>
                      <Text style={styles.listSub}>{item.note || 'Tiada Kumpulan'} • {item.pax} Pax</Text>
                    </View>
                    {getStatusIcon(item.status)}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: PECAHAN PESERTA --- */}
      <Modal visible={pesertaModalVisible} animationType="fade" transparent onRequestClose={() => setPesertaModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pecahan Peserta</Text>
              <TouchableOpacity onPress={() => setPesertaModalVisible(false)}><X size={22} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {rows.map((item) => (
                <View key={item.id} style={styles.modalListItem}>
                  <Text style={styles.modalListTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.modalListValue}>{item.pax} Pax</Text>
                </View>
              ))}
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Jumlah Keseluruhan</Text>
                <Text style={styles.modalTotalValue}>{stats.totalPax} Pax</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: STATUS KESELURUHAN --- */}
      <Modal visible={prestasiModalVisible} animationType="fade" transparent onRequestClose={() => setPrestasiModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Status Keseluruhan</Text>
              <TouchableOpacity onPress={() => setPrestasiModalVisible(false)}><X size={22} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {rows.map((item) => (
                <View key={item.id} style={styles.modalListItem}>
                  <Text style={styles.modalListTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {getStatusIcon(item.status)}
                    <Text style={styles.modalListValue}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 16, minHeight: 90, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBoxLight: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 7 },
  cardLabelLight: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600' },
  cardValueLight: { color: 'white', fontSize: 20, fontWeight: '800', marginVertical: 3 },
  cardSubLight: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  cardLink: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 480, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalListTitle: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1e293b', marginRight: 8 },
  modalListValue: { fontSize: 12, fontWeight: '700', color: '#14b8a6' },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  modalTotalLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  modalTotalValue: { fontSize: 15, fontWeight: '900', color: '#14b8a6' },

  sectionCard: { padding: 18, borderRadius: 18, marginBottom: 16, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 16 },

  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barWrapper: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { height: 100, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barFill: { width: 10, borderRadius: 5 },
  barLabel: { fontSize: 9, marginTop: 6, color: '#94a3b8' },

  progressRow: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', maxWidth: '80%' },
  progressPercent: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 10, fontStyle: 'italic' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 6 },
  listDate: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  listTitle: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  listSub: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },
});
