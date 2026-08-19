import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Edit2, X } from 'lucide-react-native';
import { canEditSection } from '../permissions';

export default function AdminEditButton({ isEditMode, setIsEditMode, userRole, section, label = 'Kemaskini' }) {
  const allowed = section ? canEditSection(userRole, section) : (!userRole || userRole === 'admin');
  if (!allowed) return null;

  const accent = isEditMode ? '#ef4444' : '#f97316';

  return (
    <TouchableOpacity
      style={[styles.adminBtn, { backgroundColor: accent, shadowColor: accent }]}
      onPress={() => setIsEditMode(!isEditMode)}
      activeOpacity={0.85}
    >
      <View style={styles.iconCircle}>
        {isEditMode ? <X size={13} color="#fff" /> : <Edit2 size={13} color="#fff" />}
      </View>
      <Text style={styles.adminBtnText}>
        {isEditMode ? `Tutup ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    paddingLeft: 6,
    borderRadius: 10,
    marginRight: 4,
    gap: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  adminBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});