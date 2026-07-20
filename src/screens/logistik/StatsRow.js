import React from 'react';
import { View, Text } from 'react-native';
import { Activity, ShieldCheck } from 'lucide-react-native';
import { logistikStyles as styles } from './logistikStyles';

export default function StatsRow({ totalAssets, readinessPercent }) {
  const readinessColor = readinessPercent === 100 ? '#22c55e' : '#f97316';

  return (
    <View style={styles.row}>
      <View style={styles.statHeroCard}>
        <View style={styles.statHeroGlow} />
        <View style={[styles.statHeroIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
          <Activity size={20} color="#3b82f6" />
        </View>
        <Text style={styles.statHeroValue}>{totalAssets}</Text>
        <Text style={styles.statHeroLabel}>Total Aset</Text>
      </View>

      <View style={styles.statHeroCard}>
        <View style={styles.statHeroGlow} />
        <View style={[styles.statHeroIconBox, { backgroundColor: `${readinessColor}30` }]}>
          <ShieldCheck size={20} color={readinessColor} />
        </View>
        <Text style={styles.statHeroValue}>{readinessPercent}%</Text>
        <Text style={styles.statHeroLabel}>Siap Siaga</Text>
      </View>
    </View>
  );
}