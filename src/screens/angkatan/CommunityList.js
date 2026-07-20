import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Pencil, Trash2, HeartHandshake } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CommunityList({ communityProgs, isEditing, onAdd, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <HeartHandshake size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>PROGRAM KOMUNITI (PASUKAN APM)</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={onAdd}>
            <Plus size={20} color={PALETTE.orange} />
          </TouchableOpacity>
        )}
      </View>

      {communityProgs.map((prog, index) => (
        <View key={prog.id} style={[styles.communityItem, index === communityProgs.length - 1 && styles.communityItemLast]}>
          <View style={[styles.programBadge, { backgroundColor: prog.color }]}>
            <Text style={styles.programBadgeText}>{prog.category}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.communityLabel}>{prog.label}</Text>
            <Text style={styles.communityDetail}>{prog.detail}</Text>
          </View>
          {isEditing && (
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={() => onEdit(prog)}>
                <Pencil size={16} color={PALETTE.orange} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(prog.id)}>
                <Trash2 size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}