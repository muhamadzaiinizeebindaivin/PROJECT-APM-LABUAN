import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, PanResponder, ScrollView } from 'react-native';
import { TrendingUp, Pencil, Trash2 } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import QuarterlyEditModal from './QuarterlyEditModal';
import QuarterlyHelpModal from './QuarterlyHelpModal';

const EMPTY_DRAFT = { q: '', months: '', bulanMula: '', bulanAkhir: '', spend: '' };
const CARD_WIDTH = 150;
const CARD_GAP = 10;
const PX_PER_SECOND = 35;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

export default function QuarterlySection({ processedData, loading, isEditMode, saveQuarterlyItem, deleteQuarterlyItem }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [helpHovered, setHelpHovered] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (processedData.length === 0) { setSelectedId(null); return; }
    if (selectedId === null || !processedData.some((it) => it.id === selectedId)) {
      setSelectedId(processedData[0].id);
    }
  }, [processedData, selectedId]);

  const selectedItem = processedData.find((it) => it.id === selectedId) || null;

  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1);

  const contentWidth = Math.max(1, processedData.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = processedData.length > 1 && !modalVisible;

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
  const dragStartScrollXRef = useRef(0);

  const thumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { pauseForInteraction(); dragStartScrollXRef.current = scrollXRef.current; },
      onPanResponderMove: (evt, gestureState) => {
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

  const openAdd = () => {
    setEditItem(null);
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    const [bulanMula = '', bulanAkhir = ''] = (item.months || '').split(' - ').map((s) => s.trim());
    setDraft({ q: item.q, months: item.months, bulanMula, bulanAkhir, spend: String(item.spend) });
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!draft.q.trim() || !draft.spend) return;
    const ok = await saveQuarterlyItem(draft, editItem);
    if (ok) setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.card, { position: 'relative' }]}>
        {isEditMode && (
          <TouchableOpacity style={styles.categoryAddBtnFloating} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <TrendingUp size={16} color="#f97316" />
          </View>
          <Text style={styles.sectionTitle}>PRESTASI MENGIKUT SUKUAN</Text>
          <TouchableOpacity
            style={styles.quarterHelpBtn}
            onPress={() => setHelpVisible(true)}
            onMouseEnter={() => setHelpHovered(true)}
            onMouseLeave={() => setHelpHovered(false)}
          >
            <Text style={styles.quarterHelpBtnText}>?</Text>
            {helpHovered && (
              <View style={styles.kpiTooltip}>
                <Text style={styles.kpiTooltipText}>Bantuan</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}

        {!loading && processedData.length > 0 && (
          <>
            <View
              style={styles.categoryCarouselViewport}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                viewportWidthRef.current = w;
                setViewportWidth(w);
              }}
            >
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleNativeScroll}
                onScrollBeginDrag={pauseForInteraction}
                onScrollEndDrag={() => setTimeout(resumeAfterInteraction, 400)}
                onMomentumScrollEnd={() => setTimeout(resumeAfterInteraction, 200)}
                contentContainerStyle={styles.categoryCarouselTrack}
              >
                {processedData.map((item) => {
                  const selected = selectedId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.categoryCard, styles.categoryCardCompact, { width: CARD_WIDTH }, selected && styles.categoryCardSelected]}
                      onPress={() => setSelectedId(item.id)}
                    >
                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.categoryDeleteBtn}
                          onPress={() => deleteQuarterlyItem(item)}
                        >
                          <Trash2 size={13} color={PALETTE.orange} />
                        </TouchableOpacity>
                      )}
                      <Text style={[styles.categoryCardText, selected && styles.categoryCardTextSelected]}>{item.q}</Text>
                      <View style={[styles.quarterDot, { backgroundColor: item.barColor }]} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {contentWidth > viewportWidth && (
              <View
                style={styles.categoryScrollTrack}
                onStartShouldSetResponder={() => true}
                onResponderRelease={handleTrackPress}
              >
                <Animated.View
                  {...thumbPanResponder.panHandlers}
                  style={[
                    styles.categoryScrollThumb,
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

            {selectedItem && (
              <View style={styles.quarterDetailBlock}>
                <View style={styles.quarterCardHeader}>
                  <View>
                    <Text style={styles.quarterTitle}>{selectedItem.q}</Text>
                    <Text style={styles.quarterMonths}>{selectedItem.months}</Text>
                  </View>

                  <View style={styles.quarterHeaderRight}>
                    <View style={[styles.statusBadge, { backgroundColor: selectedItem.barColor + '20' }]}>
                      <Text style={[styles.statusText, { color: selectedItem.barColor }]}>{selectedItem.statusText}</Text>
                    </View>
                    {isEditMode && (
                      <View style={styles.quarterHeaderActions}>
                        <TouchableOpacity style={styles.kpiPencilBtnInline} onPress={() => openEdit(selectedItem)}>
                          <Pencil size={13} color={PALETTE.orange} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.kpiDeleteBtnInline} onPress={() => deleteQuarterlyItem(selectedItem)}>
                          <Trash2 size={13} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statsLabel}>Belanja (Kumulatif)</Text>
                    <Text style={styles.statsValue}>RM {formatCurrency(parseCurrency(selectedItem.spend))}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statsLabel}>% drp Peruntukan</Text>
                    <Text style={[styles.statsValue, { color: selectedItem.barColor }]}>{selectedItem.percentOfTotal.toFixed(2)}%</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min((selectedItem.percentOfTotal / 25) * 100, 100)}%`, backgroundColor: selectedItem.barColor }]} />
                  <View style={styles.limitLine} />
                </View>
                <Text style={styles.limitLabel}>Had Sukuan (25%)</Text>
              </View>
            )}
          </>
        )}
      </View>

      <QuarterlyEditModal
        visible={modalVisible}
        isNew={!editItem}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />

      <QuarterlyHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
    </>
  );
}