import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, ScrollView } from 'react-native';
import { Target, Pencil } from 'lucide-react-native';
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
const PX_PER_SECOND = 40;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

export default function KpiSection({ kpiItems, isEditing, updateKpiItem, addKpiItem, removeKpiItem, persistKpi }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [modalIndex, setModalIndex] = useState(null); // null = fermé, -1 = ajout, >=0 = édition
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [detailIndex, setDetailIndex] = useState(null); // index de la carte consultée en lecture seule
  const [hovered, setHovered] = useState(false);

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
    if (active) startAutoScroll();
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
    let updatedItems;
    if (modalIndex === -1) {
      updatedItems = [...kpiItems, { id: null, section: kpiItems[0]?.section, ...draft, display_order: kpiItems.length }];
      addKpiItem(draft);
    } else {
      updatedItems = kpiItems.map((it, i) => (i === modalIndex ? { ...it, ...draft } : it));
      updateKpiItem(modalIndex, draft);
    }
    closeModal();
    if (persistKpi) await persistKpi(updatedItems);
  };

  const handleDelete = async () => {
    const updatedItems = kpiItems.filter((_, i) => i !== modalIndex);
    removeKpiItem(modalIndex);
    closeModal();
    if (persistKpi) await persistKpi(updatedItems);
  };

  return (
    <View style={styles.card}>
      <SectionHeader title="KEY PERFORMANCE INDICATOR (KPI)" Icon={Target} />

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
                <TouchableOpacity
                  style={styles.kpiPencilBtn}
                  onPress={() => openEdit(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Pencil size={14} color={PALETTE.orange} />
                  {hoveredIndex === index && (
                    <View style={styles.kpiTooltip}>
                      <Text style={styles.kpiTooltipText}>Ubah</Text>
                    </View>
                  )}
                </TouchableOpacity>
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

      <KpiEditModal
        visible={modalIndex !== null}
        isNew={modalIndex === -1}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={closeModal}
      />

      <KpiDetailModal
        visible={detailIndex !== null}
        item={detailIndex !== null ? kpiItems[detailIndex] : null}
        onClose={() => setDetailIndex(null)}
      />
    </View>
  );
}