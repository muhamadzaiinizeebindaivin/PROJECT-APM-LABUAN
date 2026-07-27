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
            <Text style={styles.helpSectionTitle}>1. Belanja Sukuan</Text>
            <Text style={styles.helpText}>
              Nilai "Belanja" yang anda masukkan adalah jumlah perbelanjaan bagi sukuan itu sahaja (bukan kumulatif) — masukkan terus jumlah yang dibelanjakan dalam tempoh sukuan berkenaan.
            </Text>

            <Text style={styles.helpSectionTitle}>2. Peratus daripada Peruntukan</Text>
            <Text style={styles.helpText}>
              Peratus = (Belanja Sukuan ÷ Jumlah Peruntukan Tahunan) × 100{'\n\n'}
              Ini menunjukkan berapa peratus daripada peruntukan tahunan yang telah dibelanjakan oleh sukuan ini sahaja.
            </Text>

            <Text style={styles.helpSectionTitle}>3. Had Mengikut Sukuan</Text>
            <Text style={styles.helpText}>
              Setiap sukuan mempunyai had kumulatif tersendiri mengikut kedudukannya dalam tahun:{'\n\n'}
              Sukuan 1 — Had 25%{'\n'}
              Sukuan 2 — Had 50%{'\n'}
              Sukuan 3 — Had 75%{'\n'}
              Sukuan 4 — Had 100%
            </Text>

            <Text style={styles.helpSectionTitle}>4. Petunjuk Status</Text>
            <Text style={styles.helpText}>
              Status dikira berbanding had sukuan berkenaan:{'\n\n'}
              🔴 Melebihi Had — peratus melebihi had sukuan tersebut{'\n'}
              🟢 Optimum — peratus antara 85% hingga 100% daripada had sukuan tersebut{'\n'}
              🟠 Underspend — peratus di bawah 85% daripada had sukuan tersebut
            </Text>

            <Text style={styles.helpSectionTitle}>5. Dua Bar Kemajuan</Text>
            <Text style={styles.helpText}>
              Bar pertama menunjukkan belanja sukuan ini sahaja berbanding had sukuan tersebut.{'\n\n'}
              Bar kedua ("% Kumulatif") menunjukkan jumlah keseluruhan belanja sejak Sukuan 1 hingga sukuan ini (dijumlahkan), juga dibandingkan dengan had yang sama. Ini memberi gambaran sebenar sama ada perbelanjaan keseluruhan tahun setakat ini berada di landasan yang betul.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}