// src/components/archive/SekretariatArchiveView.js
//
// Version "lecture seule" de SekretariatScreen.js — reprend les mêmes styles,
// les mêmes onglets (Jawatankuasa / Hotspot / Data PPS) et la même structure
// visuelle que l'écran original, alimentée par les données archivées d'une
// sauvegarde. Pas de CRUD, pas de modals.
//
// Note : les images de carte (map_banjir.png, map_landslide.png) de l'écran
// original sont des assets statiques, pas des données archivées — elles ne
// sont pas reprises ici.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Briefcase, AlertTriangle, Home, Droplets, Mountain, Users, AlertCircle } from 'lucide-react-native';

const HOTSPOT_CONFIG = {
  banjir: { bg: '#eff6ff', border: '#3b82f6', title: '#1e3a8a', icon: Droplets, iconColor: '#2563eb', label: 'HOTSPOT BANJIR', sub: 'Kawasan berisiko banjir', badge: '#2563eb', prefix: 'NO.' },
  pantai: { bg: '#fef3c7', border: '#f59e0b', title: '#92400e', icon: Droplets, iconColor: '#d97706', label: 'HOTSPOT PANTAI', sub: 'Kawasan hakisan pantai / ombak besar', badge: '#f59e0b', prefix: 'ID' },
  cerun: { bg: '#fff7ed', border: '#f97316', title: '#9a3412', icon: Mountain, iconColor: '#ea580c', label: 'HOTSPOT TANAH RUNTUH', sub: 'Cerun Kritikal & Berisiko', badge: '#ea580c', prefix: 'ID' },
};

export default function SekretariatArchiveView({ jpbdList = [], hotspotList = [], ppsList = [] }) {
  const [activeTab, setActiveTab] = useState('JPBD');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const ppsStats = (() => {
    const stats = { 'Dewan': { qty: 0, capacity: 0 }, 'Sekolah/Kolej': { qty: 0, capacity: 0 }, 'Balairaya': { qty: 0, capacity: 0 }, 'Lain-Lain': { qty: 0, capacity: 0 } };
    ppsList.forEach((item) => {
      const type = stats[item.type] ? item.type : 'Lain-Lain';
      stats[type].qty += 1;
      stats[type].capacity += parseInt(item.capacity) || 0;
    });
    const total = Object.values(stats).reduce((acc, s) => ({ qty: acc.qty + s.qty, capacity: acc.capacity + s.capacity }), { qty: 0, capacity: 0 });
    return [
      { type: 'Dewan', ...stats['Dewan'] }, { type: 'Sekolah/Kolej', ...stats['Sekolah/Kolej'] },
      { type: 'Balairaya', ...stats['Balairaya'] }, { type: 'Lain-Lain', ...stats['Lain-Lain'] },
      { type: 'TOTAL', ...total },
    ];
  })();

  const renderJPBD = () => (
    <View>
      <Text style={styles.sectionHeaderTitle}>Direktori Agensi (JPBD)</Text>
      {jpbdList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod dijumpai.</Text>
      ) : (
        jpbdList.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity style={styles.header} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agencyName}>{index + 1}. {item.agency}</Text>
                  {item.officer ? <Text style={styles.officerName}>{item.officer}</Text> : null}
                </View>
                <Briefcase size={20} color="#1E3A8A" />
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.body}>
                  <Text style={styles.label}>Jawatan: <Text style={styles.value}>{item.position || '-'}</Text></Text>
                  <Text style={styles.label}>Email: <Text style={styles.value}>{item.email || '-'}</Text></Text>
                  <Text style={styles.label}>Gred: <Text style={styles.value}>{item.grade || '-'}</Text></Text>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Hubungan & Logistik</Text>
                  <Text style={styles.label}>Alamat: <Text style={styles.value}>{item.address || '-'}</Text></Text>
                  <View style={styles.row}>
                    <View style={styles.halfCol}><Text style={styles.label}>Tel (Pejabat):</Text><Text style={styles.value}>{item.office_phone || '-'}</Text></View>
                    <View style={styles.halfCol}><Text style={styles.label}>Tel (Bimbit):</Text><Text style={styles.value}>{item.mobile_phone || '-'}</Text></View>
                  </View>
                  <Text style={[styles.label, { marginTop: 4 }]}>Fax: <Text style={styles.value}>{item.fax || '-'}</Text></Text>

                  {(item.officers_count || item.members_count) ? (
                    <>
                      <View style={[styles.divider, { marginVertical: 8 }]} />
                      <Text style={styles.subTitle}>Kekuatan Anggota</Text>
                      <View style={styles.row}>
                        <View style={styles.halfCol}><Text style={styles.statLabel}>Pegawai</Text><Text style={styles.statValue2}>{item.officers_count || '0'}</Text></View>
                        <View style={styles.halfCol}><Text style={styles.statLabel}>Anggota</Text><Text style={styles.statValue2}>{item.members_count || '0'}</Text></View>
                      </View>
                    </>
                  ) : null}

                  {item.logistics_assets ? (
                    <View style={styles.logisticsBox}>
                      <Text style={styles.subTitle}>Logistik & Aset:</Text>
                      <Text style={styles.logItem}>{item.logistics_assets}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );

  const renderHotspot = () => {
    const byCategory = { banjir: [], pantai: [], cerun: [] };
    hotspotList.forEach((h) => {
      if (byCategory[h.category]) byCategory[h.category].push(h);
    });

    return (
      <View>
        <Text style={styles.sectionHeaderTitle}>Senarai Hotspot Bencana</Text>
        {hotspotList.length === 0 ? (
          <Text style={styles.emptyText}>Tiada data hotspot dijumpai.</Text>
        ) : (
          ['banjir', 'pantai', 'cerun'].map((cat) => {
            const items = byCategory[cat];
            if (!items.length) return null;
            const cfg = HOTSPOT_CONFIG[cat];
            const Icon = cfg.icon;
            return (
              <View key={cat} style={{ marginTop: 10 }}>
                <View style={[styles.hotspotHeader, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Icon size={22} color={cfg.iconColor} />
                  <View>
                    <Text style={[styles.hotspotTitle, { color: cfg.title }]}>{cfg.label}</Text>
                    <Text style={styles.hotspotSub}>{cfg.sub}</Text>
                  </View>
                </View>
                {items.map((item) => (
                  <View key={item.id} style={styles.hotspotCard}>
                    <View style={[styles.hotspotBadge, { backgroundColor: cfg.badge }]}>
                      <Text style={styles.hotspotBadgeText}>{cfg.prefix} {item.ref_no || '-'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hotspotRiver}>{item.river}</Text>
                      <Text style={styles.hotspotArea}>{item.area}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </View>
    );
  };

  const renderPPS = () => (
    <View>
      <View style={styles.statsGrid}>
        {ppsStats.map((stat, index) => (
          <View key={index} style={[styles.statCard, stat.type === 'TOTAL' ? styles.statCardTotal : null]}>
            <Text style={[styles.statLabel, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.type}</Text>
            <Text style={[styles.statValue, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.qty}</Text>
            <Text style={[styles.statSub, stat.type === 'TOTAL' ? { color: '#bfdbfe' } : null]}>{stat.capacity} pax</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>Senarai & Status PPS</Text>
      {ppsList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada data PPS dijumpai.</Text>
      ) : (
        ppsList.map((pps) => (
          <View key={pps.id} style={styles.ppsCard}>
            <View style={styles.ppsHeader}>
              <View style={[styles.ppsIconBox, pps.status !== 'OK' && { backgroundColor: '#ef4444' }]}>
                <Home size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ppsName}>{pps.name}</Text>
                <View style={styles.ppsTags}>
                  <View style={styles.tagZone}><Text style={styles.tagText}>Zon {pps.zone || '-'}</Text></View>
                  <View style={styles.tagCap}><Text style={styles.tagText}>{pps.capacity} Pax</Text></View>
                  <View style={styles.tagType}><Text style={styles.tagText}>{pps.type}</Text></View>
                </View>
              </View>
            </View>
            {pps.status !== 'OK' ? (
              <View style={styles.alertBox}>
                <AlertCircle size={16} color="#ef4444" />
                <Text style={styles.alertText}>{pps.status}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'JPBD' ? styles.tabActive : null]} onPress={() => setActiveTab('JPBD')}>
          <Users size={16} color={activeTab === 'JPBD' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'JPBD' ? styles.tabTextActive : null]}>Jawatankuasa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'HOTSPOT' ? styles.tabActive : null]} onPress={() => setActiveTab('HOTSPOT')}>
          <AlertTriangle size={16} color={activeTab === 'HOTSPOT' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'HOTSPOT' ? styles.tabTextActive : null]}>Hotspot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'PPS' ? styles.tabActive : null]} onPress={() => setActiveTab('PPS')}>
          <Home size={16} color={activeTab === 'PPS' ? '#f97316' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'PPS' ? styles.tabTextActive : null]}>Data PPS</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'JPBD' ? renderJPBD() : null}
      {activeTab === 'HOTSPOT' ? renderHotspot() : null}
      {activeTab === 'PPS' ? renderPPS() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#f97316', backgroundColor: '#fff7ed' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  tabTextActive: { color: '#f97316', fontWeight: '800' },

  sectionHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontStyle: 'italic' },

  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  agencyName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  officerName: { fontSize: 12, color: '#64748b', marginTop: 3 },
  body: { padding: 14, paddingTop: 0, backgroundColor: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#1E3A8A', marginTop: 10, marginBottom: 6, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 8 },
  label: { fontSize: 11, color: '#64748b', marginBottom: 3 },
  value: { color: '#334155', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  halfCol: { width: '48%' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  statValue2: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', textAlign: 'center' },
  logisticsBox: { backgroundColor: '#e0f2fe', padding: 8, borderRadius: 8, marginTop: 8 },
  subTitle: { fontSize: 11, fontWeight: '700', color: '#0284c7', marginBottom: 3 },
  logItem: { fontSize: 11, color: '#0369a1' },

  hotspotHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 10 },
  hotspotTitle: { fontSize: 14, fontWeight: '800' },
  hotspotSub: { fontSize: 11, color: '#64748b' },
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  hotspotBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  hotspotBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  hotspotRiver: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 13, color: '#1e293b', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statCardTotal: { width: '100%', backgroundColor: '#2563eb', borderColor: '#2563eb' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginVertical: 3 },
  statSub: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  ppsCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  ppsHeader: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'center' },
  ppsIconBox: { width: 36, height: 36, backgroundColor: '#22c55e', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  ppsName: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 5 },
  ppsTags: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tagZone: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagCap: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagType: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: '700', color: '#475569' },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 8, gap: 6, borderTopWidth: 1, borderTopColor: '#fee2e2' },
  alertText: { fontSize: 10, color: '#ef4444', fontWeight: '700', flex: 1 },
});
