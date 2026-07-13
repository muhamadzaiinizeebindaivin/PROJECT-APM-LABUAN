// src/components/archive/OperasiArchiveView.js
//
// Version "lecture seule" de OperasiScreen.js — reprend le style du rapport
// NG999 (stats, tendance, pecahan par kategori) de l'écran original.
// La carte live (Leaflet/GPS temps réel) n'est pas reprise ici — elle n'a
// pas de sens pour un archive figé. À la place, les véhicules sont affichés
// en simple liste avec leur dernier statut connu au moment de la sauvegarde.

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';

const CATEGORY_OPTIONS = [
  "KJR - Kemalangan Jalan Raya", "KMU - Kes Menangkap Ular", "MSS - Musnah Sarang Serangga",
  "ML - Mangsa Lemas", "SKT - Sakit", "KTK - Kemalangan Tempat Kerja",
  "MT - Mangsa Terperangkap", "KK - Kes Kebakaran", "KBD - Kes Bunuh Diri", "LLK - Lain-lain kes",
];
import { BULAN_MS } from '../../constants/bulan';

const MONTH_OPTIONS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthLabelMs = (englishMonth) => BULAN_MS[MONTH_OPTIONS.indexOf(englishMonth)] || englishMonth;

const getCategoryColor = (id) => ({
  KJR: '#ef4444', KMU: '#f97316', MSS: '#eab308', ML: '#3b82f6', SKT: '#a855f7',
  KTK: '#ec4899', MT: '#14b8a6', KK: '#f43f5e', KBD: '#64748b', LLK: '#94a3b8',
}[id] || '#3b82f6');

export default function OperasiArchiveView({ ngRows = [] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const { monthlyTrend, caseBreakdown, topCase, totalCases } = useMemo(() => {
    const totalCases = ngRows.reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);

    const monthlyTrend = MONTH_OPTIONS.map((month) => ({
      month,
      label: monthLabelMs(month),
      total: ngRows.filter((item) => item.month === month).reduce((sum, item) => sum + (item.jumlah_kes || 1), 0),
    })).filter((m) => m.total > 0);

    const caseBreakdown = CATEGORY_OPTIONS.map((opt) => {
      const [id, ...labelArr] = opt.split(' - ');
      const label = labelArr.join(' - ');
      const color = getCategoryColor(id);
      const monthData = {};
      MONTH_OPTIONS.forEach((m) => {
        monthData[m] = ngRows.filter((item) => item.kategori_kes === opt && item.month === m).reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      });
      return { id, label, color, ...monthData };
    });

    let maxCount = 0;
    let topLabel = 'Tiada Data';
    CATEGORY_OPTIONS.forEach((opt) => {
      const count = ngRows.filter((item) => item.kategori_kes === opt).reduce((sum, item) => sum + (item.jumlah_kes || 1), 0);
      if (count > maxCount) { maxCount = count; topLabel = opt.split(' - ')[1]; }
    });

    return { monthlyTrend, caseBreakdown, topCase: { label: topLabel, total: maxCount }, totalCases };
  }, [ngRows]);

  const getTrend = () => {
    if (monthlyTrend.length >= 2) {
      const current = monthlyTrend[monthlyTrend.length - 1];
      const prev = monthlyTrend[monthlyTrend.length - 2];
      const diff = current.total - prev.total;
      if (diff > 0) return { text: `+${diff} Kes`, color: '#b91c1c', bg: '#fef2f2', border: '#ef4444', icon: <TrendingUp size={16} color="#b91c1c" />, sub: `Berbanding ${prev.month}` };
      if (diff < 0) return { text: `${diff} Kes`, color: '#15803d', bg: '#f0fdf4', border: '#22c55e', icon: <TrendingDown size={16} color="#15803d" />, sub: `Berbanding ${prev.month}` };
      return { text: 'Tiada Perubahan', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: `Berbanding ${prev.month}` };
    }
    return { text: 'N/A', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: 'Perlu 2 bulan data' };
  };
  const trend = getTrend();

  return (
    <View>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>Laporan Kes Kecemasan</Text>
        <Text style={styles.reportSub}>NG 999 W.P. Labuan</Text>
      </View>

      <View style={styles.statsRow}>
        {monthlyTrend.length === 0 ? (
          <View style={styles.statBox}><Text style={styles.statBoxEmpty}>Tiada Data Bulanan</Text></View>
        ) : (
          monthlyTrend.slice(-2).map((item, index) => (
            <View key={index} style={styles.statBox}>
              <View style={styles.statBoxTop}>
                <Calendar size={14} color="#3b82f6" />
                <Text style={styles.statBoxLabel}>{item.month}</Text>
              </View>
              <Text style={styles.statBoxValue}>{item.total}</Text>
              <Text style={styles.statBoxSub}>Jumlah Kes</Text>
            </View>
          ))
        )}
        <View style={[styles.statBox, { backgroundColor: trend.bg, borderColor: trend.border, borderWidth: 1 }]}>
          <View style={styles.statBoxTop}>{trend.icon}<Text style={[styles.statBoxLabel, { color: trend.color }]}>Trend</Text></View>
          <Text style={[styles.statBoxValue, { color: trend.color, fontSize: 18 }]}>{trend.text}</Text>
          <Text style={[styles.statBoxSub, { color: trend.color }]}>{trend.sub}</Text>
        </View>
      </View>

      {totalCases > 0 ? (
        <View style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <AlertTriangle size={22} color="#ea580c" />
            <Text style={styles.highlightTitle}>Kes Tertinggi Keseluruhan</Text>
          </View>
          <Text style={styles.highlightLabel}>{topCase.label}</Text>
          <Text style={styles.highlightSub}>Menyumbang {topCase.total} daripada {totalCases} jumlah panggilan.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.dropdownHeaderBtn} onPress={() => setDropdownOpen(!dropdownOpen)} activeOpacity={0.7}>
        <Text style={styles.dropdownHeaderText}>
          {selectedMonth ? `Pecahan Kategori: ${selectedMonth}` : 'Pilih Bulan Untuk Pecahan Kategori'}
        </Text>
        {dropdownOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
      </TouchableOpacity>

      {dropdownOpen ? (
        <View style={styles.dropdownList}>
          {monthlyTrend.map((m, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dropdownItem, index < monthlyTrend.length - 1 && styles.dropdownItemBorder]}
              onPress={() => { setSelectedMonth(m.month); setDropdownOpen(false); }}
            >
              <Text style={[styles.dropdownItemText, selectedMonth === m.month && styles.dropdownItemTextActive]}>{m.month}</Text>
            </TouchableOpacity>
          ))}
          {monthlyTrend.length === 0 ? <View style={styles.dropdownItem}><Text style={styles.statBoxEmpty}>Tiada data</Text></View> : null}
        </View>
      ) : null}

      {selectedMonth ? (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Pecahan Kes ({selectedMonth})</Text>
          {caseBreakdown.map((item, index) => {
            const monthVal = item[selectedMonth];
            if (!monthVal) return null;
            const monthTotal = monthlyTrend.find((m) => m.month === selectedMonth)?.total || 1;
            const percent = Math.round((monthVal / monthTotal) * 100);
            return (
              <View key={index} style={styles.breakdownRow}>
                <View style={styles.breakdownRowHeader}>
                  <Text style={styles.breakdownLabel}>[{item.id}] {item.label}</Text>
                  <Text style={styles.breakdownValue}>{monthVal} <Text style={styles.breakdownPercent}>({percent}%)</Text></Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { backgroundColor: item.color, width: `${percent}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  reportHeader: { marginBottom: 16 },
  reportTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  reportSub: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  statBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  statBoxLabel: { color: '#64748b', fontWeight: '700', fontSize: 11 },
  statBoxValue: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  statBoxSub: { fontSize: 9, color: '#94a3b8' },
  statBoxEmpty: { color: '#64748b', fontWeight: '700', fontSize: 11 },

  highlightCard: { padding: 16, borderRadius: 14, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#f97316', marginBottom: 16 },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  highlightTitle: { fontSize: 13, fontWeight: '800', color: '#9a3412', textTransform: 'uppercase' },
  highlightLabel: { fontSize: 22, fontWeight: '900', color: '#ea580c' },
  highlightSub: { fontSize: 12, fontWeight: '600', color: '#c2410c', marginTop: 4 },

  dropdownHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  dropdownHeaderText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  dropdownList: { borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 },
  dropdownItem: { padding: 14 },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { color: '#1e293b', fontWeight: '500' },
  dropdownItemTextActive: { color: '#3b82f6', fontWeight: '800' },

  breakdownContainer: { padding: 18, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, marginBottom: 16 },
  breakdownTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  breakdownRow: { marginBottom: 14 },
  breakdownRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  breakdownLabel: { color: '#1e293b', fontWeight: '700', fontSize: 12 },
  breakdownValue: { color: '#1e293b', fontWeight: '800', fontSize: 12 },
  breakdownPercent: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  progressBarBg: { height: 7, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
});
