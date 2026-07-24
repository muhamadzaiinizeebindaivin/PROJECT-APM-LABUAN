import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Target, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { pentadbiranStyles as styles } from './pentadbiranStyles';
import SectionHeader from './SectionHeader';
import KpiEditModal from './KpiEditModal';
import KpiDetailModal from './KpiDetailModal';

const EMPTY_DRAFT = { nama: '', tafsiran: '', sasaran: '', status: 'kuning', pencapaian_semasa: '', analisis_tindakan: '', sub_seksyen: '' };
const STATUS_COLORS = { hijau: '#16a34a', kuning: '#eab308', merah: '#dc2626' };
const STATUS_LEGEND = [
  { key: 'hijau', label: 'Hijau', color: STATUS_COLORS.hijau, desc: 'Mencapai atau melebihi sasaran.' },
  { key: 'kuning', label: 'Kuning', color: STATUS_COLORS.kuning, desc: 'Memerlukan perhatian / hampir capai sasaran.' },
  { key: 'merah', label: 'Merah', color: STATUS_COLORS.merah, desc: 'Di bawah sasaran / kritikal.' },
];
const CARD_WIDTH = 220;
const CARD_GAP = 12;
const PX_PER_SECOND = 20;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

export default function KpiSection({ kpiItems, isEditing, updateKpiItem, addKpiItem, removeKpiItem, persistKpi, showSubSeksyen = true, onNotify }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalIndex, setModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [detailIndex, setDetailIndex] = useState(null); // index de la carte consultée en lecture seule
  const [hovered, setHovered] = useState(false);
  const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const displayDeleteIndexRef = useRef(null);
  if (confirmDeleteIndex !== null) displayDeleteIndexRef.current = confirmDeleteIndex;
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Notification (toast) après chaque action réussie ou échouée ──
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message }
  const notificationTimeoutRef = useRef(null);
  const showNotification = (type, message) => {
    if (onNotify) {
      onNotify(type, message);
      return;
    }
    setNotification({ type, message });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };
  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const userInteractingRef = useRef(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1); // 1 = vers la droite, -1 = vers la gauche

  const contentWidth = Math.max(1, kpiItems.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = kpiItems.length > 0 && !isEditing && modalIndex === null && detailIndex === null && !hovered;

  // `active` est recalculé à chaque rendu, mais les PanResponder ci-dessous ne sont créés
  // qu'une seule fois (useRef) — leurs callbacks captureraient sinon la valeur de `active`
  // du tout premier rendu pour toujours. On passe donc par une ref, toujours à jour.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ── Auto-scroll fluide via requestAnimationFrame, va-et-vient (ping-pong), pause pendant toute interaction ──
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

      // Arrivé à une extrémité : on clamp et on inverse le sens (ping-pong) au lieu de sauter au début
      if (next >= maxScroll) {
        next = maxScroll;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }

      scrollXRef.current = next;
      scrollRef.current?.scrollTo({ x: next, animated: false });
      scrollX.setValue(next);

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [contentWidth, scrollX, stopAutoScroll]);

  useEffect(() => {
    if (active && !userInteractingRef.current) startAutoScroll();
    else stopAutoScroll();
    return stopAutoScroll;
  }, [active, startAutoScroll, stopAutoScroll]);

  const pauseForInteraction = () => {
    userInteractingRef.current = true;
    stopAutoScroll();
  };

  const resumeAfterInteraction = () => {
    userInteractingRef.current = false;
    if (activeRef.current) startAutoScroll();
  };

  const handleNativeScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollXRef.current = x;
    scrollX.setValue(x);
  };

  // ── Scrollbar custom en bas : suit le scroll natif, et est elle-même draggable ──
  const maxScroll = Math.max(1, contentWidth - viewportWidth);
  const thumbWidth = Math.max(MIN_THUMB_WIDTH, SCROLLBAR_TRACK_WIDTH * Math.min(1, viewportWidth / contentWidth));
  const thumbTravel = Math.max(0, SCROLLBAR_TRACK_WIDTH - thumbWidth);

  const dragStartScrollXRef = useRef(0);

  const thumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pauseForInteraction();
        // Ancre la position de départ une seule fois, au moment où le doigt/la souris touche le curseur
        dragStartScrollXRef.current = scrollXRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        // gestureState.dx est cumulatif depuis le début du geste : on l'applique toujours
        // par rapport à l'ancre de départ, jamais par rapport à la position courante
        const deltaX = (gestureState.dx / Math.max(1, thumbTravel)) * maxScroll;
        const x = Math.max(0, Math.min(maxScroll, dragStartScrollXRef.current + deltaX));
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
        const x = Math.max(0, Math.min(maxScroll, dragStartScrollXContentRef.current - gestureState.dx));
        scrollRef.current?.scrollTo({ x, animated: false });
        scrollXRef.current = x;
        scrollX.setValue(x);
      },
      onPanResponderRelease: () => resumeAfterInteraction(),
      onPanResponderTerminate: () => resumeAfterInteraction(),
    })
  ).current;

  const openEdit = (index) => {
    setModalIndex(index);
    const item = kpiItems[index];
    setDraft({
      nama: item.nama,
      tafsiran: item.tafsiran,
      sasaran: item.sasaran,
      status: item.status || 'kuning',
      pencapaian_semasa: item.pencapaian_semasa || '',
      analisis_tindakan: item.analisis_tindakan || '',
      sub_seksyen: item.sub_seksyen || '',
    });
  };

  const openAdd = () => {
    setModalIndex(-1);
    setDraft(EMPTY_DRAFT);
  };

  const closeModal = () => {
    setModalIndex(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleSave = async () => {
    const isNew = modalIndex === -1;
    let updatedItems;
    try {
      if (isNew) {
        updatedItems = [...kpiItems, { id: null, section: kpiItems[0]?.section, ...draft, display_order: kpiItems.length }];
        const ok = await addKpiItem(draft);
        if (ok === false) {
          showNotification('error', 'Gagal menambah KPI.');
          return;
        }
      } else {
        updatedItems = kpiItems.map((it, i) => (i === modalIndex ? { ...it, ...draft } : it));
        const ok = await updateKpiItem(modalIndex, draft);
        if (ok === false) {
          showNotification('error', 'Gagal mengemaskini KPI.');
          return;
        }
      }
      closeModal();
      // persistKpi (réordonnancement) exige des id valides côté serveur — après un ajout, addKpiItem
      // vient déjà de rafraîchir kpiList avec les vrais id depuis la base ; réappeler persistKpi ici
      // avec le tableau local périmé (id encore null pour le nouvel item) écraserait ce rafraîchissement.
      if (!isNew && persistKpi) await persistKpi(updatedItems);
      showNotification('success', isNew ? 'KPI berjaya ditambah.' : 'KPI berjaya dikemaskini.');
    } catch (error) {
      showNotification('error', 'Ralat berlaku semasa menyimpan KPI.');
    }
  };

  const handleDelete = () => {
    const index = modalIndex;
    closeModal();
    setConfirmDeleteIndex(index);
  };

  const confirmDeleteFromCard = async () => {
    const index = confirmDeleteIndex;
    const itemName = kpiItems[index]?.nama;
    setIsDeleting(true);
    try {
      const ok = await removeKpiItem(kpiItems[index]);
      // Ferme la popup seulement une fois la suppression terminée — la carte disparaît
      // au même moment (kpiItems mis à jour par le hook juste avant que cette promesse se résolve)
      setConfirmDeleteIndex(null);
      setIsDeleting(false);
      if (ok === false) {
        showNotification('error', `Gagal memadam KPI "${itemName}".`);
      } else {
        showNotification('success', `KPI "${itemName}" berjaya dipadam.`);
      }
    } catch (error) {
      setConfirmDeleteIndex(null);
      setIsDeleting(false);
      showNotification('error', `Gagal memadam KPI "${itemName}".`);
    }
  };

  return (
    <View style={[styles.card, { position: 'relative' }]}>
      <SectionHeader title="KEY PERFORMANCE INDICATOR (KPI)" Icon={Target} />

      {!onNotify && notification && (
        <View
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: 'transparent',
            paddingVertical: 6, paddingHorizontal: 4, maxWidth: 320,
          }}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={17} color="#16a34a" />
          ) : (
            <XCircle size={17} color="#dc2626" />
          )}
          <Text
            style={{
              color: notification.type === 'success' ? '#166534' : '#991b1b',
              fontWeight: '700', fontSize: 13, flexShrink: 1,
            }}
          >
            {notification.message}
          </Text>
        </View>
      )}

      <View style={styles.kpiLegendRow}>
        {STATUS_LEGEND.map((item) => (
          <View key={item.key} style={styles.kpiLegendItem}>
            <View style={[styles.statusDot, { backgroundColor: item.color }]} />
            <Text style={styles.kpiLegendText}>
              <Text style={styles.kpiLegendLabel}>{item.label}:</Text> {item.desc}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={styles.kpiMarqueeViewport}
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
          contentContainerStyle={styles.kpiGrid}
        >
          {kpiItems.map((item, index) => {
            const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.kuning;
            return (
            <TouchableOpacity
              key={item.id ?? index}
              activeOpacity={0.85}
              style={[styles.kpiCard, { borderColor: statusColor }]}
              onPress={() => setDetailIndex(index)}
            >
              <View style={styles.kpiCardBody}>
                {!!item.sub_seksyen && (
                  <View style={styles.subSeksyenBadge}>
                    <Text style={styles.subSeksyenBadgeText}>{item.sub_seksyen}</Text>
                  </View>
                )}
                <View style={styles.kpiCardHeaderRow}>
                  <Text style={styles.kpiCardNama}>{item.nama}</Text>
                </View>
                <Text style={styles.kpiCardTafsiran}>{item.tafsiran}</Text>
                {!!item.pencapaian_semasa && (
                  <Text style={styles.kpiCardPencapaian}>
                    Pencapaian Semasa: <Text style={{ fontWeight: '800' }}>{item.pencapaian_semasa}</Text>
                  </Text>
                )}
                {!!item.analisis_tindakan && (
                  <Text style={styles.kpiCardAnalisis} numberOfLines={3}>{item.analisis_tindakan}</Text>
                )}
              </View>
              <View style={styles.kpiSasaranBadge}>
                <Text style={styles.kpiSasaranText}>{item.sasaran}</Text>
              </View>

              {isEditing && (
                <>
                  <TouchableOpacity
                    style={styles.kpiPencilBtn}
                    onPress={() => openEdit(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <Pencil size={14} color={PALETTE.orange} />
                    {hoveredIndex === index && (
                      <View style={{
                        position: 'absolute', top: 32, right: 0, zIndex: 999,
                        backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                      }}>
                        <Text style={styles.kpiTooltipText}>Ubah</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.kpiPencilBtn, { right: 46, backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}
                    onPress={() => setConfirmDeleteIndex(index)}
                    onMouseEnter={() => setHoveredDeleteIndex(index)}
                    onMouseLeave={() => setHoveredDeleteIndex(null)}
                  >
                    <Trash2 size={14} color="#dc2626" />
                    {hoveredDeleteIndex === index && (
                      <View style={{
                        position: 'absolute', top: 32, right: 0, zIndex: 999,
                        backgroundColor: PALETTE.textDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                      }}>
                        <Text style={styles.kpiTooltipText}>Padam</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {contentWidth > viewportWidth && (
        <View
          style={styles.kpiScrollTrack}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleTrackPress}
        >
          <Animated.View
            {...thumbPanResponder.panHandlers}
            style={[
              styles.kpiScrollThumb,
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

      {isEditing && (
        <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { marginTop: 10 }]}>
          <Text style={styles.addBtnText}>+ Tambah KPI Baru</Text>
        </TouchableOpacity>
      )}

      <Modal visible={confirmDeleteIndex !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteIndex(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmBanner}>
              <View style={styles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={styles.confirmTitle}>Padam KPI</Text>
              <Text style={styles.confirmSubtitle}>
                Adakah anda pasti mahu memadam KPI "{kpiItems[displayDeleteIndexRef.current]?.nama}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

<View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, isDeleting && { opacity: 0.5 }]}
                onPress={() => setConfirmDeleteIndex(null)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDeleteFromCard}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KpiEditModal
        visible={modalIndex !== null}
        isNew={modalIndex === -1}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={closeModal}
        showSubSeksyen={showSubSeksyen}
      />

      <KpiDetailModal
        visible={detailIndex !== null}
        item={detailIndex !== null ? kpiItems[detailIndex] : null}
        onClose={() => setDetailIndex(null)}
      />
    </View>
  );
}
