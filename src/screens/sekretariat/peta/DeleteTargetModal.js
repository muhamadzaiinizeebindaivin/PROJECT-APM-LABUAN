// src/screens/sekretariat/peta/DeleteTargetModal.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';

// Confirmation de suppression, même style que Peta Kecemasan.
// target : { type: 'bencana' | 'history' | 'agency' | 'pemantauan', id, label }
export default function DeleteTargetModal({ target, deleting, onConfirm, onCancel }) {
  // Garde le texte affiché pendant l'animation de fermeture
  const displayRef = useRef(null);
  if (target) displayRef.current = target;

  return (
    <Modal visible={!!target} transparent animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={{ width: 340, maxWidth: '90%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
          <View style={{ backgroundColor: '#111318', paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: 'rgba(220,38,38,0.15)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <AlertTriangle size={26} color="#ef4444" />
            </View>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 8 }}>
              {displayRef.current?.type === 'bencana' ? 'Padam Rekod Bencana' : displayRef.current?.type === 'agency' ? 'Putuskan Agensi' : displayRef.current?.type === 'pemantauan' ? 'Padam Titik Pemantauan' : 'Padam Rekod Patrol Agensi'}
            </Text>
            <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
              {displayRef.current?.type === 'agency'
                ? `Putuskan agensi "${displayRef.current?.label || '-'}" daripada peta? Mereka perlu log masuk semula dengan kod akses.`
                : `Padam rekod "${displayRef.current?.label || '-'}"? Tindakan ini tidak boleh dibatalkan.`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
            <TouchableOpacity
              disabled={deleting}
              onPress={onCancel}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 12,
                borderWidth: 1, borderColor: '#e2e8f0',
                alignItems: 'center', justifyContent: 'center',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Text style={{ color: '#334155', fontSize: 14, fontWeight: '700' }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={deleting}
              onPress={onConfirm}
              style={{
                flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: 12,
                backgroundColor: '#ef4444',
                alignItems: 'center', justifyContent: 'center',
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Trash2 size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Padam</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
