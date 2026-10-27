// src/screens/jawatankuasa/Card.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CMD } from './commandPalette';

// Cadre commun des blocs du tableau de bord (titre + sous-titre + contenu)
export default function Card({ title, subtitle, right, children, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, backgroundColor: CMD.card, borderRadius: 18, borderWidth: 1, borderColor: CMD.cardBorder, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  title: { color: CMD.text, fontSize: 15, fontWeight: '800' },
  subtitle: { color: CMD.textMuted, fontSize: 11, marginTop: 2 },
});
