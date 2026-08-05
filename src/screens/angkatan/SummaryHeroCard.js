import React from 'react';
import { View, Text } from 'react-native';
import { angkatanStyles as styles } from './angkatanStyles';

export default function SummaryHeroCard({ total }) {
  return (
    <View style={[styles.heroCard, { flex: 1, justifyContent: 'center' }]}>
      <View style={styles.heroGlow} />
      <Text style={styles.heroValue}>{total}</Text>
      <Text style={styles.heroLabel}>Jumlah Anggota</Text>
    </View>
  );
}