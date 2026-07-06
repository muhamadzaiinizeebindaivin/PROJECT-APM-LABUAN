// src/components/archive/LogistikArchiveView.js
//
// Version "lecture seule" de LogistikScreen.js — reprend les mêmes styles et
// la même structure visuelle (cartes d'aset, badges de statut, StatCard) que
// l'écran original, alimentée par les données archivées d'une sauvegarde.
// Pas de recherche/filtre/CRUD — juste l'affichage.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ship, Truck, Activity, ShieldCheck, Hash } from 'lucide-react-native';
import StatCard from '../StatCard'; // ajuste le chemin si ton StatCard est ailleurs

export default function LogistikArchiveView({ rows = [], theme }) {
  const seaLogistics = rows.filter((item) => item.category === 'Laut');
  const landLogistics = rows.filter((item) => item.category === 'Darat');

  const totalSea = seaLogistics.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const totalLand = landLogistics.length;
  const totalAssets = totalSea + totalLand;

  const activeSea = seaLogistics.reduce((sum, item) => (item.status === 'Baik' ? sum + (Number(item.qty) || 1) : sum), 0);
  const activeLand = landLogistics.filter((item) => item.status === 'Baik').length;
  const totalActive = activeSea + activeLand;

  const readinessPercent = totalAssets > 0 ? Math.round((totalActive / totalAssets) * 100) : 0;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Baik': return { bg: '#f0fdf4', dot: '#22c55e', text: '#16a34a' };
      case 'Selenggara': return { bg: '#fef3c7', dot: '#f59e0b', text: '#d97706' };
      case 'Rosak': return { bg: '#fef2f2', dot: '#ef4444', text: '#dc2626' };
      default: return { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b' };
    }
  };

  const renderAssetCard = (item, isSea) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View key={item.id} style={[styles.itemCard, { backgroundColor: theme?.card || '#fff' }]}>
        <View style={styles.cardMainContent}>
          <View style={[styles.avatarBox, { backgroundColor: isSea ? '#e0f2fe' : '#ffedd5' }]}>
            {isSea ? <Ship size={24} color="#0ea5e9" /> : <Truck size={24} color="#f97316" />}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.modelText, { color: theme?.text || '#0f172a' }]} numberOfLines={1}>{item.model}</Text>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <View style={styles.itemAction}>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
            </View>
            <View style={isSea ? styles.qtyContainer : styles.regContainer}>
              {isSea ? <Hash size={12} color="#94a3b8" /> : null}
              <Text style={isSea ? styles.qtyText : styles.regText}>
                {isSea ? `QTY: ${item.qty}` : item.reg}
              </Text>
            </View>
          </View>
        </View>

        {item.status === 'Selenggara' && item.nota_selenggara ? (
          <View style={styles.notaBox}>
            <Text style={styles.notaLabel}>Catatan Penyelenggaraan</Text>
            <Text style={styles.notaText}>{item.nota_selenggara}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View>
      <View style={styles.row}>
        <StatCard
          theme={theme}
          icon={Activity}
          iconColor="#3b82f6"
          iconBgColor="#eff6ff"
          value={totalAssets}
          label="Total Aset"
        />
        <StatCard
          theme={theme}
          icon={ShieldCheck}
          iconColor={readinessPercent === 100 ? '#22c55e' : '#f59e0b'}
          iconBgColor={readinessPercent === 100 ? '#f0fdf4' : '#fef3c7'}
          value={`${readinessPercent}%`}
          label="Siap Siaga"
        />
      </View>

      {seaLogistics.length ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.text || '#0f172a' }]}>Logistik Laut</Text>
            <Text style={[styles.sectionSubtitle, { color: '#0ea5e9' }]}>{totalSea} Aset</Text>
          </View>
          <View style={styles.listContainer}>
            {seaLogistics.map((item) => renderAssetCard(item, true))}
          </View>
        </View>
      ) : null}

      {landLogistics.length ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.text || '#0f172a' }]}>Logistik Darat</Text>
            <Text style={[styles.sectionSubtitle, { color: '#f97316' }]}>{landLogistics.length} Kenderaan</Text>
          </View>
          <View style={styles.listContainer}>
            {landLogistics.map((item) => renderAssetCard(item, false))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  sectionContainer: { gap: 12, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, fontWeight: '700' },
  listContainer: { gap: 12 },
  itemCard: { padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardMainContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemInfo: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  modelText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  typeText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  itemAction: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  regContainer: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  regText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: '#334155' },
  notaBox: { marginTop: 12, backgroundColor: '#fffbeb', padding: 10, borderRadius: 10 },
  notaLabel: { fontSize: 10, fontWeight: '700', color: '#d97706', marginBottom: 2 },
  notaText: { fontSize: 12, color: '#92400e' },
});
