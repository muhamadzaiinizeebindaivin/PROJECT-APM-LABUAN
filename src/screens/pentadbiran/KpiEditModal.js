import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Trash2, Check } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';

const STATUS_OPTIONS = [
  { key: 'hijau', label: 'Hijau', color: '#16a34a', desc: 'Mencapai/melebihi sasaran' },
  { key: 'kuning', label: 'Kuning', color: '#d97706', desc: 'Perlu perhatian' },
  { key: 'merah', label: 'Merah', color: '#dc2626', desc: 'Kritikal' },
];

const SUB_SEKSYEN_OPTIONS = ['BKP', 'BPP', 'BPM'];

export default function KpiEditModal({ visible, isNew, draft, setDraft, onSave, onDelete, onClose, showSubSeksyen = true }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.kpiModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isNew ? 'Tambah KPI Baru' : 'Ubah KPI'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.kpiModalScroll} contentContainerStyle={styles.modalBody}>
            {/* ── Section: Identiti ── */}
            {showSubSeksyen && <>
            <Text style={styles.kpiSectionLabel}>SUB-SEKSYEN</Text>
            <View style={styles.subSeksyenRow}>
              {SUB_SEKSYEN_OPTIONS.map((opt) => {
                const selected = draft.sub_seksyen === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.subSeksyenChip, selected && styles.subSeksyenChipSelected]}
                    onPress={() => setDraft((prev) => ({ ...prev, sub_seksyen: opt }))}
                  >
                    <Text style={[styles.subSeksyenChipText, selected && styles.subSeksyenChipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            </>}
            

            <Text style={styles.inputLabel}>Nama KPI</Text>
            <TextInput
              style={styles.modalInput}
              value={draft.nama}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, nama: text }))}
              placeholder="cth. Peratus Aduan Diselesaikan"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <Text style={styles.inputLabel}>Tafsiran</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
              value={draft.tafsiran}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, tafsiran: text }))}
              multiline
              placeholder="Penerangan ringkas mengenai KPI ini"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <View style={styles.kpiDivider} />

            {/* ── Section: Prestasi ── */}
            <Text style={styles.kpiSectionLabel}>PRESTASI</Text>
            <View style={styles.kpiFieldRow}>
              <View style={styles.kpiFieldCol}>
                <Text style={styles.inputLabel}>Sasaran</Text>
                <TextInput
                  style={styles.modalInput}
                  value={draft.sasaran}
                  onChangeText={(text) => setDraft((prev) => ({ ...prev, sasaran: text }))}
                  placeholder="cth. 95%"
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </View>
              <View style={styles.kpiFieldCol}>
                <Text style={styles.inputLabel}>Pencapaian Semasa</Text>
                <TextInput
                  style={styles.modalInput}
                  value={draft.pencapaian_semasa}
                  onChangeText={(text) => setDraft((prev) => ({ ...prev, pencapaian_semasa: text }))}
                  placeholder="cth. 88%"
                  placeholderTextColor={PALETTE.textMutedDark}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Analisis / Tindakan</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              value={draft.analisis_tindakan}
              onChangeText={(text) => setDraft((prev) => ({ ...prev, analisis_tindakan: text }))}
              multiline
              placeholder="Sebab pencapaian semasa dan tindakan penambahbaikan"
              placeholderTextColor={PALETTE.textMutedDark}
            />

            <View style={styles.kpiDivider} />

            {/* ── Section: Petunjuk ── */}
            <Text style={styles.kpiSectionLabel}>PETUNJUK</Text>
            <View style={styles.kpiStatusChipRow}>
              {STATUS_OPTIONS.map((opt) => {
                const selected = draft.status === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.kpiStatusChip,
                      selected && { borderColor: opt.color, backgroundColor: `${opt.color}14` },
                    ]}
                    onPress={() => setDraft((prev) => ({ ...prev, status: opt.key }))}
                  >
                    <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                    <Text style={[styles.kpiStatusChipLabel, selected && { color: opt.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.kpiStatusChipDesc}>
              {STATUS_OPTIONS.find((o) => o.key === draft.status)?.desc}
            </Text>
          </ScrollView>

          <View style={styles.kpiModalFooter}>
            {!isNew && (
              <TouchableOpacity style={styles.kpiModalDeleteBtn} onPress={onDelete}>
                <Trash2 size={16} color="#dc2626" />
                <Text style={styles.kpiModalDeleteBtnText}>Padam</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 0 }]}
              onPress={onSave}
            >
              <Check size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}