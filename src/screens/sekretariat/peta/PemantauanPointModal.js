// src/screens/sekretariat/peta/PemantauanPointModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { appStyles as sekretariatStyles } from '../../../styles/appStyles';
import { PALETTE } from '../../../constants/palette';

// Titik Pemantauan — Laporan Awal Pemantauan Hotspot Banjir.
// mode 'create' : nouveau point à `placement` ; 'edit' / 'complete' : `point` existant.
export default function PemantauanPointModal({
  visible, mode, point, placement,
  savePemantauanPoint, updatePemantauanPoint, completePemantauanPoint, onClose,
}) {
  const [pemantauanLokasi, setPemantauanLokasi] = useState('');
  const [pemantauanJumlahRumah, setPemantauanJumlahRumah] = useState('');
  const [pemantauanPps, setPemantauanPps] = useState('');
  const [pemantauanAgensi, setPemantauanAgensi] = useState('');
  const [pemantauanBacaanAir, setPemantauanBacaanAir] = useState('');
  const [savingPemantauanPoint, setSavingPemantauanPoint] = useState(false);

  // À l'ouverture : champs pré-remplis depuis le point (edit/complete) ou vides (create)
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setPemantauanLokasi(point?.lokasi || '');
      setPemantauanJumlahRumah(point?.jumlah_rumah_terjejas != null ? String(point.jumlah_rumah_terjejas) : '');
      setPemantauanPps(point?.pps || '');
      setPemantauanAgensi(point?.agensi_di_lapangan || '');
      setPemantauanBacaanAir(point?.bacaan_air || '');
    }
  }

  const handleSavePemantauanPoint = async () => {
    setSavingPemantauanPoint(true);
    const fields = {
      lokasi: pemantauanLokasi,
      jumlah_rumah_terjejas: pemantauanJumlahRumah,
      pps: pemantauanPps,
      agensi_di_lapangan: pemantauanAgensi,
      bacaan_air: pemantauanBacaanAir,
    };
    let result;
    if (mode === 'edit') {
      result = await updatePemantauanPoint(point.id, fields);
    } else if (mode === 'complete') {
      result = await completePemantauanPoint(point.id, fields);
    } else {
      if (!placement) { setSavingPemantauanPoint(false); return; }
      result = await savePemantauanPoint({ ...fields, latitude: placement.lat, longitude: placement.lng });
    }
    setSavingPemantauanPoint(false);
    if (!result.error) onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={sekretariatStyles.modalOverlay}>
        <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%' }]}>
          <View style={sekretariatStyles.modalHeader}>
            <Text style={sekretariatStyles.modalTitle}>
              {mode === 'edit' ? 'Kemaskini Titik Pemantauan' : mode === 'complete' ? 'Selesaikan Titik Pemantauan' : 'Titik Pemantauan'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={PALETTE.textMutedDark} />
            </TouchableOpacity>
          </View>
          <View style={sekretariatStyles.modalForm}>
            <Text style={sekretariatStyles.inputLabel}>Lokasi</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: Simpang Bunga Ros, Kg Sungai Miri"
              placeholderTextColor={PALETTE.textMutedDark}
              value={pemantauanLokasi}
              onChangeText={setPemantauanLokasi}
            />
            <Text style={sekretariatStyles.inputLabel}>Jumlah Rumah Terjejas</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="0"
              placeholderTextColor={PALETTE.textMutedDark}
              keyboardType="numeric"
              value={pemantauanJumlahRumah}
              onChangeText={(t) => setPemantauanJumlahRumah(t.replace(/[^0-9]/g, ''))}
            />
            <Text style={sekretariatStyles.inputLabel}>PPS</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: TIADA"
              placeholderTextColor={PALETTE.textMutedDark}
              value={pemantauanPps}
              onChangeText={setPemantauanPps}
            />
            <Text style={sekretariatStyles.inputLabel}>Agensi di Lapangan</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: APM"
              placeholderTextColor={PALETTE.textMutedDark}
              value={pemantauanAgensi}
              onChangeText={setPemantauanAgensi}
            />
            <Text style={sekretariatStyles.inputLabel}>Bacaan Air</Text>
            <TextInput
              style={sekretariatStyles.input}
              placeholder="Cth: 1.5m"
              placeholderTextColor={PALETTE.textMutedDark}
              value={pemantauanBacaanAir}
              onChangeText={setPemantauanBacaanAir}
            />
            <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleSavePemantauanPoint} disabled={savingPemantauanPoint}>
              {savingPemantauanPoint ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text style={sekretariatStyles.saveButtonText}>
                  {mode === 'edit' ? 'Simpan Perubahan' : mode === 'complete' ? 'Simpan & Tandakan Selesai' : 'Selesai'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
