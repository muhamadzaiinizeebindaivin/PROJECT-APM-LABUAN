// src/screens/KPISection.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Truck, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

const kpiData = [
  {
    id: 1,
    label: 'Jumlah Misi',
    value: '24',
    trend: '+12%',
    trendType: 'up',
    icon: Truck,
    color: '#f97316',
  },
  {
    id: 2,
    label: 'Kadar Ketersediaan',
    value: '87%',
    trend: '-2%',
    trendType: 'down',
    icon: Clock,
    color: '#3b82f6',
  },
  {
    id: 3,
    label: 'Amaran Aktif',
    value: '3',
    trend: 'Tiada perubahan',
    trendType: 'neutral',
    icon: AlertTriangle,
    color: '#ef4444',
  },
];

function TrendIcon({ type }) {
  if (type === 'up') return <TrendingUp color="#22c55e" size={14} />;
  if (type === 'down') return <TrendingDown color="#ef4444" size={14} />;
  return <Minus color="#94a3b8" size={14} />;
}

function KPICard({ item, theme }) {
  const Icon = item.icon;
  const trendColor =
    item.trendType === 'up' ? '#22c55e' :
    item.trendType === 'down' ? '#ef4444' : '#94a3b8';

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme?.card || '#ffffff', borderColor: theme?.border || '#e2e8f0' }
    ]}>
      <View style={[styles.iconCircle, { backgroundColor: `${item.color}1A` }]}>
        <Icon color={item.color} size={22} strokeWidth={2.5} />
      </View>

      <Text style={[styles.value, { color: theme?.text || '#0f172a' }]}>
        {item.value}
      </Text>

      <Text style={[styles.label, { color: theme?.textSecondary || '#64748b' }]}>
        {item.label}
      </Text>

      <View style={styles.trendRow}>
        <TrendIcon type={item.trendType} />
        <Text style={[styles.trendText, { color: trendColor }]}>{item.trend}</Text>
      </View>
    </View>
  );
}

export default function KPISection({ theme }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme?.text || '#0f172a' }]}>
        Petunjuk Prestasi Utama (KPI)
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {kpiData.map((item) => (
          <KPICard key={item.id} item={item} theme={theme} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20, marginBottom: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  card: {
    width: 160,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginRight: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, fontWeight: '700' },
});