// src/screens/operasi/VehicleCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VehicleCard({ name, status, icon, theme }) {
  return (
    <View style={[styles.vehicleCard, { backgroundColor: theme.card }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, maxWidth: 120 }} numberOfLines={1}>{name}</Text>
          <Text style={{ fontSize: 10, color: theme.textSecondary }}>{status}</Text>
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  vehicleCard: { padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 180 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
});