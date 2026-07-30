import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ship, Truck, Car, Bike, Bus, Siren, Sailboat, Anchor, Waves, Package, Pencil, Trash2, AlertTriangle } from 'lucide-react-native';

const ICON_KEY_MAP = {
  car: Car, lori: Truck, van: Truck, bas: Bus, motor: Bike, ambulans: Siren,
  boat: Ship, sailboat: Sailboat, jetski: Waves, anchor: Anchor,
};
const getAssetIcon = (iconKey) => ICON_KEY_MAP[iconKey] || Package;

const CATEGORY_COLORS = { Darat: { bg: PALETTE.orangeSoft, fg: PALETTE.orange }, Laut: { bg: PALETTE.blueSoft, fg: PALETTE.blue } };
const getCategoryAccent = (category) => CATEGORY_COLORS[category] || { bg: '#ede9fe', fg: '#7c3aed' };
import { PALETTE } from '../../constants/palette';
import { logistikStyles as styles } from './logistikStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Baik': return { bg: '#f0fdf4', dot: '#22c55e', text: '#16a34a', border: '#bbf7d0' };
    case 'Selenggara': return { bg: '#fef3c7', dot: '#f59e0b', text: '#d97706', border: '#fde68a' };
    case 'Rosak': return { bg: '#fef2f2', dot: '#ef4444', text: '#dc2626', border: '#fecaca' };
    default: return { bg: PALETTE.surface, dot: '#94a3b8', text: PALETTE.textMutedDark, border: PALETTE.cardLightBorder };
  }
};

export default function AssetCard({ item, isEditMode, onView, onEdit, onDelete }) {
  const statusStyle = getStatusStyle(item.status);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const AssetIcon = getAssetIcon(item.icon_key);
  const accent = getCategoryAccent(item.category);

  return (
    <TouchableOpacity
      activeOpacity={isEditMode ? 1 : 0.7}
      style={[styles.compactAssetCard, { borderColor: statusStyle.dot }]}
      onPress={() => onView(item)}
    >
      <View style={styles.compactAssetHeader}>
        <View style={[styles.compactAssetAvatar, { backgroundColor: accent.bg }]}>
          <AssetIcon size={18} color={accent.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compactAssetModel} numberOfLines={1}>{item.model}</Text>
          <Text style={styles.compactAssetType} numberOfLines={1}>{item.type}</Text>
        </View>

        {isEditMode && (
          <View style={styles.compactAssetActions}>
            <TouchableOpacity style={styles.kpiPencilBtnInline} onPress={() => onEdit(item)}>
              <Pencil size={12} color={PALETTE.orange} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.kpiDeleteBtnInline} onPress={() => setConfirmDelete(true)}>
              <Trash2 size={12} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.statusPill, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, alignSelf: 'flex-start', marginBottom: 8 }]}>
        <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
      </View>

      {item.reg ? (
        <View style={styles.regContainer}>
          <Text style={styles.regText}>{item.reg}</Text>
        </View>
      ) : null}

      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Aset</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam aset "{item.model}" ini? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDelete(false)}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={pentadbiranStyles.confirmConfirmBtn}
                onPress={() => {
                  setConfirmDelete(false);
                  onDelete(item);
                }}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}