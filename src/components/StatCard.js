// src/components/StatCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ theme, icon: Icon, iconColor, iconBgColor, value, label, style }) {
  return (
    <View style={[styles.card, { backgroundColor: theme?.card || '#ffffff' }, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
        {/* Safely check if Icon exists before rendering */}
        {Icon ? <Icon size={24} color={iconColor} /> : null}
      </View>
      <View>
        <Text style={[styles.value, { color: theme?.text || '#0f172a' }]}>{value}</Text>
        <Text style={[styles.label, { color: theme?.textSecondary || '#64748b' }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  }
});