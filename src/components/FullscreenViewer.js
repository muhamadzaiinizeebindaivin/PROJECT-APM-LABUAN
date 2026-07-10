// src/components/FullscreenViewer.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Maximize2, X } from 'lucide-react-native';

/**
 * Bouton "agrandir" réutilisable : ouvre une modale plein écran affichant
 * `children` (le même contenu que celui affiché normalement, juste dans
 * un espace plus grand). Utilisé pour les tableaux et graphiques dans
 * Operasi et Sekretariat.
 */
export default function FullscreenViewer({ title, children, triggerStyle }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.expandBtn, triggerStyle]}>
        <Maximize2 size={14} color="#1E3A8A" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={() => setVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <X size={22} color="#334155" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {children}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  expandBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  modalContent: { flex: 1, padding: 16 },
});