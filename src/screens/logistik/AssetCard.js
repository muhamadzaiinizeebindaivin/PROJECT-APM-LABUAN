import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ship, Truck, Hash, Pencil, Trash2, AlertTriangle } from 'lucide-react-native';
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

export default function AssetCard({ item, isSea, isEditMode, onView, onEdit, onDelete }) {
  const statusStyle = getStatusStyle(item.status);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={isEditMode ? 1 : 0.7}
      style={[styles.compactAssetCard, { borderColor: statusStyle.dot }]}
      onPress={() => onView(item)}
    >
      <View style={styles.compactAssetHeader}>
        <View style={[styles.compactAssetAvatar, { backgroundColor: isSea ? PALETTE.blueSoft : PALETTE.orangeSoft }]}>
          {isSea ? <Ship size={18} color={PALETTE.blue} /> : <Truck size={18} color={PALETTE.orange} />}
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

      <View style={isSea ? styles.qtyContainer : styles.regContainer}>
        {isSea && <Hash size={11} color="#94a3b8" />}
        <Text style={isSea ? styles.qtyText : styles.regText}>{isSea ? `QTY: ${item.qty}` : item.reg}</Text>
      </View>

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