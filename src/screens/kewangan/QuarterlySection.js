import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, PanResponder, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { TrendingUp, Pencil, Trash2, AlertTriangle } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import QuarterlyEditModal from './QuarterlyEditModal';
import QuarterlyHelpModal from './QuarterlyHelpModal';

const EMPTY_DRAFT = { q: '', months: '', bulanMula: '', bulanAkhir: '', spend: '' };
const CARD_WIDTH = 150;
const CARD_GAP = 10;
const PX_PER_SECOND = 35;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

export default function QuarterlySection({ processedData, loading, isEditMode, saveQuarterlyItem, deleteQuarterlyItem, onNotify }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [helpHovered, setHelpHovered] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [selectedId, setSelectedId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;

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
  const [hovered, setHovered] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  const contentWidth = Math.max(1, processedData.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = processedData.length > 1 && !modalVisible && !hovered && !isMobile;

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

  const dragStartScrollXContentRef = useRef(0);
  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isMobile,
      onMoveShouldSetPanResponder: (evt, gestureState) => !isMobile && Math.abs(gestureState.dx) > 3,
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

  const openAdd = () => {
    setEditItem(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setModalVisible(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    const [bulanMula = '', bulanAkhir = ''] = (item.months || '').split(' - ').map((s) => s.trim());
    setDraft({ q: item.q, months: item.months, bulanMula, bulanAkhir, spend: String(item.spend) });
    setFormError(null);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!draft.q.trim() || !draft.spend.trim() || !draft.bulanMula || !draft.bulanAkhir) {
      setFormError('Sukuan, tempoh bulan dan jumlah belanja mesti diisi.');
      return;
    }
    const duplicate = processedData.some((it) => it.q === draft.q && it.id !== editItem?.id);
    if (duplicate) {
      setFormError(`${draft.q} sudah wujud. Sila pilih sukuan lain.`);
      return;
    }
    setFormError(null);
    setIsSaving(true);
    const ok = await saveQuarterlyItem(draft, editItem);
    setIsSaving(false);
    if (ok) {
      setModalVisible(false);
      onNotify?.('success', editItem ? 'Sukuan berjaya dikemaskini.' : 'Sukuan berjaya ditambah.');
    } else {
      onNotify?.('error', 'Gagal menyimpan sukuan.');
    }
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
              style={{
                backgroundColor: PALETTE.softOrangeBg,
                borderWidth: 1,
                borderColor: 'rgba(249, 115, 22, 0.25)',
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                  Jumlah Perbelanjaan Keseluruhan
                </Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: PALETTE.orange, fontFamily: 'monospace' }}>
                  RM {formatCurrency(processedData.reduce((sum, it) => sum + parseCurrency(it.spend), 0))}
                </Text>
              </View>
              <TrendingUp size={28} color={PALETTE.orange} style={{ opacity: 0.4 }} />
            </View>

            <View
              style={styles.categoryCarouselViewport}
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
                scrollEnabled={isMobile}
                onScroll={handleNativeScroll}
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
                        <>
                          <TouchableOpacity
                            style={[styles.categoryDeleteBtn, { right: 34 }]}
                            onPress={() => openEdit(item)}
                          >
                            <Pencil size={13} color={PALETTE.orange} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.categoryDeleteBtn}
                            onPress={() => setConfirmDeleteItem(item)}
                          >
                            <Trash2 size={13} color={PALETTE.orange} />
                          </TouchableOpacity>
                        </>
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
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statsLabel}>Belanja</Text>
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
                <Text style={styles.limitLabel}>Had per Sukuan (25%)</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 }}>
                  <Text style={styles.statsLabel}>% Kumulatif Sejak Awal Tahun</Text>
                  <Text style={[styles.statsValue, { color: selectedItem.cumulativeBarColor }]}>{selectedItem.cumulativePercent.toFixed(2)}%</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min((selectedItem.cumulativePercent / selectedItem.threshold) * 100, 100)}%`, backgroundColor: selectedItem.cumulativeBarColor }]} />
                  <View style={styles.limitLine} />
                </View>
                <Text style={styles.limitLabel}>Had Kumulatif ({selectedItem.threshold}%)</Text>
              </View>
            )}
          </>
        )}
      </View>

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Rekod</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam rekod ini{displayDeleteItemRef.current?.q ? ` "${displayDeleteItemRef.current.q}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDeleteItem(null)}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={pentadbiranStyles.confirmConfirmBtn}
                onPress={async () => {
                  const item = confirmDeleteItem;
                  setConfirmDeleteItem(null);
                  const ok = await deleteQuarterlyItem(item);
                  onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam rekod.' : 'Rekod berjaya dipadam.');
                }}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <QuarterlyEditModal
        visible={modalVisible}
        isNew={!editItem}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
        error={formError}
        isSaving={isSaving}
      />

      <QuarterlyHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
    </>
  );
}