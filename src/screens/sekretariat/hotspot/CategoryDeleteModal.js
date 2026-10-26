// src/screens/sekretariat/hotspot/CategoryDeleteModal.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { hotspotStyles } from './hotspotStyles';

// Confirmation de suppression d'une catégorie
export default function CategoryDeleteModal({ category, deleting, onConfirm, onCancel }) {
  // Garde le libellé affiché pendant l'animation de fermeture
  const displayRef = useRef(null);
  if (category !== null) displayRef.current = category;

  return (
    <Modal visible={category !== null} transparent animationType="fade" onRequestClose={() => !deleting && onCancel()}>
      <View style={hotspotStyles.confirmOverlay}>
        <View style={hotspotStyles.confirmBox}>
          <View style={hotspotStyles.confirmBanner}>
            <View style={hotspotStyles.confirmIconCircle}>
              <AlertTriangle size={26} color="#ef4444" />
            </View>
            <Text style={hotspotStyles.confirmTitle}>Padam Kategori</Text>
            <Text style={hotspotStyles.confirmSubtitle}>
              Padam kategori "{displayRef.current?.label}"? Tindakan ini tidak boleh dibatalkan.
            </Text>
          </View>
          <View style={hotspotStyles.confirmActions}>
            <TouchableOpacity
              style={[hotspotStyles.confirmCancelBtn, deleting && { opacity: 0.5 }]}
              onPress={() => onCancel()}
              disabled={deleting}
            >
              <Text style={hotspotStyles.confirmCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[hotspotStyles.confirmConfirmBtn, deleting && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Trash2 size={16} color="#fff" />
                  <Text style={hotspotStyles.confirmConfirmText}>Padam</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
