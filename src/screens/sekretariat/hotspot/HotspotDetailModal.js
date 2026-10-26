// src/screens/sekretariat/hotspot/HotspotDetailModal.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, MapPin, Home, Globe } from 'lucide-react-native';
import { appStyles as styles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';
import { hotspotStyles } from './hotspotStyles';

// Fiche en lecture seule d'un point hotspot
export default function HotspotDetailModal({ item, categories, onClose }) {
  // Garde le dernier élément affiché pendant l'animation de fermeture
  const displayRef = useRef(null);
  if (item) displayRef.current = item;

  return (
    <Modal visible={!!item} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 640 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Butiran Hotspot</Text>
            <TouchableOpacity onPress={() => onClose()}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            <View style={hotspotStyles.detailCatChip}>
              <View style={[hotspotStyles.detailCatDot, { backgroundColor: categories.find(c => c.key === displayRef.current?.category)?.color || PALETTE.orange }]} />
              <Text style={[hotspotStyles.detailCatChipText, { color: categories.find(c => c.key === displayRef.current?.category)?.color || PALETTE.orange }]}>
                {categories.find(c => c.key === displayRef.current?.category)?.label || displayRef.current?.category}
              </Text>
              <Text style={hotspotStyles.detailRefChipText}>#{displayRef.current?.ref_no || '-'}</Text>
            </View>

            <View style={hotspotStyles.detailRow}>
              <View style={hotspotStyles.detailIconBox}><MapPin size={16} color={PALETTE.orange} /></View>
              <View style={{ flex: 1 }}>
                <Text style={hotspotStyles.detailLabel}>Lokasi Utama</Text>
                <Text style={hotspotStyles.detailValue}>{displayRef.current?.river || '-'}</Text>
              </View>
            </View>

            <View style={hotspotStyles.detailRow}>
              <View style={hotspotStyles.detailIconBox}><Home size={16} color={PALETTE.orange} /></View>
              <View style={{ flex: 1 }}>
                <Text style={hotspotStyles.detailLabel}>Kawasan Terjejas</Text>
                <Text style={hotspotStyles.detailValue}>{displayRef.current?.area || '-'}</Text>
              </View>
            </View>

            <View style={hotspotStyles.coordRow}>
              <View style={hotspotStyles.coordBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Globe size={13} color={PALETTE.textMutedDark} />
                  <Text style={hotspotStyles.detailLabel}>Latitud</Text>
                </View>
                <Text style={hotspotStyles.detailValue}>{displayRef.current?.latitude != null ? String(displayRef.current.latitude) : '-'}</Text>
              </View>
              <View style={hotspotStyles.coordBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Globe size={13} color={PALETTE.textMutedDark} />
                  <Text style={hotspotStyles.detailLabel}>Longitud</Text>
                </View>
                <Text style={hotspotStyles.detailValue}>{displayRef.current?.longitude != null ? String(displayRef.current.longitude) : '-'}</Text>
              </View>
            </View>

            <View style={{ height: 10 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
