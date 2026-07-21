// src/screens/sekretariat/HotspotSection.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Droplets, Mountain, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { useHotspots } from '../../hooks/useHotspots';
import { sharedStyles as styles } from './sharedStyles';
import { PALETTE } from '../../constants/palette';

export default function HotspotSection({ userRole, isEditMode }) {
  const {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  } = useHotspots();

  const banjirData = hotspotList.filter(h => h.category === 'banjir');
  const cerunData = hotspotList.filter(h => h.category === 'cerun');
  const pantaiData = hotspotList.filter(h => h.category === 'pantai');

  const renderHotspotItem = (item, badgeColor, prefixText = 'NO.') => (
    <View key={item.id} style={hotspotStyles.hotspotCard}>
      <View style={[hotspotStyles.hotspotBadge, { backgroundColor: badgeColor }]}>
        <Text style={hotspotStyles.hotspotBadgeText}>{prefixText} {item.ref_no || '-'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={hotspotStyles.hotspotRiver}>{item.river}</Text>
        <Text style={hotspotStyles.hotspotArea}>{item.area}</Text>
      </View>

      {userRole === 'admin' && isEditMode ? (
        <View style={styles.ppsActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
            <Edit size={16} color={PALETTE.orange} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDeleteHotspot(item.id)} style={styles.iconBtn}>
            <Trash2 size={16} color={PALETTE.danger} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Senarai Hotspot Bencana</Text>
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={16} color={PALETTE.white} />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingHotspot && hotspotList.length === 0 ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : hotspotList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada data hotspot dijumpai.</Text>
      ) : (
        <>
          <View style={[hotspotStyles.hotspotHeader, { backgroundColor: PALETTE.blueSoft, borderColor: PALETTE.blue }]}>
            <Droplets size={24} color={PALETTE.blue} />
            <View>
              <Text style={[hotspotStyles.hotspotTitle, { color: PALETTE.blueDark }]}>HOTSPOT BANJIR</Text>
              <Text style={hotspotStyles.hotspotSub}>Kawasan berisiko banjir</Text>
            </View>
          </View>

          <View style={hotspotStyles.mapCard}>
            <Image source={require('../../../assets/map_banjir.png')} style={hotspotStyles.mapImage} resizeMode="contain" />
            <Text style={hotspotStyles.mapCaption}>Rajah 1: Peta Taburan Hotspot Banjir</Text>
          </View>

          {banjirData.map(item => renderHotspotItem(item, PALETTE.blue, 'NO.'))}

          {pantaiData.length > 0 ? (
            <View style={{ marginTop: 25 }}>
              <View style={[hotspotStyles.hotspotHeader, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                <Droplets size={24} color="#d97706" />
                <View>
                  <Text style={[hotspotStyles.hotspotTitle, { color: '#92400e' }]}>HOTSPOT PANTAI</Text>
                  <Text style={hotspotStyles.hotspotSub}>Kawasan hakisan pantai / ombak besar</Text>
                </View>
              </View>
              {pantaiData.map(item => renderHotspotItem(item, '#f59e0b', 'ID'))}
            </View>
          ) : null}

          <View style={[hotspotStyles.hotspotHeader, { backgroundColor: PALETTE.orangeSoft, borderColor: PALETTE.orange, marginTop: 25 }]}>
            <Mountain size={24} color={PALETTE.orangeDark} />
            <View>
              <Text style={[hotspotStyles.hotspotTitle, { color: PALETTE.orangeDark }]}>HOTSPOT TANAH RUNTUH</Text>
              <Text style={hotspotStyles.hotspotSub}>Cerun Kritikal & Berisiko</Text>
            </View>
          </View>

          <View style={hotspotStyles.mapCard}>
            <Image source={require('../../../assets/map_landslide.png')} style={hotspotStyles.mapImage} resizeMode="contain" />
            <Text style={hotspotStyles.mapCaption}>Rajah 2: Lokasi Cerun Kritikal (Landslide)</Text>
          </View>

          {cerunData.map(item => renderHotspotItem(item, PALETTE.orangeDark, 'ID'))}
        </>
      )}

      <Modal visible={modalHotspotVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeHotspot === 'add' ? 'Tambah Hotspot' : 'Kemaskini Hotspot'}</Text>
              <TouchableOpacity onPress={() => setModalHotspotVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Kategori Hotspot</Text>
              <View style={styles.categoryWrap}>
                {['banjir', 'pantai', 'cerun'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, formHotspot.category === cat ? styles.categoryBtnActive : null]}
                    onPress={() => setFormHotspot({ ...formHotspot, category: cat })}
                  >
                    <Text style={[styles.categoryBtnText, formHotspot.category === cat ? styles.categoryBtnTextActive : null]}>
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>No. Rujukan / ID *</Text>
              <TextInput style={styles.input} placeholder="Cth: 1, 2, atau 17/4" value={formHotspot.ref_no} onChangeText={(t) => setFormHotspot({ ...formHotspot, ref_no: t })} />
              <Text style={styles.inputLabel}>Sungai / Koordinat / Lokasi Utama *</Text>
              <TextInput style={styles.input} placeholder="Cth: Sg. Kinabenua / 5°22'16.5N 115..." value={formHotspot.river} onChangeText={(t) => setFormHotspot({ ...formHotspot, river: t })} />
              <Text style={styles.inputLabel}>Kawasan Terjejas *</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Cth: Kg Rancha-Rancha / Slope ID 17/4" multiline value={formHotspot.area} onChangeText={(t) => setFormHotspot({ ...formHotspot, area: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveHotspot}>
                {loadingHotspot ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Hotspot</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const hotspotStyles = StyleSheet.create({
  hotspotHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 15, gap: 12 },
  hotspotTitle: { fontSize: 16, fontWeight: '800' },
  hotspotSub: { fontSize: 12, color: PALETTE.textMutedDark },
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 12 },
  hotspotBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, width: 75, alignItems: 'center', justifyContent: 'center' },
  hotspotBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  hotspotRiver: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  mapCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: PALETTE.cardLightBorder, padding: 10, alignItems: 'center' },
  mapImage: { width: '100%', height: 420, borderRadius: 8, backgroundColor: PALETTE.surface },
  mapCaption: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 8, fontWeight: '600', fontStyle: 'italic' },
});