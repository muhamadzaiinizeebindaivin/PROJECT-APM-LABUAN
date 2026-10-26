// src/screens/sekretariat/hotspot/CategoryPills.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Plus, Edit, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';
import { resolveIcon } from './hotspotConstants';

// Scrollbar toujours visible sur web
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('hotspot-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'hotspot-scrollbar-css';
  style.textContent = `
    .hotspot-pills-scroll::-webkit-scrollbar { height: 8px; }
    .hotspot-pills-scroll::-webkit-scrollbar-track { background: #00000010; border-radius: 4px; }
    .hotspot-pills-scroll::-webkit-scrollbar-thumb { background: #F97316; border-radius: 4px; }
    .hotspot-pills-scroll { scrollbar-width: thin; scrollbar-color: #F97316 #00000010; }
  `;
  document.head.appendChild(style);
}

// Onglets de catégorie (pills) + pill "Kategori Baru" en mode édition admin
export default function CategoryPills({ categories, hotspotList, selectedCat, onSelect, canEdit, onEdit, onDelete, onAdd }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={hotspotStyles.pillsScroll}
      contentContainerStyle={hotspotStyles.pillsContent}
      {...(Platform.OS === 'web' ? { className: 'hotspot-pills-scroll' } : {})}
    >
      {categories.map((cat) => {
        const isSelected = cat.key === selectedCat;
        const count = hotspotList.filter((h) => h.category === cat.key).length;
        const IconCmp = resolveIcon(cat);
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              hotspotStyles.pill,
              { borderColor: cat.color },
              isSelected && { backgroundColor: cat.color },
            ]}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.8}
          >
            <IconCmp size={22} color={isSelected ? PALETTE.white : cat.color} />
            <Text style={[hotspotStyles.pillLabel, { color: isSelected ? PALETTE.white : cat.color }]}>
              {cat.label}
            </Text>
            <Text style={[hotspotStyles.pillCount, { color: isSelected ? PALETTE.white : PALETTE.textMutedDark }]}>
              {count} lokasi
            </Text>
            {canEdit ? (
              <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); onEdit(cat); }}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Edit size={12} color={isSelected ? PALETTE.white : cat.color} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); onDelete(cat); }}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {canEdit ? (
        <TouchableOpacity style={hotspotStyles.pillAdd} onPress={onAdd} activeOpacity={0.8}>
          <Plus size={22} color={PALETTE.orange} />
          <Text style={hotspotStyles.pillAddText}>Kategori Baru</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}
