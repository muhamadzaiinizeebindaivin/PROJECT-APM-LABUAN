import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Pencil, TrendingUp } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function PyramidChart({ pyramidStats, isEditing, onAdd, onEdit }) {
  const maxTotal = Math.max(1, ...pyramidStats.map((p) => p.total || 0));
  const maxLog = Math.log(maxTotal + 1);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <TrendingUp size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>STRUKTUR PANGKAT & KEAHLIAN</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={onAdd}>
            <Plus size={20} color={PALETTE.orange} />
          </TouchableOpacity>
        )}
      </View>

      {pyramidStats.map((item) => {
        const val = item.total || 0;
        const barWidthPercent = maxLog > 0 ? (Math.log(val + 1) / maxLog) * 100 : 0;
        return (
          <TouchableOpacity
            key={item.id}
            disabled={!isEditing}
            onPress={() => onEdit(item)}
            style={styles.pyramidRow}
          >
            <Text style={styles.pyramidLabel} numberOfLines={1}>{item.rank}</Text>
            <View style={styles.pyramidBarBg}>
              {val > 0 && (
                <View style={[styles.pyramidBarFill, { width: `${Math.max(barWidthPercent, 2)}%`, backgroundColor: item.color }]} />
              )}
            </View>
            <Text style={styles.pyramidValue}>{val}</Text>
            {isEditing && <Pencil size={12} color={PALETTE.textMutedDark} style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}