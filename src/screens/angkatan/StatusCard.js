import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

const STATUS_ITEMS = [
  { key: 'status_lulus', label: 'Aktif', color: PALETTE.blue, filter: 'AKTIF' },
  { key: 'status_lantikan', label: 'Tidak Aktif', color: PALETTE.orange, filter: 'TIDAK AKTIF' },
  { key: 'status_simpanan', label: 'Simpanan', color: PALETTE.textMutedDark, filter: 'SIMPANAN' },
  { key: 'status_aktif', label: 'Senarai Hitam', color: '#dc2626', filter: 'SENARAI HITAM' },
];

export default function StatusCard({ summary, isEditing, onEdit, onOpenStatus }) {
  return (
    <View style={[styles.card, { flex: 1 }]}>
      {isEditing && (
        <TouchableOpacity style={styles.editBadge} onPress={onEdit}>
          <ShieldCheck size={14} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconBadge}>
          <ShieldCheck size={16} color={PALETTE.orange} />
        </View>
        <Text style={styles.sectionTitle}>STATUS ANGGOTA</Text>
      </View>
      <View style={styles.statusGrid}>
        {STATUS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.statusBox}
            onPress={() => onOpenStatus(item.filter, item.label)}
          >
            <Text style={[styles.statusValue, { color: item.color }]}>{summary[item.key]}</Text>
            <Text style={styles.statusLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}