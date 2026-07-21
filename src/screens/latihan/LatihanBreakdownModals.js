// src/screens/latihan/LatihanBreakdownModals.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { statusMeta } from './latihanConstants';
import { sharedStyles as shared } from '../sekretariat/sharedStyles';
import { latihanStyles as styles } from './latihanStyles';

export function PesertaModal({ visible, onClose, latihanList, totalPax }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={shared.modalOverlay}>
        <View style={[shared.modalContainer, { maxHeight: '70%' }]}>
          <View style={shared.modalHeader}>
            <Text style={shared.modalTitle}>Pecahan Peserta</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
            {latihanList.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <Text style={styles.breakdownTitle}>{item.title}</Text>
                <Text style={styles.breakdownPax}>{item.pax} Pax</Text>
              </View>
            ))}
            <View style={styles.breakdownTotalRow}>
              <Text style={styles.breakdownTotalLabel}>Jumlah Keseluruhan</Text>
              <Text style={styles.breakdownTotalValue}>{totalPax} Pax</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function PrestasiModal({ visible, onClose, latihanList }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={shared.modalOverlay}>
        <View style={[shared.modalContainer, { maxHeight: '70%' }]}>
          <View style={shared.modalHeader}>
            <Text style={shared.modalTitle}>Status Keseluruhan</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={shared.modalForm} showsVerticalScrollIndicator={false}>
            {latihanList.map((item) => {
              const meta = statusMeta(item.status);
              return (
                <View key={item.id} style={styles.listItem}>
                  <Text style={styles.breakdownTitle}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: meta.color, fontWeight: '700' }}>{item.status}</Text>
                    <meta.Icon size={14} color={meta.color} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}