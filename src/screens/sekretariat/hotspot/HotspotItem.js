// src/screens/sekretariat/hotspot/HotspotItem.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit, Trash2 } from 'lucide-react-native';
import HoverTip from '../../../components/HoverTip';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';

// Une ligne de la liste "Lokasi Hotspot"
export default function HotspotItem({ item, badgeColor, prefixText, canEdit, onEdit, onDelete, onView }) {
  return (
    <View style={hotspotStyles.hotspotCard}>
      <TouchableOpacity
        onPress={() => (canEdit ? onEdit(item) : onView(item))}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
      >
        <View style={[hotspotStyles.hotspotBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor }]}>
          <Text style={[hotspotStyles.hotspotBadgeText, { color: badgeColor }]}>{prefixText} {item.ref_no || '-'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={hotspotStyles.hotspotRiver}>{item.river}</Text>
          <Text style={hotspotStyles.hotspotArea}>{item.area}</Text>
        </View>
      </TouchableOpacity>

      {canEdit ? (
        <View style={hotspotStyles.itemActions}>
          <HoverTip label="Kemaskini titik ini">
            <TouchableOpacity onPress={() => onEdit(item)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
              <Edit size={15} color={PALETTE.orange} />
            </TouchableOpacity>
          </HoverTip>
          <HoverTip label="Padam titik ini">
            <TouchableOpacity onPress={() => onDelete(item.id)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
              <Trash2 size={15} color={PALETTE.danger} />
            </TouchableOpacity>
          </HoverTip>
        </View>
      ) : null}
    </View>
  );
}
