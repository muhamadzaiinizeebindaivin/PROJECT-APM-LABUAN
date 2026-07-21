// src/screens/sekretariat/PpsSection.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Home, AlertCircle, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { usePpsList } from '../../hooks/usePpsList';
import { sharedStyles as styles } from './sharedStyles';
import { PALETTE } from '../../constants/palette';

export default function PpsSection({ userRole, isEditMode }) {
  const {
    ppsList, ppsStats, loadingPPS,
    modalPpsVisible, setModalPpsVisible,
    formModePps, formPps, setFormPps,
    openAddModal, openEditModal,
    handleSavePPS, confirmDeletePPS,
  } = usePpsList();

  return (
    <View>
      <View style={ppsStyles.statsGrid}>
        {ppsStats.map((stat, index) => (
          <View key={index} style={[ppsStyles.statCard, stat.type === 'TOTAL' ? ppsStyles.statCardTotal : null]}>
            <Text style={[styles.statLabel, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.type}</Text>
            <Text style={[ppsStyles.statValue, stat.type === 'TOTAL' ? { color: 'white' } : null]}>{stat.qty}</Text>
            <Text style={[ppsStyles.statSub, stat.type === 'TOTAL' ? { color: 'rgba(255,255,255,0.7)' } : null]}>{stat.capacity} pax</Text>
          </View>
        ))}
      </View>

      <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
        <Text style={styles.sectionHeaderTitle}>Senarai & Status PPS</Text>
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={16} color={PALETTE.white} />
            <Text style={styles.addButtonText}>Tambah PPS</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingPPS && ppsList.length === 0 ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : ppsList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada data PPS dijumpai.</Text>
      ) : (
        ppsList.map((pps) => (
          <View key={pps.id} style={ppsStyles.ppsCard}>
            <View style={ppsStyles.ppsHeader}>
              <View style={[ppsStyles.ppsIconBox, pps.status !== 'OK' && { backgroundColor: PALETTE.danger }]}>
                <Home size={18} color={PALETTE.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ppsStyles.ppsName}>{pps.name}</Text>
                <View style={ppsStyles.ppsTags}>
                  <View style={ppsStyles.tagZone}><Text style={ppsStyles.tagText}>Zon {pps.zone || '-'}</Text></View>
                  <View style={ppsStyles.tagCap}><Text style={ppsStyles.tagText}>{pps.capacity} Pax</Text></View>
                  <View style={ppsStyles.tagType}><Text style={ppsStyles.tagText}>{pps.type}</Text></View>
                </View>
              </View>

              {userRole === 'admin' && isEditMode ? (
                <View style={styles.ppsActions}>
                  <TouchableOpacity onPress={() => openEditModal(pps)} style={styles.iconBtn}>
                    <Edit size={16} color={PALETTE.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeletePPS(pps.id)} style={styles.iconBtn}>
                    <Trash2 size={16} color={PALETTE.danger} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {pps.status !== 'OK' ? (
              <View style={ppsStyles.alertBox}>
                <AlertCircle size={16} color={PALETTE.danger} />
                <Text style={ppsStyles.alertText}>{pps.status}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <Modal visible={modalPpsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModePps === 'add' ? 'Tambah PPS' : 'Kemaskini PPS'}</Text>
              <TouchableOpacity onPress={() => setModalPpsVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Pusat Pemindahan (PPS) *</Text>
              <TextInput style={styles.input} placeholder="Cth: Dewan Serbaguna Perbadanan" value={formPps.name} onChangeText={(t) => setFormPps({ ...formPps, name: t })} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Zon (Kawasan)</Text>
                  <TextInput style={styles.input} placeholder="Cth: 1" value={formPps.zone} onChangeText={(t) => setFormPps({ ...formPps, zone: t })} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Kapasiti (Pax) *</Text>
                  <TextInput style={styles.input} placeholder="Cth: 500" keyboardType="number-pad" value={formPps.capacity} onChangeText={(t) => setFormPps({ ...formPps, capacity: t })} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Kategori PPS</Text>
              <View style={styles.categoryWrap}>
                {['Dewan', 'Sekolah/Kolej', 'Balairaya', 'Lain-Lain'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.categoryBtn, formPps.type === type ? styles.categoryBtnActive : null]}
                    onPress={() => setFormPps({ ...formPps, type: type })}
                  >
                    <Text style={[styles.categoryBtnText, formPps.type === type ? styles.categoryBtnTextActive : null]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Status Kesediaan</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="OK (Atau nyatakan kerosakan)" multiline value={formPps.status} onChangeText={(t) => setFormPps({ ...formPps, status: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePPS}>
                {loadingPPS ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan PPS</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ppsStyles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  statCardTotal: { width: '100%', backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
  statValue: { fontSize: 24, fontWeight: '900', color: PALETTE.textDark, marginVertical: 4 },
  statSub: { fontSize: 12, color: PALETTE.textMutedDark, fontWeight: '600' },
  ppsCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  ppsHeader: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  ppsIconBox: { width: 40, height: 40, backgroundColor: PALETTE.orange, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ppsName: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 },
  ppsTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagZone: { backgroundColor: PALETTE.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagCap: { backgroundColor: PALETTE.successSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagType: { backgroundColor: PALETTE.orangeSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: PALETTE.textMutedDark },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.dangerSoft, padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder },
  alertText: { fontSize: 11, color: PALETTE.danger, fontWeight: '700', flex: 1 },
});