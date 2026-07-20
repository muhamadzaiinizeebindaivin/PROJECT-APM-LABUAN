import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, PanResponder, ScrollView } from 'react-native';
import { Wallet, Pencil, Trash2, FolderOpen } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import BudgetEditModal from './BudgetEditModal';

const EMPTY_ROW = { perihal: '', agihan: '', belanja: '' };
const CARD_WIDTH = 170;
const CARD_GAP = 10;
const PX_PER_SECOND = 35;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

const ITEMS_PER_PAGE = 5;

export default function BudgetSection({ budgetData, loading, isEditMode, saveBudgetItem, deleteBudgetItem, deleteCategory }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [kategori, setKategori] = useState('');
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(0);

  const totalAgihan = budgetData.reduce((sum, item) => sum + parseCurrency(item.agihan), 0);
  const totalBelanja = budgetData.reduce((sum, item) => sum + parseCurrency(item.belanja), 0);
  const baki = totalAgihan - totalBelanja;

  const grouped = budgetData.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});
  const existingCategories = Object.keys(grouped).sort();

  const categoryTotals = existingCategories.reduce((acc, cat) => {
    const items = grouped[cat];
    const agihan = items.reduce((s, i) => s + parseCurrency(i.agihan), 0);
    const belanja = items.reduce((s, i) => s + parseCurrency(i.belanja), 0);
    acc[cat] = { agihan, belanja, baki: agihan - belanja };
    return acc;
  }, {});

  useEffect(() => {
    if (!selectedCategory && existingCategories.length > 0) setSelectedCategory(existingCategories[0]);
    if (selectedCategory && !existingCategories.includes(selectedCategory)) {
      setSelectedCategory(existingCategories[0] || null);
    }
  }, [existingCategories, selectedCategory]);

  // Revient à la page 1 à chaque changement de catégorie sélectionnée
  useEffect(() => { setPage(0); }, [selectedCategory]);

  const categoryItems = selectedCategory ? (grouped[selectedCategory] || []) : [];
  const totalPages = Math.max(1, Math.ceil(categoryItems.length / ITEMS_PER_PAGE));
  const pageItems = categoryItems.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  // ── Carrousel horizontal auto-scroll (va-et-vient) ──
  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1);

  const contentWidth = Math.max(1, existingCategories.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = existingCategories.length > 1 && !modalVisible;

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

  // ── CRUD modal ──
  const openAdd = () => {
    setEditItem(null);
    setKategori(selectedCategory || '');
    setRows([{ ...EMPTY_ROW }]);
    setModalVisible(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    setKategori(item.kategori);
    setRows([{ perihal: item.perihal, agihan: String(item.agihan), belanja: String(item.belanja) }]);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!kategori.trim()) return;
    const validRows = rows.filter((r) => r.perihal.trim() && r.agihan);
    if (validRows.length === 0) return;

    if (editItem) {
      // Édition : une seule ligne
      const ok = await saveBudgetItem({ kategori, ...validRows[0] }, editItem);
      if (ok) { setSelectedCategory(kategori); setModalVisible(false); }
    } else {
      // Ajout : sauvegarde chaque ligne l'une après l'autre
      let allOk = true;
      for (const row of validRows) {
        const ok = await saveBudgetItem({ kategori, ...row }, null);
        if (!ok) allOk = false;
      }
      if (allOk) { setSelectedCategory(kategori); setModalVisible(false); }
    }
  };

  return (
    <>
      <View style={styles.card}>
        <SectionHeader title="STATUS AGIHAN & PERBELANJAAN SEMASA" Icon={Wallet} />

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Jumlah Agihan</Text>
            <Text style={[styles.kpiValue, { color: PALETTE.blue }]}>RM {formatCurrency(totalAgihan)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Jumlah Belanja</Text>
            <Text style={[styles.kpiValue, { color: PALETTE.orange }]}>RM {formatCurrency(totalBelanja)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Baki Semasa</Text>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>RM {formatCurrency(baki)}</Text>
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}
      </View>

      {!loading && existingCategories.length > 0 && (
        <View style={[styles.card, { position: 'relative' }]}>
          {isEditMode && (
            <TouchableOpacity style={styles.categoryAddBtnFloating} onPress={openAdd}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}

          <SectionHeader title="KATEGORI PERBELANJAAN" Icon={FolderOpen} />

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
              {existingCategories.map((kat) => {
                const selected = selectedCategory === kat;
                return (
                  <TouchableOpacity
                    key={kat}
                    style={[styles.categoryCard, styles.categoryCardCompact, selected && styles.categoryCardSelected]}
                    onPress={() => setSelectedCategory(kat)}
                  >
                    {isEditMode && (
                      <TouchableOpacity
                        style={styles.categoryDeleteBtn}
                        onPress={() => deleteCategory(kat)}
                      >
                        <Trash2 size={13} color={PALETTE.orange} />
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.categoryCardText, selected && styles.categoryCardTextSelected]}>{kat}</Text>
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

{selectedCategory && (
            <View>
              {pageItems.map((item, index) => {
                const agihan = parseCurrency(item.agihan);
                const belanja = parseCurrency(item.belanja);
                const itemBaki = agihan - belanja;
                return (
                  <View key={item.id || index} style={styles.budgetItemRow}>
                    <View style={styles.budgetMainInfo}>
                      <Text style={styles.budgetPerihal}>{item.perihal}</Text>
                      {isEditMode && (
                        <View style={styles.budgetActionGroup}>
                          <TouchableOpacity style={[styles.budgetActionBtn, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]} onPress={() => openEdit(item)}>
                            <Pencil size={13} color={PALETTE.orange} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.budgetActionBtn, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]} onPress={() => deleteBudgetItem(item)}>
                            <Trash2 size={13} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <View style={styles.budgetNumbersRow}>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Agihan</Text>
                        <Text style={styles.budgetStatValue}>{formatCurrency(agihan)}</Text>
                      </View>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Belanja</Text>
                        <Text style={[styles.budgetStatValue, { color: belanja > 0 ? PALETTE.orange : PALETTE.textMutedDark }]}>{formatCurrency(belanja)}</Text>
                      </View>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Baki</Text>
                        <Text style={[styles.budgetStatValue, { color: '#16a34a' }]}>{formatCurrency(itemBaki)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {totalPages > 1 && (
                <View style={styles.budgetPaginationRow}>
                  <TouchableOpacity
                    style={[styles.budgetPageBtn, page === 0 && styles.budgetPageBtnDisabled]}
                    onPress={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <Text style={[styles.budgetPageBtnText, page === 0 && styles.budgetPageBtnTextDisabled]}>‹</Text>
                  </TouchableOpacity>

                  <Text style={styles.budgetPageIndicator}>{page + 1} / {totalPages}</Text>

                  <TouchableOpacity
                    style={[styles.budgetPageBtn, page === totalPages - 1 && styles.budgetPageBtnDisabled]}
                    onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                  >
                    <Text style={[styles.budgetPageBtnText, page === totalPages - 1 && styles.budgetPageBtnTextDisabled]}>›</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <BudgetEditModal
        visible={modalVisible}
        isNew={!editItem}
        kategori={kategori}
        setKategori={setKategori}
        rows={rows}
        setRows={setRows}
        existingCategories={existingCategories}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}