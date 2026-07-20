import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import { angkatanStyles as styles } from './angkatanStyles';

export default function SummaryHeroCard({ total, isEditing, onEdit }) {
  return (
    <View style={[styles.heroCard, { flex: 1, justifyContent: 'center' }]}>
      <View style={styles.heroGlow} />
      {isEditing && (
        <TouchableOpacity style={styles.editBadge} onPress={onEdit}>
          <Edit2 size={14} color="#fff" />
        </TouchableOpacity>
      )}
      <Text style={styles.heroValue}>{total}</Text>
      <Text style={styles.heroLabel}>Jumlah Anggota</Text>
    </View>
  );
}