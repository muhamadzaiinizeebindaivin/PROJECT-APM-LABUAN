import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, ScrollView, Animated, PanResponder } from 'react-native';
import {
  Plus, Pencil, Trash2, Package, AlertTriangle, X, Check,
  Truck, Ship, Anchor, Tent, Radio, Backpack, Wrench, HardHat,
  Flashlight, Battery, Fuel, Droplet, Flame, Wind, Shield, ShieldAlert,
  Stethoscope, Syringe, Heart, Cross, Pill, Bandage, Thermometer,
  Boxes, Container, Warehouse, Archive, Package2, PackageOpen,
  Siren, PhoneCall, Wifi, Antenna, Compass, Map, Tent as TentAlt,
  Axe, Hammer, Drill, Scissors, Rope, Umbrella, Bike, Car, Bus,
  Zap, PlugZap, Lightbulb, Wrench as WrenchAlt,
} from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { appStyles as styles } from '../../styles/appStyles';

// Sélection large d'icônes pertinentes pour du matériel/logistique — pas la bibliothèque complète (1500+),
// mais un ensemble couvrant véhicules, marine, médical, communication, stockage, outils, énergie.
export const ASSET_ICON_MAP = {
  Package, Truck, Ship, Anchor, Tent, Radio, Backpack, Wrench, HardHat,
  Flashlight, Battery, Fuel, Droplet, Flame, Wind, Shield, ShieldAlert,
  Stethoscope, Syringe, Heart, Cross, Pill, Bandage, Thermometer,
  Boxes, Container, Warehouse, Archive, Package2, PackageOpen,
  Siren, PhoneCall, Wifi, Antenna, Compass, Map,
  Axe, Hammer, Drill, Scissors, Umbrella, Bike, Car, Bus,
  Zap, PlugZap, Lightbulb,
};
const ASSET_ICON_KEYS = Object.keys(ASSET_ICON_MAP);

const CARD_WIDTH = 110;
const CARD_GAP = 12;
const PX_PER_SECOND = 20;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

const local = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  assetCard: {
    width: 110, alignItems: 'center', padding: 12, borderRadius: 14,
    backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    position: 'relative',
  },
  cardActions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6, zIndex: 2 },
  iconBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 8 },
  cardValue: { fontSize: 20, fontWeight: '900', color: PALETTE.textDark },
  cardLabel: { fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark, textAlign: 'center', marginTop: 2 },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  iconOption: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  iconOptionSelected: { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },

  scrollTrack: {
    width: 160, height: 4, borderRadius: 2, backgroundColor: PALETTE.cardLightBorder,
    alignSelf: 'center', marginTop: 12, overflow: 'hidden',
  },
  scrollThumb: { height: 4, borderRadius: 2, backgroundColor: PALETTE.orange },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default function SekretariatAssetsSection({ assetList, isEditing, saveAssetItem, deleteAssetItem, onNotify }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [assetForm, setAssetForm] = useState({ id: null, nama: '', bilangan: '', icon_key: 'Package' });
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Carrousel horizontal auto-scroll (va-et-vient) ──
  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  const contentWidth = Math.max(1, assetList.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = assetList.length > 3 && !modalVisible && !hovered;

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastFrameTimeRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = (timestamp) => {
      if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = timestamp;
      const dt = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const maxScroll = Math.max(0, contentWidth - viewportWidthRef.current);
      if (maxScroll <= 0) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      let next = scrollXRef.current + directionRef.current * PX_PER_SECOND * dt;
      if (next >= maxScroll) { next = maxScroll; directionRef.current = -1; }
      else if (next <= 0) { next = 0; directionRef.current = 1; }

      scrollXRef.current = next;
      scrollRef.current?.scrollTo({ x: next, animated: false });
      scrollX.setValue(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [contentWidth, scrollX, stopAutoScroll]);

  const userInteractingRef = useRef(false);
  useEffect(() => {
    if (active && !userInteractingRef.current) startAutoScroll();
    else stopAutoScroll();
    return stopAutoScroll;
  }, [active, startAutoScroll, stopAutoScroll]);

  const pauseForInteraction = () => { userInteractingRef.current = true; stopAutoScroll(); };
  const resumeAfterInteraction = () => { userInteractingRef.current = false; if (active) startAutoScroll(); };

  const handleNativeScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollXRef.current = x;
    scrollX.setValue(x);
  };

  const maxScroll = Math.max(1, contentWidth - viewportWidth);
  const thumbWidth = Math.max(MIN_THUMB_WIDTH, SCROLLBAR_TRACK_WIDTH * Math.min(1, viewportWidth / contentWidth));
  const thumbTravel = Math.max(0, SCROLLBAR_TRACK_WIDTH - thumbWidth);

  const maxScrollRef = useRef(maxScroll);
  const thumbTravelRef = useRef(thumbTravel);
  useEffect(() => {
    maxScrollRef.current = maxScroll;
    thumbTravelRef.current = thumbTravel;
  }, [maxScroll, thumbTravel]);

  const dragStartScrollXRef = useRef(0);
  const thumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { pauseForInteraction(); dragStartScrollXRef.current = scrollXRef.current; },
      onPanResponderMove: (evt, gestureState) => {
        const deltaX = (gestureState.dx / Math.max(1, thumbTravelRef.current)) * maxScrollRef.current;
        const x = Math.max(0, Math.min(maxScrollRef.current, dragStartScrollXRef.current + deltaX));
        scrollRef.current?.scrollTo({ x, animated: false });
        scrollXRef.current = x;
        scrollX.setValue(x);
      },
      onPanResponderRelease: () => resumeAfterInteraction(),
      onPanResponderTerminate: () => resumeAfterInteraction(),
    })
  ).current;

  const handleTrackPress = (evt) => {
    const trackX = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, (trackX - thumbWidth / 2) / thumbTravel));
    const x = ratio * maxScroll;
    pauseForInteraction();
    scrollRef.current?.scrollTo({ x, animated: true });
    scrollXRef.current = x;
    scrollX.setValue(x);
    setTimeout(resumeAfterInteraction, 300);
  };

  const dragStartScrollXContentRef = useRef(0);
  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 3,
      onPanResponderGrant: () => { pauseForInteraction(); dragStartScrollXContentRef.current = scrollXRef.current; },
      onPanResponderMove: (evt, gestureState) => {
        const x = Math.max(0, Math.min(maxScrollRef.current, dragStartScrollXContentRef.current - gestureState.dx));
        scrollRef.current?.scrollTo({ x, animated: false });
        scrollXRef.current = x;
        scrollX.setValue(x);
      },
      onPanResponderRelease: () => resumeAfterInteraction(),
      onPanResponderTerminate: () => resumeAfterInteraction(),
    })
  ).current;

  const openAdd = () => {
    setAssetForm({ id: null, nama: '', bilangan: '', icon_key: 'Package' });
    setFormError(null);
    setModalVisible(true);
  };
  const openEdit = (item) => {
    setAssetForm({ ...item, bilangan: String(item.bilangan), icon_key: item.icon_key || 'Package' });
    setFormError(null);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!assetForm.nama.trim() || !String(assetForm.bilangan).trim()) {
      setFormError('Nama dan bilangan tidak boleh kosong.');
      return;
    }
    setFormError(null);
    setIsSaving(true);
    const ok = await saveAssetItem(assetForm);
    setIsSaving(false);
    if (ok) {
      setModalVisible(false);
      onNotify?.('success', assetForm.id ? 'Asset berjaya dikemaskini.' : 'Asset berjaya ditambah.');
    } else {
      onNotify?.('error', 'Gagal menyimpan asset.');
    }
  };
  const confirmDelete = async () => {
    const item = confirmDeleteItem;
    setIsDeleting(true);
    const ok = await deleteAssetItem(item.id);
    setIsDeleting(false);
    setConfirmDeleteItem(null);
    onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam asset.' : 'Asset berjaya dipadam.');
  };

  return (
    <View style={[styles.card, { padding: 16 }]}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Jumlah Asset</Text>
        {isEditing && (
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      {assetList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada asset lagi.</Text>
      ) : (
        <>
          <View
            style={{ overflow: 'hidden' }}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              viewportWidthRef.current = w;
              setViewportWidth(w);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            {...contentPanResponder.panHandlers}
          >
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              scrollEnabled={false}
              onScroll={handleNativeScroll}
              contentContainerStyle={{ flexDirection: 'row', gap: CARD_GAP, paddingVertical: 4 }}
            >
              {assetList.map((item) => {
                const IconComp = ASSET_ICON_MAP[item.icon_key] || Package;
                return (
                  <View key={item.id} style={local.assetCard}>
                    {isEditing && (
                      <View style={local.cardActions}>
                        <TouchableOpacity onPress={() => openEdit(item)}>
                          <Pencil size={13} color={PALETTE.orange} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setConfirmDeleteItem(item)}>
                          <Trash2 size={13} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={[local.iconBadge, { backgroundColor: `${item.color}1A` }]}>
                      <IconComp size={26} color={item.color} />
                    </View>
                    <Text style={local.cardValue}>{item.bilangan}</Text>
                    <Text style={local.cardLabel} numberOfLines={2}>{item.nama}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {contentWidth > viewportWidth && (
            <View
              style={local.scrollTrack}
              onStartShouldSetResponder={() => true}
              onResponderRelease={handleTrackPress}
            >
              <Animated.View
                {...thumbPanResponder.panHandlers}
                style={[
                  local.scrollThumb,
                  {
                    width: thumbWidth,
                    transform: [{
                      translateX: scrollX.interpolate({
                        inputRange: [0, Math.max(1, maxScroll)],
                        outputRange: [0, thumbTravel],
                        extrapolate: 'clamp',
                      }),
                    }],
                  },
                ]}
              />
            </View>
          )}
        </>
      )}

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={local.confirmOverlay}>
          <View style={local.confirmBox}>
            <View style={local.confirmBanner}>
              <View style={local.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={local.confirmTitle}>Padam Asset</Text>
              <Text style={local.confirmSubtitle}>
                Padam asset ini{displayDeleteItemRef.current?.nama ? ` "${displayDeleteItemRef.current.nama}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={local.confirmActions}>
              <TouchableOpacity style={local.confirmCancelBtn} onPress={() => setConfirmDeleteItem(null)} disabled={isDeleting}>
                <Text style={local.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[local.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]} onPress={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : (<><Trash2 size={16} color="#fff" /><Text style={local.confirmConfirmText}>Padam</Text></>)}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{assetForm.id ? 'Kemaskini' : 'Tambah'} Asset</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama</Text>
              <TextInput
                style={styles.input}
                value={assetForm.nama}
                onChangeText={(t) => setAssetForm({ ...assetForm, nama: t })}
                placeholder="Cth: Bot Aluminium"
                placeholderTextColor={PALETTE.textMutedDark}
              />
              <Text style={styles.inputLabel}>Bilangan</Text>
              <TextInput
                style={styles.input}
                value={String(assetForm.bilangan)}
                onChangeText={(t) => setAssetForm({ ...assetForm, bilangan: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholderTextColor={PALETTE.textMutedDark}
              />

              <Text style={styles.inputLabel}>Ikon</Text>
              <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={local.iconGrid}>
                {ASSET_ICON_KEYS.map((key) => {
                  const IconComp = ASSET_ICON_MAP[key];
                  const selected = assetForm.icon_key === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setAssetForm({ ...assetForm, icon_key: key })}
                      style={[local.iconOption, selected && local.iconOptionSelected]}
                    >
                      <IconComp size={20} color={selected ? '#fff' : PALETTE.textMutedDark} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {!!formError && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 12 }}>{formError}</Text>}
              <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : (<><Check size={16} color="#fff" /><Text style={styles.saveButtonText}>Simpan</Text></>)}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}