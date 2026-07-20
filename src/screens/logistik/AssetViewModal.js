import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { X, Ship, Truck, Activity } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { logistikStyles as styles } from './logistikStyles';

const getStatusColor = (status) => {
  switch (status) {
    case 'Baik': return '#16a34a';
    case 'Selenggara': return '#d97706';
    case 'Rosak': return '#dc2626';
    default: return PALETTE.textMutedDark;
  }
};

export default function AssetViewModal({ visible, onClose, asset }) {
  if (!asset) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.modalAvatar, { backgroundColor: asset.category === 'Darat' ? PALETTE.orangeSoft : PALETTE.blueSoft }]}>
                {asset.category === 'Darat' ? <Truck size={20} color={PALETTE.orange} /> : <Ship size={20} color={PALETTE.blue} />}
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>{asset.model}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalTypeText}>{asset.type}</Text>

            {!!asset.reg && (
              <View style={styles.modalRegBadge}>
                <Text style={styles.modalRegText}>{asset.reg}</Text>
              </View>
            )}

            {asset.qty !== null && asset.category === 'Laut' && (
              <View style={styles.modalRegBadge}>
                <Text style={styles.modalRegText}>QTY: {asset.qty}</Text>
              </View>
            )}

            <View style={styles.modalDetailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}><Activity size={16} color={PALETTE.blue} /></View>
                <View>
                  <Text style={styles.detailLabel}>Status Semasa</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(asset.status) }]}>{asset.status}</Text>
                </View>
              </View>

              {asset.status === 'Selenggara' && asset.nota_selenggara && (
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconBox, { backgroundColor: '#fffbeb' }]}><Activity size={16} color="#f59e0b" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Catatan Penyelenggaraan</Text>
                    <Text style={styles.detailValue}>{asset.nota_selenggara}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}