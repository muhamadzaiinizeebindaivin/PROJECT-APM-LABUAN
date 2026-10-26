// src/screens/sekretariat/peta/BencanaChoiceModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { X, MapPin, PlusCircle, Droplets } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

// Étape 1 du "+" de la carte : hotspot existant, nouveau point, ou titik pemantauan
export default function BencanaChoiceModal({ visible, onClose, onPickExisting, onPickNew, onPickPemantauan }) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <Text style={sekretariatStyles.modalTitle}>Tambah Titik Bencana</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <View style={[sekretariatStyles.modalForm, { gap: 12 }]}>
            <TouchableOpacity
              onPress={onPickExisting}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.orange, backgroundColor: '#fff7ed',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.orange, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark }}>Pilih Hotspot Sedia Ada</Text>
                <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 }}>Titik diletakkan terus pada lokasi hotspot</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPickNew}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder || '#e2e8f0', backgroundColor: '#fff',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.surface || '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <PlusCircle size={20} color={PALETTE.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark }}>Hotspot Baharu</Text>
                <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 }}>Cari tempat, masukkan koordinat atau klik pada peta</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPickPemantauan}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder || '#e2e8f0', backgroundColor: '#fff',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.surface || '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={20} color={PALETTE.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark }}>Tambah Titik Pemantauan</Text>
                <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 }}>Laporan awal pemantauan hotspot banjir</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
