import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, PanResponder, ScrollView, Modal, TextInput } from 'react-native';
import { Wallet, Pencil, Trash2, FolderOpen, AlertTriangle, Check, Plus, X, TrendingUp } from 'lucide-react-native';
import { PALETTE } from '../../constants/palette';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { kewanganStyles as styles } from './kewanganStyles';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import SectionHeader from '../pentadbiran/SectionHeader';
import BudgetEditModal from './BudgetEditModal';

const EMPTY_ROW = { perihal: '', agihan: '', belanja: '' };
const CARD_WIDTH = 170;
const CARD_GAP = 10;
const PX_PER_SECOND = 35;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;
const ITEMS_PER_PAGE = 5;

export default function BudgetSection({ budgetData, loading, isEditMode, saveBudgetItem, deleteBudgetItem, deleteCategory, renameCategory, onNotify }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [kategori, setKategori] = useState('');
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(0);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const displayDeleteItemRef = useRef(null);
  if (confirmDeleteItem !== null) displayDeleteItemRef.current = confirmDeleteItem;
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(null);
  const displayDeleteCategoryRef = useRef(null);
  if (confirmDeleteCategory !== null) displayDeleteCategoryRef.current = confirmDeleteCategory;

  // ── Modale "Urus Kategori" : renommer + éditer/ajouter/retirer tous les perkara de la catégorie en une fois ──
  const [manageTarget, setManageTarget] = useState(null); // nom de la catégorie en cours de gestion, ou null
  const [manageNameDraft, setManageNameDraft] = useState('');
  const [manageRows, setManageRows] = useState([]); // { id, perihal, agihan, belanja } — id=null pour une nouvelle ligne
  const [manageError, setManageError] = useState(null);
  const [isManageSaving, setIsManageSaving] = useState(false);
  const [manageDeleteIndex, setManageDeleteIndex] = useState(null);
  const displayManageDeleteRef = useRef(null);
  if (manageDeleteIndex !== null) displayManageDeleteRef.current = manageRows[manageDeleteIndex];
  const [isDeletingManageRow, setIsDeletingManageRow] = useState(false);

  // ── Modale légère : modifier un seul perkara depuis la liste, sans passer par "Urus Kategori" ──
  const [editSingleItem, setEditSingleItem] = useState(null); // l'item en cours de modification, ou null
  const [editSingleDraft, setEditSingleDraft] = useState({ perihal: '', agihan: '', belanja: '' });
  const [editSingleError, setEditSingleError] = useState(null);
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  const openEditSingle = (item) => {
    setEditSingleItem(item);
    setEditSingleDraft({ perihal: item.perihal, agihan: String(item.agihan), belanja: String(item.belanja) });
    setEditSingleError(null);
  };
  const closeEditSingle = () => {
    setEditSingleItem(null);
    setEditSingleDraft({ perihal: '', agihan: '', belanja: '' });
    setEditSingleError(null);
  };
  const handleEditSingleSave = async () => {
    if (!editSingleDraft.perihal.trim() || !editSingleDraft.agihan.trim()) {
      setEditSingleError('Perihal dan agihan tidak boleh kosong.');
      return;
    }
    setEditSingleError(null);
    setIsSavingSingle(true);
    const ok = await saveBudgetItem(
      { kategori: editSingleItem.kategori, perihal: editSingleDraft.perihal, agihan: editSingleDraft.agihan, belanja: editSingleDraft.belanja || '0' },
      editSingleItem
    );
    setIsSavingSingle(false);
    if (ok) {
      closeEditSingle();
      onNotify?.('success', 'Bajet berjaya dikemaskini.');
    } else {
      onNotify?.('error', 'Gagal menyimpan bajet.');
    }
  };

  const openManage = (kat) => {
    setManageTarget(kat);
    setManageNameDraft(kat);
    setManageRows((grouped[kat] || []).map((item) => ({
      id: item.id, perihal: item.perihal, agihan: String(item.agihan), belanja: String(item.belanja),
    })));
    setManageError(null);
  };
  const closeManage = () => {
    setManageTarget(null);
    setManageNameDraft('');
    setManageRows([]);
    setManageError(null);
  };
  const updateManageRow = (index, field, value) => {
    setManageRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const addManageRow = () => {
    setManageRows((prev) => [...prev, { id: null, perihal: '', agihan: '', belanja: '' }]);
  };
  const requestDeleteManageRow = (index) => setManageDeleteIndex(index);
  const confirmDeleteManageRow = async () => {
    const index = manageDeleteIndex;
    const row = manageRows[index];
    if (row.id) {
      setIsDeletingManageRow(true);
      const ok = await deleteBudgetItem(row);
      setIsDeletingManageRow(false);
      if (ok === false) {
        onNotify?.('error', 'Gagal memadam perkara.');
        setManageDeleteIndex(null);
        return;
      }
    }
    setManageRows((prev) => prev.filter((_, i) => i !== index));
    setManageDeleteIndex(null);
  };
  const handleManageSave = async () => {
    if (!manageNameDraft.trim()) {
      setManageError('Nama kategori tidak boleh kosong.');
      return;
    }
    const hasInvalidRow = manageRows.some((r) => !r.perihal.trim() || !String(r.agihan).trim());
    if (hasInvalidRow) {
      setManageError('Sila lengkapkan perihal dan agihan untuk setiap perkara.');
      return;
    }
    setManageError(null);
    setIsManageSaving(true);

    const newName = manageNameDraft.trim();
    if (newName !== manageTarget) {
      const ok = await renameCategory(manageTarget, newName);
      if (!ok) {
        setIsManageSaving(false);
        onNotify?.('error', 'Gagal menamakan semula kategori.');
        return;
      }
    }

    let allOk = true;
    for (const row of manageRows) {
      const payload = { kategori: newName, perihal: row.perihal, agihan: row.agihan, belanja: row.belanja || '0' };
      const ok = await saveBudgetItem(payload, row.id ? row : null);
      if (!ok) allOk = false;
    }

    setIsManageSaving(false);
    if (allOk) {
      setSelectedCategory(newName);
      closeManage();
      onNotify?.('success', 'Kategori berjaya dikemaskini.');
    } else {
      onNotify?.('error', 'Sebahagian perkara gagal disimpan.');
    }
  };

  const totalAgihan = budgetData.reduce((sum, item) => sum + parseCurrency(item.agihan), 0);
  const totalBelanja = budgetData.reduce((sum, item) => sum + parseCurrency(item.belanja), 0);
  const baki = totalAgihan - totalBelanja;

  const grouped = budgetData.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});
  // Pas de tri alphabétique : garde l'ordre d'apparition (budgetData est déjà trié par id croissant),
  // pour qu'une nouvelle catégorie s'ajoute toujours à la fin sans jamais réarranger les pills existantes
  const existingCategories = Object.keys(grouped);

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
  const [hovered, setHovered] = useState(false);

  const contentWidth = Math.max(1, existingCategories.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP);
  const active = existingCategories.length > 1 && !modalVisible && !hovered;

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

  const openAdd = () => {
    setEditItem(null);
    setKategori('');
    setRows([{ ...EMPTY_ROW }]);
    setFormError(null);
    setModalVisible(true);
  };
  const handleSave = async () => {
    if (!kategori.trim()) {
      setFormError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (existingCategories.includes(kategori.trim())) {
      setFormError('Kategori ini sudah wujud. Gunakan "Urus Kategori" untuk menambah perkara padanya.');
      return;
    }
    const hasIncompleteRow = rows.some((r) => !r.perihal.trim() || !String(r.agihan).trim());
    if (hasIncompleteRow) {
      setFormError('Sila lengkapkan perihal dan agihan untuk setiap perkara.');
      return;
    }
    setFormError(null);
    setIsSaving(true);

    let allOk = true;
    for (const row of rows) {
      const ok = await saveBudgetItem({ kategori: kategori.trim(), ...row }, null);
      if (!ok) allOk = false;
    }
    setIsSaving(false);
    if (allOk) {
      setSelectedCategory(kategori.trim());
      setModalVisible(false);
      onNotify?.('success', 'Kategori baharu berjaya ditambah.');
    } else {
      onNotify?.('error', 'Gagal menambah sebahagian atau semua perkara bajet.');
    }
  };

  return (
    <>
      {!loading && (
        <View style={[styles.card, { position: 'relative' }]}>
          {isEditMode && (
            <TouchableOpacity style={styles.categoryAddBtnFloating} onPress={openAdd}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          )}

          <SectionHeader title="KATEGORI PERBELANJAAN" Icon={FolderOpen} />

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
              <Text style={[styles.kpiTitle, { color: PALETTE.blue }]}>Jumlah Agihan</Text>
              <Text style={[styles.kpiValue, { color: PALETTE.blue }]}>RM {formatCurrency(totalAgihan)}</Text>
              <Wallet size={26} color={PALETTE.blue} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
            </View>
            <View style={[styles.kpiCard, { backgroundColor: PALETTE.softOrangeBg, borderColor: 'rgba(249, 115, 22, 0.25)' }]}>
              <Text style={[styles.kpiTitle, { color: PALETTE.orange }]}>Jumlah Belanja</Text>
              <Text style={[styles.kpiValue, { color: PALETTE.orange }]}>RM {formatCurrency(totalBelanja)}</Text>
              <TrendingUp size={26} color={PALETTE.orange} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
            </View>
            <View style={[styles.kpiCard, { backgroundColor: 'rgba(22, 163, 74, 0.08)', borderColor: 'rgba(22, 163, 74, 0.25)' }]}>
              <Text style={[styles.kpiTitle, { color: '#16a34a' }]}>Baki Semasa</Text>
              <Text style={[styles.kpiValue, { color: '#16a34a' }]}>RM {formatCurrency(baki)}</Text>
              <Check size={26} color="#16a34a" style={{ position: 'absolute', top: 10, right: 10, opacity: 0.35 }} />
            </View>
          </View>

          {loading && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginVertical: 20 }} />}

          {!loading && (existingCategories.length === 0 ? (
            <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
              Tiada kategori lagi.
            </Text>
          ) : (
          <>
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
              scrollEnabled={false}
              onScroll={handleNativeScroll}
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
                      <>
                        <TouchableOpacity
                          style={[styles.categoryDeleteBtn, { right: 34 }]}
                          onPress={() => openManage(kat)}
                        >
                          <Pencil size={13} color={PALETTE.orange} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.categoryDeleteBtn}
                          onPress={() => setConfirmDeleteCategory(kat)}
                        >
                          <Trash2 size={13} color={PALETTE.orange} />
                        </TouchableOpacity>
                      </>
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
                          <TouchableOpacity style={[styles.budgetActionBtn, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]} onPress={() => openEditSingle(item)}>
                            <Pencil size={13} color={PALETTE.orange} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.budgetActionBtn, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]} onPress={() => setConfirmDeleteItem(item)}>
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
          </>
          ))}
        </View>
      )}

      <Modal visible={confirmDeleteCategory !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteCategory(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Kategori</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam kategori "{displayDeleteCategoryRef.current}" beserta {budgetData.filter((item) => item.kategori === displayDeleteCategoryRef.current).length} perkara di dalamnya? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDeleteCategory(null)}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={pentadbiranStyles.confirmConfirmBtn}
                onPress={async () => {
                  const kat = confirmDeleteCategory;
                  setConfirmDeleteCategory(null);
                  const ok = await deleteCategory(kat);
                  onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam kategori.' : 'Kategori berjaya dipadam.');
                }}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmDeleteItem !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteItem(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Bajet</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam bajet ini{displayDeleteItemRef.current?.perihal ? ` "${displayDeleteItemRef.current.perihal}"` : ''}? Tindakan ini tidak boleh dibatalkan.
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
                  const ok = await deleteBudgetItem(item);
                  onNotify?.(ok === false ? 'error' : 'success', ok === false ? 'Gagal memadam bajet.' : 'Bajet berjaya dipadam.');
                }}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={manageTarget !== null} transparent animationType="fade" onRequestClose={closeManage}>
        <View style={pentadbiranStyles.modalOverlay}>
          <View style={[pentadbiranStyles.modalContainer, { maxWidth: 460 }]}>
            <View style={pentadbiranStyles.modalHeader}>
              <Text style={pentadbiranStyles.modalTitle}>Urus Kategori</Text>
              <TouchableOpacity onPress={closeManage}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={pentadbiranStyles.modalBody}>
              <Text style={pentadbiranStyles.inputLabel}>Nama Kategori</Text>
              <TextInput
                style={pentadbiranStyles.modalInput}
                value={manageNameDraft}
                onChangeText={setManageNameDraft}
                placeholder="Cth: 27000"
                placeholderTextColor={PALETTE.textMutedDark}
              />

              <Text style={[pentadbiranStyles.inputLabel, { marginTop: 18 }]}>Perkara</Text>
              {manageRows.map((row, index) => (
                <View key={row.id ?? `new-${index}`} style={styles.multiRowBlock}>
                  <View style={styles.multiRowHeader}>
                    <Text style={styles.multiRowIndex}>Perkara {index + 1}</Text>
                    <TouchableOpacity style={styles.multiRowDeleteBtn} onPress={() => requestDeleteManageRow(index)}>
                      <Trash2 size={13} color="#dc2626" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[pentadbiranStyles.modalInput, { marginBottom: 10 }]}
                    value={row.perihal}
                    onChangeText={(t) => updateManageRow(index, 'perihal', t)}
                    placeholder="Perihal — Cth: E. Kasut"
                    placeholderTextColor={PALETTE.textMutedDark}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={pentadbiranStyles.inputLabel}>Agihan (RM)</Text>
                      <TextInput
                        style={pentadbiranStyles.modalInput}
                        value={row.agihan}
                        onChangeText={(t) => updateManageRow(index, 'agihan', t)}
                        placeholder="20000.00"
                        keyboardType="numeric"
                        placeholderTextColor={PALETTE.textMutedDark}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={pentadbiranStyles.inputLabel}>Belanja (RM)</Text>
                      <TextInput
                        style={pentadbiranStyles.modalInput}
                        value={row.belanja}
                        onChangeText={(t) => updateManageRow(index, 'belanja', t)}
                        placeholder="150.00"
                        keyboardType="numeric"
                        placeholderTextColor={PALETTE.textMutedDark}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addRowBtn} onPress={addManageRow}>
                <Plus size={14} color={PALETTE.orange} />
                <Text style={styles.addRowBtnText}>Tambah Perkara Lain</Text>
              </TouchableOpacity>

              {!!manageError && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginBottom: 12 }}>{manageError}</Text>}
              <TouchableOpacity
                style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, isManageSaving && { opacity: 0.7 }]}
                onPress={handleManageSave}
                disabled={isManageSaving}
              >
                {isManageSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={16} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={manageDeleteIndex !== null} transparent animationType="fade" onRequestClose={() => setManageDeleteIndex(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Perkara</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam perkara ini{displayManageDeleteRef.current?.perihal ? ` "${displayManageDeleteRef.current.perihal}"` : ''}? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>

            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setManageDeleteIndex(null)} disabled={isDeletingManageRow}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pentadbiranStyles.confirmConfirmBtn, isDeletingManageRow && { opacity: 0.7 }]}
                onPress={confirmDeleteManageRow}
                disabled={isDeletingManageRow}
              >
                {isDeletingManageRow ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editSingleItem !== null} transparent animationType="fade" onRequestClose={closeEditSingle}>
        <View style={pentadbiranStyles.modalOverlay}>
          <View style={pentadbiranStyles.modalContainer}>
            <View style={pentadbiranStyles.modalHeader}>
              <Text style={pentadbiranStyles.modalTitle}>Kemaskini Perkara</Text>
              <TouchableOpacity onPress={closeEditSingle}><X size={22} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <View style={pentadbiranStyles.modalBody}>
              <Text style={pentadbiranStyles.inputLabel}>Perihal</Text>
              <TextInput
                style={pentadbiranStyles.modalInput}
                value={editSingleDraft.perihal}
                onChangeText={(t) => setEditSingleDraft((prev) => ({ ...prev, perihal: t }))}
                placeholder="Perihal — Cth: E. Kasut"
                placeholderTextColor={PALETTE.textMutedDark}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={pentadbiranStyles.inputLabel}>Agihan (RM)</Text>
                  <TextInput
                    style={pentadbiranStyles.modalInput}
                    value={editSingleDraft.agihan}
                    onChangeText={(t) => setEditSingleDraft((prev) => ({ ...prev, agihan: t }))}
                    placeholder="20000.00"
                    keyboardType="numeric"
                    placeholderTextColor={PALETTE.textMutedDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={pentadbiranStyles.inputLabel}>Belanja (RM)</Text>
                  <TextInput
                    style={pentadbiranStyles.modalInput}
                    value={editSingleDraft.belanja}
                    onChangeText={(t) => setEditSingleDraft((prev) => ({ ...prev, belanja: t }))}
                    placeholder="150.00"
                    keyboardType="numeric"
                    placeholderTextColor={PALETTE.textMutedDark}
                  />
                </View>
              </View>

              {!!editSingleError && <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 12 }}>{editSingleError}</Text>}
              <TouchableOpacity
                style={[styles.saveButton, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, isSavingSingle && { opacity: 0.7 }]}
                onPress={handleEditSingleSave}
                disabled={isSavingSingle}
              >
                {isSavingSingle ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={16} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BudgetEditModal
        visible={modalVisible}
        kategori={kategori}
        setKategori={setKategori}
        rows={rows}
        setRows={setRows}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
        error={formError}
        isSaving={isSaving}
      />
    </>
  );
}