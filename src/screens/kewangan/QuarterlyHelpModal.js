import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { kewanganStyles as styles } from './kewanganStyles';

export default function QuarterlyHelpModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cara Pengiraan Prestasi Sukuan</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={styles.modalBody}>
            <Text style={styles.helpSectionTitle}>1. Belanja Diskret</Text>
            <Text style={styles.helpText}>
              Nilai "Belanja (Kumulatif)" yang anda masukkan adalah jumlah perbelanjaan sejak awal tahun sehingga akhir sukuan tersebut, bukan perbelanjaan sukuan itu sendiri.{'\n\n'}
              Belanja sebenar sukuan ini dikira dengan menolak kumulatif sukuan sebelumnya:{'\n'}
              Belanja Diskret = Kumulatif Sukuan Ini − Kumulatif Sukuan Sebelumnya
            </Text>

            <Text style={styles.helpSectionTitle}>2. Peratus daripada Peruntukan</Text>
            <Text style={styles.helpText}>
              Peratus = (Belanja Diskret ÷ Jumlah Peruntukan Tahunan) × 100{'\n\n'}
              Ini menunjukkan berapa peratus daripada peruntukan tahunan yang telah dibelanjakan oleh sukuan ini sahaja.
            </Text>

            <Text style={styles.helpSectionTitle}>3. Petunjuk Status</Text>
            <Text style={styles.helpText}>
              Setiap sukuan disasarkan membelanjakan lebih kurang 25% daripada peruntukan tahunan (kerana terdapat 4 sukuan setahun):{'\n\n'}
              🔴 Melebihi Had — peratus melebihi 25%{'\n'}
              🟢 Optimum — peratus antara 21.25% hingga 25%{'\n'}
              🟠 Underspend — peratus di bawah 21.25%
            </Text>

            <Text style={styles.helpSectionTitle}>4. Bar Kemajuan</Text>
            <Text style={styles.helpText}>
              Bar diisi mengikut nisbah peratus sukuan ini berbanding had 25%. Bar akan penuh sepenuhnya apabila mencapai 25%, dan kekal penuh (bertukar merah) jika melebihi had tersebut.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}