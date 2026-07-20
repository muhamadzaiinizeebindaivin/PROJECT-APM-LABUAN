import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { angkatanStyles as styles } from './angkatanStyles';

export default function CategoriesCard({ categories, isEditing, onAdd, onEdit, onDelete, onOpenCategory }) {
  return (
    <View style={[styles.card, { flex: 1 }]}>
      <View style={styles.sectionHeaderRowSpaced}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <Layers size={16} color={PALETTE.orange} />
          </View>
          <Text style={styles.sectionTitle}>PENJAWATAN UTAMA</Text>
        </View>
        {isEditing && (
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={onAdd}>
            <Plus size={20} color={PALETTE.orange} />
          </TouchableOpacity>
        )}
      </View>

      {categories.map((cat, index) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.listItem, index === categories.length - 1 && styles.listItemLast]}
          onPress={() => onOpenCategory(cat.name)}
        >
          <View style={[styles.dot, { backgroundColor: cat.color }]} />
          <Text style={styles.listItemLabel}>{cat.name}</Text>
          <Text style={styles.listItemValue}>{cat.count}</Text>
          {isEditing && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onEdit(cat); }}>
                <Pencil size={15} color={PALETTE.orange} />
              </TouchableOpacity>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onDelete(cat.id); }}>
                <Trash2 size={15} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}