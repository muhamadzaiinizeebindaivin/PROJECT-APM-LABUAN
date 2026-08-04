import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users2, Edit2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function GenderCard({ summary, isEditing, onEdit, fill = true }) {
  const total = (summary.male_count || 0) + (summary.female_count || 0);
  // Largeurs des barres calculées proportionnellement au total réel (au lieu de valeurs fixes)
  const malePercent = total > 0 ? Math.round((summary.male_count / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((summary.female_count / total) * 100) : 0;

  return (
    <View style={[styles.card, fill && { flex: 1 }]}>
      {isEditing && (
        <TouchableOpacity style={styles.editBadge} onPress={onEdit}>
          <Edit2 size={14} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconBadge}>
          <Users2 size={16} color={PALETTE.orange} />
        </View>
        <Text style={styles.sectionTitle}>TABURAN JANTINA</Text>
      </View>

      <View style={styles.genderContainer}>
        <View style={styles.genderRow}>
          <View style={styles.genderIconCircle}>
            <Users2 size={22} color={PALETTE.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.genderHeader}>
              <Text style={styles.genderLabel}>Lelaki</Text>
              <Text style={styles.genderValue}>{summary.male_count}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${malePercent}%`, backgroundColor: PALETTE.blue }]} />
            </View>
          </View>
        </View>

        <View style={styles.genderRow}>
          <View style={[styles.genderIconCircle, { backgroundColor: '#fee2e2' }]}>
            <Users2 size={22} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.genderHeader}>
              <Text style={styles.genderLabel}>Wanita</Text>
              <Text style={styles.genderValue}>{summary.female_count}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${femalePercent}%`, backgroundColor: '#dc2626' }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}