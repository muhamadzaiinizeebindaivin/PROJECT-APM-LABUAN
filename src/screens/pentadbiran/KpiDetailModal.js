import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

const STATUS_LABELS = {
  hijau: { label: 'Hijau', color: '#16a34a', desc: 'Mencapai atau melebihi sasaran.' },
  kuning: { label: 'Kuning', color: '#eab308', desc: 'Memerlukan perhatian / hampir capai sasaran.' },
  merah: { label: 'Merah', color: '#dc2626', desc: 'Di bawah sasaran / kritikal.' },
};

// Ajoute "%" seulement si la valeur est purement numérique — les anciennes valeurs
// en texte libre (ex. "2 hari") gardent déjà leur propre unité, pas de doublon.
const formatPencapaian = (value) => {
  if (!value) return '—';
  return /^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}%` : value;
};

export default function KpiDetailModal({ visible, item, onClose }) {
  if (!item) return null;
  const status = STATUS_LABELS[item.status] || STATUS_LABELS.kuning;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{item.nama}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {!!item.sub_seksyen && (
              <View style={styles.subSeksyenBadge}>
                <Text style={styles.subSeksyenBadgeText}>{item.sub_seksyen}</Text>
              </View>
            )}

            <View style={[styles.kpiDetailStatusRow, { backgroundColor: `${status.color}14`, borderColor: `${status.color}55` }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.kpiDetailStatusLabel, { color: status.color }]}>{status.label}</Text>
                <Text style={styles.kpiDetailStatusDesc}>{status.desc}</Text>
              </View>
            </View>

            <View style={styles.kpiDetailBox}>
              <Text style={styles.inputLabel}>Tafsiran</Text>
              <Text style={styles.kpiDetailText}>{item.tafsiran || '—'}</Text>
            </View>

            <View style={styles.kpiDetailRow}>
              <View style={[styles.kpiDetailBox, styles.kpiDetailCol]}>
                <Text style={styles.inputLabel}>Sasaran</Text>
                <Text style={styles.kpiDetailValue}>{item.sasaran ? `${item.sasaran}%` : '—'}</Text>
              </View>
              <View style={[styles.kpiDetailBox, styles.kpiDetailCol]}>
                <Text style={styles.inputLabel}>Pencapaian Semasa</Text>
                <Text style={styles.kpiDetailValue}>{formatPencapaian(item.pencapaian_semasa)}</Text>
              </View>
            </View>

            <View style={styles.kpiDetailBox}>
              <Text style={styles.inputLabel}>Analisis / Tindakan</Text>
              <Text style={styles.kpiDetailText}>{item.analisis_tindakan || '—'}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}