// src/components/archive/KewanganArchiveView.js
//
// Version "lecture seule" de KewanganScreen.js — reprend les mêmes styles et
// la même structure visuelle (cartes, KPI, tableaux groupés, barres de
// progression avec badge de statut) que l'écran original, alimentée par les
// données archivées d'une sauvegarde.
//
// Le total de peruntukan (totalAllocation) utilisé pour calculer le % par
// rapport au plafond trimestriel (25%) provient maintenant de la table
// sandbox.kewangan_summary, donc capturé automatiquement dans chaque snapshot
// et toujours à jour si l'admin le modifie.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const parseCurrency = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/,/g, ''));
};

const formatCurrency = (num) => {
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function KewanganArchiveView({ budgetData = [], breakdownData = [], summary = null }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const totalAgihanBudget = budgetData.reduce((sum, item) => sum + parseCurrency(item.agihan), 0);
  const totalBelanjaBudget = budgetData.reduce((sum, item) => sum + parseCurrency(item.belanja), 0);
  const bakiSemasaBudget = totalAgihanBudget - totalBelanjaBudget;

  const groupedBudget = budgetData.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

  const toggleCategory = (kategori) => {
    setExpandedCategories((prev) => ({ ...prev, [kategori]: !(prev[kategori] ?? true) }));
  };

  const totalAllocation = summary ? parseCurrency(summary.total_allocation) : 0;

  const processedBreakdown = breakdownData.map((item, index) => {
    const currentCumulative = parseCurrency(item.spend);
    const prevCumulative = index > 0 ? parseCurrency(breakdownData[index - 1].spend) : 0;
    const discreteSpend = currentCumulative - prevCumulative;
    const percentOfTotal = totalAllocation > 0 ? (discreteSpend / totalAllocation) * 100 : 0;

    let barColor = '#eab308';
    let statusText = 'Underspend';
    if (percentOfTotal > 25) { barColor = '#ef4444'; statusText = 'Melebihi Had'; }
    else if (percentOfTotal >= 25 * 0.85) { barColor = '#22c55e'; statusText = 'Optimum'; }

    return { ...item, discreteSpend, percentOfTotal, barColor, statusText };
  });

  return (
    <View>
      {summary ? (
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{summary.title}</Text>
          <Text style={styles.headerYear}>Tahun Kewangan {summary.year}</Text>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Jumlah Peruntukan</Text>
            <Text style={styles.totalAmount}>RM {formatCurrency(totalAllocation)}</Text>
          </View>
        </View>
      ) : null}

      {/* Budget KPIs */}
      {budgetData.length ? (
        <>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Jumlah Agihan</Text>
              <Text style={[styles.kpiValue, { color: '#1e40af' }]}>RM {formatCurrency(totalAgihanBudget)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Jumlah Belanja</Text>
              <Text style={[styles.kpiValue, { color: '#ea580c' }]}>RM {formatCurrency(totalBelanjaBudget)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Baki Semasa</Text>
              <Text style={[styles.kpiValue, { color: '#16a34a' }]}>RM {formatCurrency(bakiSemasaBudget)}</Text>
            </View>
          </View>

          {Object.keys(groupedBudget).map((kategori) => {
            const isExpanded = expandedCategories[kategori] ?? true;
            return (
              <View key={kategori} style={styles.card}>
                <TouchableOpacity
                  style={[styles.kategoriHeader, !isExpanded && { marginBottom: 0 }]}
                  onPress={() => toggleCategory(kategori)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.kategoriTitle}>{kategori}</Text>
                  <Text style={styles.toggleIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded ? groupedBudget[kategori].map((item, index) => {
                  const agihan = parseCurrency(item.agihan);
                  const belanja = parseCurrency(item.belanja);
                  const baki = agihan - belanja;

                  return (
                    <View key={item.id || index} style={styles.budgetItemRow}>
                      <Text style={styles.budgetPerihal}>{item.perihal}</Text>
                      <View style={styles.budgetNumbersRow}>
                        <View style={styles.budgetStat}>
                          <Text style={styles.budgetStatLabel}>Agihan</Text>
                          <Text style={styles.budgetStatValue}>{formatCurrency(agihan)}</Text>
                        </View>
                        <View style={styles.budgetStat}>
                          <Text style={styles.budgetStatLabel}>Belanja</Text>
                          <Text style={[styles.budgetStatValue, { color: belanja > 0 ? '#ea580c' : '#475569' }]}>{formatCurrency(belanja)}</Text>
                        </View>
                        <View style={styles.budgetStat}>
                          <Text style={styles.budgetStatLabel}>Baki</Text>
                          <Text style={[styles.budgetStatValue, { color: '#16a34a' }]}>{formatCurrency(baki)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }) : null}
              </View>
            );
          })}
        </>
      ) : null}

      {/* Prestasi Mengikut Sukuan */}
      {processedBreakdown.length ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Prestasi Mengikut Sukuan</Text>
          {processedBreakdown.map((item, index) => (
            <View key={item.id || index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.quarterTitle}>{item.q}</Text>
                  <Text style={styles.quarterMonths}>{item.months}</Text>
                </View>
                {totalAllocation > 0 ? (
                  <View style={[styles.statusBadge, { backgroundColor: item.barColor + '20' }]}>
                    <Text style={[styles.statusText, { color: item.barColor }]}>{item.statusText}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Belanja (Kumulatif)</Text>
                  <Text style={styles.statsValue}>RM {formatCurrency(parseCurrency(item.spend))}</Text>
                </View>
                {totalAllocation > 0 ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statsLabel}>% drp Peruntukan</Text>
                    <Text style={[styles.statsValue, { color: item.barColor }]}>{item.percentOfTotal.toFixed(2)}%</Text>
                  </View>
                ) : null}
              </View>

              {totalAllocation > 0 ? (
                <>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${Math.min((item.percentOfTotal / 25) * 100, 100)}%`, backgroundColor: item.barColor }]} />
                    <View style={styles.limitLine} />
                  </View>
                  <Text style={styles.limitLabel}>Had Sukuan (25%)</Text>
                </>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { backgroundColor: '#1e40af', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 14, color: '#93c5fd', fontWeight: '600', marginBottom: 4 },
  headerYear: { fontSize: 24, color: '#ffffff', fontWeight: 'bold', marginBottom: 16 },
  totalContainer: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 },
  totalLabel: { color: '#e0f2fe', fontSize: 12, marginBottom: 4 },
  totalAmount: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },

  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 16 },

  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#ffffff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', elevation: 1 },
  kpiTitle: { fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  kpiValue: { fontSize: 14, fontWeight: 'bold' },

  kategoriHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 6, marginBottom: 12 },
  kategoriTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  toggleIcon: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  budgetItemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  budgetPerihal: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  budgetNumbersRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
  budgetStatValue: { fontSize: 12, fontWeight: '600', color: '#334155' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  quarterTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  quarterMonths: { fontSize: 12, color: '#64748b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statsLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  statsValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  progressContainer: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  progressBar: { height: '100%', borderRadius: 6 },
  limitLine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
  limitLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'right', marginTop: 4 },
});
