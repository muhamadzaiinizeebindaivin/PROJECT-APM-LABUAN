import React from 'react';
import { View, Text } from 'react-native';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

export default function SectionHeader({ title, Icon }) {
  return (
    <View style={styles.sectionHeaderRow}>
      {Icon && (
        <View style={styles.sectionIconBadge}>
          <Icon size={16} color="#f97316" />
        </View>
      )}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}